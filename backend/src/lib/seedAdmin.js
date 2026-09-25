import User from "../models/User.js";

export const seedAdminUser = async () => {
  const adminUsername = process.env.ADMIN_USERNAME || "Admin";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.log("Admin seed skipped: ADMIN_PASSWORD not set");
    return;
  }

  const existingAdmin = await User.findOne({
    username: { $regex: `^${adminUsername}$`, $options: "i" },
  });

  if (existingAdmin) {
    if (existingAdmin.role !== "super_admin") {
      existingAdmin.role = "super_admin";
      await existingAdmin.save();
      console.log("Admin seed: existing user promoted to super admin");
    } else {
      console.log("Admin seed: super admin already exists");
    }

    return;
  }

  const adminUser = new User({
    username: adminUsername,
    age: 30,
    gender: "other",
    password: adminPassword,
    role: "super_admin",
    profileImage: `https://avatars.dicebear.com/7.x/avataaars/svg?seed=${adminUsername}`,
  });

  await adminUser.save();
  console.log("Admin seed: admin user created");
};
