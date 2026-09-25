import * as googleCalendarService from "../services/googleCalendarService.js";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";

export const generateAuthUrlController = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    // Pass userId as state to retrieve it in callback
    const url = googleCalendarService.getAuthUrl(userId);
    res.json({ url });
  } catch (error) {
    console.error("Error generating Google Auth URL:", error);
    res.status(500).json({ error: "Failed to generate authentication URL" });
  }
};

export const callback = async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state;

  if (!code || !userId) {
    return res.status(400).send("Invalid request parameters.");
  }

  try {
    const tokens = await googleCalendarService.getTokensFromCode(code);
    
    // We only receive refresh_token on the first authorization.
    // If we want to force getting a refresh token, we pass prompt: 'consent' which is done in the service.
    
    const updateData = { googleCalendarConnected: true };
    if (tokens.refresh_token) {
        updateData.googleRefreshToken = tokens.refresh_token;
    }

    const user = await User.findById(userId);
    if (user) {
      await User.findByIdAndUpdate(userId, updateData);
    } else {
      const doctor = await Doctor.findById(userId);
      if (doctor) {
        await Doctor.findByIdAndUpdate(userId, updateData);
      } else {
        return res.status(404).send("User/Doctor not found.");
      }
    }

    // Redirect to app or show success message
    res.send(`
        <html>
            <body>
                <h2>Google Calendar Connected Successfully!</h2>
                <p>You can close this window and return to the CareWave app.</p>
                <script>
                    setTimeout(() => {
                        window.close();
                    }, 3000);
                </script>
            </body>
        </html>
    `);

  } catch (error) {
    console.error("Google OAuth Callback Error:", error);
    res.status(500).send("Failed to authenticate with Google Calendar.");
  }
};

export const getStatus = async (req, res) => {
    try {
        let account = await User.findById(req.user._id);
        if (!account) {
            account = await Doctor.findById(req.user._id);
        }
        res.json({
            connected: account?.googleCalendarConnected || false
        });
    } catch (error) {
        console.error("Error checking calendar status:", error);
        res.status(500).json({ error: "Failed to check calendar status" });
    }
};

export const createEvent = async (req, res) => {
    try {
        let account = await User.findById(req.user._id);
        if (!account) {
            account = await Doctor.findById(req.user._id);
        }
        if (!account || !account.googleRefreshToken) {
            return res.status(401).json({ error: "Google Calendar not connected" });
        }
        
        const eventDetails = req.body.eventDetails; // Expecting { summary, description, start: { dateTime, timeZone }, end: { dateTime, timeZone } }
        if (!eventDetails) {
            return res.status(400).json({ error: "Event details are required" });
        }

        const createdEvent = await googleCalendarService.createCalendarEvent(account.googleRefreshToken, eventDetails);
        res.json({ success: true, googleEventId: createdEvent.id, event: createdEvent });

    } catch (error) {
        console.error("Error creating Google Calendar event:", error);
        res.status(500).json({ error: "Failed to create event in Google Calendar" });
    }
};

export const updateEvent = async (req, res) => {
    try {
        let account = await User.findById(req.user._id);
        if (!account) {
            account = await Doctor.findById(req.user._id);
        }
        if (!account || !account.googleRefreshToken) {
            return res.status(401).json({ error: "Google Calendar not connected" });
        }

        const { eventId, eventDetails } = req.body;
        if (!eventId || !eventDetails) {
            return res.status(400).json({ error: "Event ID and details are required" });
        }

        const updatedEvent = await googleCalendarService.updateCalendarEvent(account.googleRefreshToken, eventId, eventDetails);
        res.json({ success: true, event: updatedEvent });

    } catch (error) {
        console.error("Error updating Google Calendar event:", error);
        res.status(500).json({ error: "Failed to update event in Google Calendar" });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        let account = await User.findById(req.user._id);
        if (!account) {
            account = await Doctor.findById(req.user._id);
        }
        if (!account || !account.googleRefreshToken) {
            return res.status(401).json({ error: "Google Calendar not connected" });
        }

        const { eventId } = req.params;
        if (!eventId) {
            return res.status(400).json({ error: "Event ID is required" });
        }

        await googleCalendarService.deleteCalendarEvent(account.googleRefreshToken, eventId);
        res.json({ success: true, message: "Event deleted from Google Calendar" });

    } catch (error) {
        console.error("Error deleting Google Calendar event:", error);
        res.status(500).json({ error: "Failed to delete event in Google Calendar" });
    }
};

