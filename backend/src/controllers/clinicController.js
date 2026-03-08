import axios from "axios";

/**
 * Get Nearby Psychiatrists via Google Places API
 */
export const getNearbyClinics = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                message: "latitude and longitude are required",
            });
        }

        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
            {
                params: {
                    location: `${latitude},${longitude}`,
                    radius: 5000,
                    keyword: "psychiatrist",
                    key: process.env.GOOGLE_MAPS_API_KEY,
                },
            }
        );

        const clinics = response.data.results.slice(0, 10);

        res.status(200).json({ clinics });

    } catch (error) {
        console.log("Error in getNearbyClinics controller:", error);

        res.status(500).json({
            message: "Internal Server error",
        });
    }
};
