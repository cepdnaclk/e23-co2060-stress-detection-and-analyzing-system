import DoctorAvailability from "../models/DoctorAvailability.js";
import Appointment from "../models/Appointment.js";
// import * as googleCalendarService from "./googleCalendarService.js"; // For future phase

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Parses "HH:mm" into minutes since midnight.
 */
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Formats minutes since midnight into "HH:mm".
 */
function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export const generateAvailableSlots = async (doctorId, dateStr) => {
  // dateStr is YYYY-MM-DD
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    throw new Error("Invalid date format");
  }

  // 1. Fetch Doctor's general availability rules for this date
  const availabilities = await DoctorAvailability.find({
    doctorId,
    date: dateStr,
    active: true,
  }).sort({ startTime: 1 });

  if (!availabilities.length) {
    return []; // No slots available today
  }

  // 2. Fetch existing appointments for this doctor on this date
  const existingAppointments = await Appointment.find({
    doctorId,
    appointmentDate: dateStr,
    status: { $in: ["Pending", "Accepted", "Completed"] },
  }).select("startTime endTime");

  const bookedSlots = existingAppointments.map(app => ({
    start: parseTime(app.startTime),
    end: parseTime(app.endTime),
  }));

  // 3. Generate slots based on duration
  const slots = [];

  for (const rule of availabilities) {
    let currentStart = parseTime(rule.startTime);
    const ruleEnd = parseTime(rule.endTime);
    const duration = rule.slotDuration || 30;

    while (currentStart + duration <= ruleEnd) {
      const currentEnd = currentStart + duration;
      
      // Check if this generated slot overlaps with any booked slots
      const isBooked = bookedSlots.some(booked => 
        (currentStart >= booked.start && currentStart < booked.end) || // overlaps start
        (currentEnd > booked.start && currentEnd <= booked.end) ||     // overlaps end
        (currentStart <= booked.start && currentEnd >= booked.end)     // completely envelops
      );

      slots.push({
        startTime: formatTime(currentStart),
        endTime: formatTime(currentEnd),
        available: !isBooked,
      });

      currentStart = currentEnd;
    }
  }

  // 4. (Future) Google calendar busy times integration goes here

  return slots;
};
