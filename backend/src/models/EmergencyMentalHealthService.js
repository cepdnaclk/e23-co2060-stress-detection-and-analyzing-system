import mongoose from "mongoose";

const emergencyMentalHealthServiceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "emergency_mental_health_services",
  }
);

const EmergencyMentalHealthService = mongoose.model(
  "EmergencyMentalHealthService",
  emergencyMentalHealthServiceSchema
);

export default EmergencyMentalHealthService;
