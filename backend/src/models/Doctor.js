import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const doctorSchema = new mongoose.Schema(
  {
    // Authentication
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // Personal Information
    fullName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    biography: {
      type: String,
      default: "",
    },

    // Professional Information
    qualifications: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    hospital: {
      type: String,
      required: true,
    },
    yearsOfExperience: {
      type: Number,
      required: true,
    },
    languages: [
      {
        type: String,
      },
    ],

    // Status
    availability: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "inactive", // Only admin can activate
    },

    // Ratings
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },

    // Counts
    totalPatients: {
      type: Number,
      default: 0,
    },
    totalConsultations: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Hash password before saving
doctorSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
doctorSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};

// Hide password on toJSON
doctorSchema.methods.toJSON = function () {
  const doctor = this.toObject();
  delete doctor.password;
  return doctor;
};

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
