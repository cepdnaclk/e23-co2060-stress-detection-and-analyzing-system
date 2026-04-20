import User from "../models/User.js";

export const getAdminOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: "admin" });

    res.status(200).json({
      totalUsers,
      adminUsers,
    });
  } catch (error) {
    console.log("Error in getAdminOverview controller:", error);
    res.status(500).json({ message: "Internal Server error" });
  }
};
