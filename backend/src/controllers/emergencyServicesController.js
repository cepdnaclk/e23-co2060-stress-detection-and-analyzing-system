/**
 * emergencyServicesController.js
 *
 * CRUD operations for Emergency Mental Health Services.
 *
 * Routes (all under /api/emergency-services):
 *   GET    /        -> all services sorted by displayOrder (public)
 *   POST   /        -> create a new service (admin only)
 *   PUT    /:id     -> update a service    (admin only)
 *   DELETE /:id     -> delete a service    (admin only)
 */

import EmergencyMentalHealthService from "../models/EmergencyMentalHealthService.js";

// ─── GET /api/emergency-services ─────────────────────────────────────────────
export const getServices = async (req, res) => {
  try {
    const services = await EmergencyMentalHealthService.find()
      .sort({ displayOrder: 1 })
      .lean();
    return res.status(200).json({ success: true, services });
  } catch (error) {
    console.error("Error in getServices:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ─── POST /api/emergency-services ────────────────────────────────────────────
export const createService = async (req, res) => {
  try {
    const { serviceName, contact, description, displayOrder } = req.body;

    if (!serviceName || !contact || !description) {
      return res.status(400).json({
        success: false,
        message: "serviceName, contact and description are required.",
      });
    }

    const service = await EmergencyMentalHealthService.create({
      serviceName: serviceName.trim(),
      contact: contact.trim(),
      description: description.trim(),
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
    });

    return res.status(201).json({ success: true, service });
  } catch (error) {
    console.error("Error in createService:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ─── PUT /api/emergency-services/:id ─────────────────────────────────────────
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceName, contact, description, displayOrder } = req.body;

    const update = {};
    if (serviceName !== undefined) update.serviceName = serviceName.trim();
    if (contact !== undefined)     update.contact     = contact.trim();
    if (description !== undefined) update.description = description.trim();
    if (displayOrder !== undefined) update.displayOrder = Number(displayOrder);

    const service = await EmergencyMentalHealthService.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    return res.status(200).json({ success: true, service });
  } catch (error) {
    console.error("Error in updateService:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ─── DELETE /api/emergency-services/:id ──────────────────────────────────────
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await EmergencyMentalHealthService.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    return res.status(200).json({ success: true, message: "Service deleted successfully." });
  } catch (error) {
    console.error("Error in deleteService:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
