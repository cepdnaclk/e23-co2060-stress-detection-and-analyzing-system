import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";

const resolveAuthenticatedEntity = async (decoded) => {
  if (decoded?.role === "volunteer_doctor") {
    const doctor = await Doctor.findById(decoded.userId);
    if (doctor) {
      return { entity: doctor, role: "volunteer_doctor" };
    }
  }

  const user = await User.findById(decoded.userId);
  if (user) {
    return { entity: user, role: user.role || "user" };
  }

  const doctor = await Doctor.findById(decoded.userId);
  if (doctor) {
    return { entity: doctor, role: "volunteer_doctor" };
  }

  return { entity: null, role: null };
};

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { entity, role } = await resolveAuthenticatedEntity(decoded);

    if (!entity) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = entity;
    req.auth = {
      userId: decoded.userId,
      role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { entity, role } = await resolveAuthenticatedEntity(decoded);

    req.user = entity;
    req.auth = entity
      ? {
          userId: decoded.userId,
          role,
        }
      : null;
    return next();
  } catch (error) {
    req.user = null;
    req.auth = null;
    return next();
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

export const requireUser = (req, res, next) => {
  if (!req.user || (req.auth?.role ?? req.user.role) !== "user") {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

export const requireVolunteerDoctor = (req, res, next) => {
  if (!req.user || (req.auth?.role ?? req.user.role) !== "volunteer_doctor") {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};
