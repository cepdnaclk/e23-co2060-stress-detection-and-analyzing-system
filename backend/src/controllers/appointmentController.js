import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Notification from "../models/Notification.js";
import DoctorAssignment from "../models/DoctorAssignment.js";
import mongoose from "mongoose";
import * as googleCalendarService from "../services/googleCalendarService.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));
const normalizeText = (value) => String(value ?? "").trim();

export const createAppointment = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { doctorId, appointmentDate, startTime, endTime, reason } = req.body;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    if (!appointmentDate || !startTime || !endTime || !reason) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.accountStatus !== "active") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Capture DASS Snapshot
    const user = await User.findById(userId).select("questionnaireResults").lean();
    let dassSnapshot = null;
    if (user && Array.isArray(user.questionnaireResults) && user.questionnaireResults.length > 0) {
      const latestResult = user.questionnaireResults[user.questionnaireResults.length - 1];
      dassSnapshot = {
        stress: latestResult.stressScore,
        anxiety: latestResult.anxietyScore,
        depression: latestResult.depressionScore,
        severity: latestResult.stressSeverity, // using stress severity as main indicator
        submittedAt: latestResult.recordedAt,
      };
    }

    const appointment = await Appointment.create({
      patientId: userId,
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      reason: normalizeText(reason),
      dassSnapshot,
      status: "Pending",
    });

    // Notify doctor
    await Notification.create({
      doctorId,
      userId,
      requestId: appointment._id, // reuse requestId field for appointmentId
      audience: "doctor",
      type: "appointment_requested",
      title: "New Appointment Request",
      message: `New appointment requested by a patient for ${appointmentDate} at ${startTime}.`,
    });

    return res.status(201).json({
      message: "Appointment requested successfully",
      appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This slot is already booked" });
    }
    console.error("Error creating appointment:", error);
    return res.status(500).json({ message: "Error creating appointment", error: error.message });
  }
};

export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user?._id;
    const { status } = req.query;

    let filter = { doctorId };
    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "username age gender profileImage")
      .sort({ appointmentDate: 1, startTime: 1 })
      .lean();

    return res.status(200).json({
      total: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({ message: "Error fetching appointments", error: error.message });
  }
};

export const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    const appointments = await Appointment.find({ patientId: userId })
      .populate("doctorId", "fullName specialization hospital profilePicture")
      .sort({ appointmentDate: -1, startTime: -1 })
      .lean();

    const assignments = await DoctorAssignment.find({
      requestId: { $in: appointments.map((appointment) => appointment._id) },
    })
      .select("_id requestId")
      .lean();

    const assignmentByRequestId = new Map(
      assignments.map((assignment) => [String(assignment.requestId), String(assignment._id)])
    );

    const enrichedAppointments = appointments.map((appointment) => ({
      ...appointment,
      assignmentId: assignmentByRequestId.get(String(appointment._id)) ?? null,
    }));

    return res.status(200).json({
      total: enrichedAppointments.length,
      appointments: enrichedAppointments,
    });
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    return res.status(500).json({ message: "Error fetching user appointments", error: error.message });
  }
};

export const acceptAppointment = async (req, res) => {
  try {
    const doctorId = req.user?._id;
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (String(appointment.doctorId) !== String(doctorId)) return res.status(403).json({ message: "Forbidden" });
    if (appointment.status !== "Pending") return res.status(400).json({ message: "Not pending" });

    appointment.status = "Accepted";
    await appointment.save();

    const activeAssignment = await DoctorAssignment.findOne({
      userId: appointment.patientId,
      status: "active",
    });

    if (!activeAssignment) {
      await DoctorAssignment.create({
        userId: appointment.patientId,
        doctorId,
        requestId: appointment._id, // Backwards compatible with existing screens
        status: "active",
        assignedAt: new Date(),
      });
    }

    await Notification.create({
      doctorId,
      userId: appointment.patientId,
      requestId: appointment._id,
      audience: "user",
      type: "appointment_accepted",
      title: "Appointment Accepted",
      message: `Your appointment on ${appointment.appointmentDate} at ${appointment.startTime} was accepted.`,
    });

    // Google Calendar Sync
    try {
      const doctor = await Doctor.findById(doctorId);
      const patient = await User.findById(appointment.patientId);

      // Parse dates (assuming appointmentDate is YYYY-MM-DD, startTime/endTime are HH:mm)
      const startDateTime = new Date(`${appointment.appointmentDate}T${appointment.startTime}:00`).toISOString();
      const endDateTime = new Date(`${appointment.appointmentDate}T${appointment.endTime}:00`).toISOString();
      
      const eventDetails = {
        summary: `CareWave Appointment: ${patient.username} & Dr. ${doctor.fullName}`,
        description: `Reason: ${appointment.reason}`,
        start: { dateTime: startDateTime, timeZone: 'UTC' }, // Assume UTC or generic timezone
        end: { dateTime: endDateTime, timeZone: 'UTC' },
      };

      if (doctor.googleCalendarConnected && doctor.googleRefreshToken) {
        const docEvent = await googleCalendarService.createCalendarEvent(doctor.googleRefreshToken, eventDetails);
        appointment.googleCalendarEventId = docEvent.id; 
      }

      if (patient.googleCalendarConnected && patient.googleRefreshToken) {
        await googleCalendarService.createCalendarEvent(patient.googleRefreshToken, eventDetails);
      }
      
      await appointment.save(); // Save event ID if needed
    } catch (calError) {
      console.error("Failed to sync to Google Calendar:", calError);
      // Don't fail the entire request just because calendar sync failed
    }

    return res.status(200).json({ message: "Accepted", appointment });
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
};

export const rejectAppointment = async (req, res) => {
  try {
    const doctorId = req.user?._id;
    const { appointmentId } = req.params;
    const { reason } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (String(appointment.doctorId) !== String(doctorId)) return res.status(403).json({ message: "Forbidden" });
    if (appointment.status !== "Pending") return res.status(400).json({ message: "Not pending" });

    appointment.status = "Rejected";
    appointment.rejectionReason = normalizeText(reason);
    await appointment.save();

    await Notification.create({
      doctorId,
      userId: appointment.patientId,
      requestId: appointment._id,
      audience: "user",
      type: "appointment_rejected",
      title: "Appointment Rejected",
      message: `Your appointment on ${appointment.appointmentDate} at ${appointment.startTime} was rejected.`,
    });

    return res.status(200).json({ message: "Rejected", appointment });
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
};
