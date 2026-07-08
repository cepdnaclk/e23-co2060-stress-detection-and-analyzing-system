import Doctor from "../models/Doctor.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ userId: id, role: "volunteer_doctor" }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });
};

/**
 * Admin: Create a new volunteer doctor
 */
export const createDoctor = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      phoneNumber,
      profilePicture,
      qualifications,
      specialization,
      hospital,
      yearsOfExperience,
      languages,
      biography,
    } = req.body;

    // Validation
    if (
      !email ||
      !password ||
      !fullName ||
      !phoneNumber ||
      !qualifications ||
      !specialization ||
      !hospital ||
      yearsOfExperience === undefined
    ) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if email already exists
    const existingDoctor = await Doctor.findOne({ email: email.toLowerCase() });
    if (existingDoctor) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Generate profile picture when one is not provided
    const nextProfilePicture =
      profilePicture || `https://avatars.dicebear.com/7.x/avataaars/svg?seed=${fullName}`;

    // Create doctor
    const doctor = new Doctor({
      email: email.toLowerCase(),
      password,
      fullName,
      phoneNumber,
      profilePicture: nextProfilePicture,
      qualifications,
      specialization,
      hospital,
      yearsOfExperience,
      languages: languages || [],
      biography: biography || "",
      accountStatus: "active",
    });

    await doctor.save();

    res.status(201).json({
      message: "Volunteer doctor created successfully",
      doctor: doctor.toJSON(),
    });
  } catch (error) {
    console.error("Error creating doctor:", error);
    res.status(500).json({ message: "Error creating volunteer doctor", error: error.message });
  }
};

/**
 * Admin: Get all doctors (with optional filters)
 */
export const getAllDoctors = async (req, res) => {
  try {
    const { specialization, status, search } = req.query;
    const filter = {};

    if (specialization) {
      filter.specialization = specialization;
    }

    if (status) {
      filter.accountStatus = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { hospital: { $regex: search, $options: "i" } },
      ];
    }

    const doctors = await Doctor.find(filter).select("-password").sort({ createdAt: -1 });

    res.json({
      total: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Error fetching doctors", error: error.message });
  }
};

/**
 * Admin: Get a specific doctor by ID
 */
export const getDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId).select("-password");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ doctor });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({ message: "Error fetching doctor", error: error.message });
  }
};

/**
 * Admin: Update doctor information
 */
export const updateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const {
      fullName,
      phoneNumber,
      qualifications,
      specialization,
      hospital,
      yearsOfExperience,
      languages,
      profilePicture,
      biography,
      password,
    } = req.body;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Update allowed fields
    if (fullName) doctor.fullName = fullName;
    if (phoneNumber) doctor.phoneNumber = phoneNumber;
    if (profilePicture !== undefined) doctor.profilePicture = profilePicture;
    if (qualifications) doctor.qualifications = qualifications;
    if (specialization) doctor.specialization = specialization;
    if (hospital) doctor.hospital = hospital;
    if (yearsOfExperience !== undefined) doctor.yearsOfExperience = yearsOfExperience;
    if (languages) doctor.languages = languages;
    if (biography !== undefined) doctor.biography = biography;
    if (password) doctor.password = password;

    await doctor.save();

    res.json({
      message: "Doctor updated successfully",
      doctor: doctor.toJSON(),
    });
  } catch (error) {
    console.error("Error updating doctor:", error);
    res.status(500).json({ message: "Error updating doctor", error: error.message });
  }
};

/**
 * Admin: Activate a doctor account
 */
export const activateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { accountStatus: "active" },
      { new: true }
    ).select("-password");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({
      message: "Doctor activated successfully",
      doctor,
    });
  } catch (error) {
    console.error("Error activating doctor:", error);
    res.status(500).json({ message: "Error activating doctor", error: error.message });
  }
};

/**
 * Admin: Deactivate a doctor account
 */
export const deactivateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { accountStatus: "inactive" },
      { new: true }
    ).select("-password");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({
      message: "Doctor deactivated successfully",
      doctor,
    });
  } catch (error) {
    console.error("Error deactivating doctor:", error);
    res.status(500).json({ message: "Error deactivating doctor", error: error.message });
  }
};

/**
 * Admin: Delete a doctor
 */
export const deleteDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findByIdAndDelete(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ message: "Error deleting doctor", error: error.message });
  }
};

/**
 * Doctor: Get their own profile
 */
export const getMyProfile = async (req, res) => {
  try {
    const doctorId = req.user._id;

    const doctor = await Doctor.findById(doctorId).select("-password");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    res.json({ doctor });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

/**
 * Doctor: Update their own profile
 */
export const updateMyProfile = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const {
      phoneNumber,
      qualifications,
      specialization,
      hospital,
      yearsOfExperience,
      languages,
      biography,
    } = req.body;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Only allow doctors to update their own profile
    if (phoneNumber) doctor.phoneNumber = phoneNumber;
    if (qualifications) doctor.qualifications = qualifications;
    if (specialization) doctor.specialization = specialization;
    if (hospital) doctor.hospital = hospital;
    if (yearsOfExperience !== undefined) doctor.yearsOfExperience = yearsOfExperience;
    if (languages) doctor.languages = languages;
    if (biography !== undefined) doctor.biography = biography;

    await doctor.save();

    res.json({
      message: "Profile updated successfully",
      doctor: doctor.toJSON(),
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

/**
 * Doctor: Update availability
 */
export const updateAvailability = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { availability } = req.body;

    if (!availability || !["available", "unavailable"].includes(availability)) {
      return res.status(400).json({ message: "Invalid availability status" });
    }

    const doctor = await Doctor.findByIdAndUpdate(doctorId, { availability }, { new: true }).select(
      "-password"
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({
      message: "Availability updated",
      availability: doctor.availability,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ message: "Error updating availability", error: error.message });
  }
};
