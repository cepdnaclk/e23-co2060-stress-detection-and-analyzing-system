import DoctorAvailability from "../models/DoctorAvailability.js";
import mongoose from "mongoose";
import { generateAvailableSlots } from "../services/availabilityService.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/doctors/:doctorId/availability
export const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const availability = await DoctorAvailability.find({ doctorId, active: true }).sort({ date: 1, startTime: 1 });
    
    return res.status(200).json({
      total: availability.length,
      availability,
    });
  } catch (error) {
    console.error("Error fetching doctor availability:", error);
    return res.status(500).json({ message: "Error fetching availability", error: error.message });
  }
};

// POST /api/doctors/availability
export const createDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.user?._id;
    const { date, startTime, endTime, slotDuration, active } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: "date, startTime, and endTime are required" });
    }

    // Basic validation for time format and logic could be added here
    if (startTime >= endTime) {
      return res.status(400).json({ message: "startTime must be before endTime" });
    }

    const availability = await DoctorAvailability.create({
      doctorId,
      date,
      startTime,
      endTime,
      slotDuration: slotDuration || 30,
      active: active !== undefined ? active : true,
    });

    return res.status(201).json({
      message: "Availability created successfully",
      availability,
    });
  } catch (error) {
    console.error("Error creating availability:", error);
    return res.status(500).json({ message: "Error creating availability", error: error.message });
  }
};

// PUT /api/doctors/availability/:id
export const updateDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.user?._id;
    const { id } = req.params;
    const { date, startTime, endTime, slotDuration, active } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid availability id" });
    }

    const availability = await DoctorAvailability.findById(id);

    if (!availability) {
      return res.status(404).json({ message: "Availability not found" });
    }

    if (String(availability.doctorId) !== String(doctorId)) {
      return res.status(403).json({ message: "Forbidden: You can only edit your own availability" });
    }

    if (startTime && endTime && startTime >= endTime) {
      return res.status(400).json({ message: "startTime must be before endTime" });
    }

    availability.date = date || availability.date;
    availability.startTime = startTime || availability.startTime;
    availability.endTime = endTime || availability.endTime;
    availability.slotDuration = slotDuration || availability.slotDuration;
    if (active !== undefined) {
      availability.active = active;
    }

    await availability.save();

    return res.status(200).json({
      message: "Availability updated successfully",
      availability,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    return res.status(500).json({ message: "Error updating availability", error: error.message });
  }
};

// DELETE /api/doctors/availability/:id
export const deleteDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.user?._id;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid availability id" });
    }

    const availability = await DoctorAvailability.findById(id);

    if (!availability) {
      return res.status(404).json({ message: "Availability not found" });
    }

    if (String(availability.doctorId) !== String(doctorId)) {
      return res.status(403).json({ message: "Forbidden: You can only delete your own availability" });
    }

    await DoctorAvailability.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Availability deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting availability:", error);
    return res.status(500).json({ message: "Error deleting availability", error: error.message });
  }
};

// GET /api/doctors/:doctorId/available-slots?date=YYYY-MM-DD
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    if (!date) {
      return res.status(400).json({ message: "date query parameter is required (YYYY-MM-DD)" });
    }

    const slots = await generateAvailableSlots(doctorId, date);

    return res.status(200).json({
      doctorId,
      date,
      slots,
    });
  } catch (error) {
    console.error("Error generating available slots:", error);
    return res.status(500).json({ message: "Error generating available slots", error: error.message });
  }
};
