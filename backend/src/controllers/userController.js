import User from "../models/User.js";
import jwt from "jsonwebtoken";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
    return jwt.sign(
        { userId: id },
        process.env.JWT_SECRET,
        { expiresIn: "15d" }
    );
};

/**
 * Register Controller
 */
export const registerUser = async (req, res) => {
    try {
        const { username, age, gender, password } = req.body;

        if (!username || !age || !gender || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                message: "Username must be at least 3 characters",
            });
        }

        if (username.trim().toLowerCase() === "admin") {
            return res.status(400).json({
                message: "Username is reserved",
            });
        }

        // Check if user exists
        const existingUsername = await User.findOne({
            username: { $regex: `^${username}$`, $options: "i" },
        });

        if (existingUsername) {
            return res.status(400).json({
                message: "Username already exists",
            });
        }

        // Generate avatar
        const profileImage = `https://avatars.dicebear.com/7.x/avataaars/svg?seed=${username}`;

        const user = new User({
            username,
            age,
            gender,
            password,
            profileImage,
        });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                age: user.age,
                gender: user.gender,
                username: user.username,
                profileImage: user.profileImage,
                role: user.role,
            },
        });

    } catch (error) {
        console.log("Error in register controller:", error);

        res.status(500).json({
            message: "Internal Server error",
        });
    }
};


/**
 * Login Controller
 */
export const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        // Check user
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({
                message: "User does not exist",
            });
        }

        // Check password
        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                age: user.age,
                gender: user.gender,
                username: user.username,
                profileImage: user.profileImage,
                role: user.role,
            },
        });

    } catch (error) {
        console.log("Error in login controller:", error);

        res.status(500).json({
            message: "Internal Server error",
        });
    }
};

/**
 * Get Current User
 */
export const getMe = async (req, res) => {
    try {
        const user = req.user;

        return res.status(200).json({
            user: {
                id: user._id,
                age: user.age,
                gender: user.gender,
                username: user.username,
                profileImage: user.profileImage,
                role: user.role,
            },
        });
    } catch (error) {
        console.log("Error in getMe controller:", error);
        return res.status(500).json({ message: "Internal Server error" });
    }
};

/**
 * Update Current User (editable signup details)
 */
export const updateMe = async (req, res) => {
    try {
        const { username, age, gender, password } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (username !== undefined) {
            const nextUsername = String(username).trim();

            if (nextUsername.length < 3) {
                return res.status(400).json({ message: "Username must be at least 3 characters" });
            }

            if (nextUsername.toLowerCase() === "admin") {
                return res.status(400).json({ message: "Username is reserved" });
            }

            const existingUsername = await User.findOne({
                _id: { $ne: user._id },
                username: { $regex: `^${escapeRegex(nextUsername)}$`, $options: "i" },
            });

            if (existingUsername) {
                return res.status(400).json({ message: "Username already exists" });
            }

            user.username = nextUsername;
        }

        if (age !== undefined) {
            const nextAge = Number(age);
            if (!Number.isFinite(nextAge) || nextAge <= 0) {
                return res.status(400).json({ message: "Invalid age" });
            }
            user.age = nextAge;
        }

        if (gender !== undefined) {
            const nextGender = String(gender).trim();
            if (!nextGender) {
                return res.status(400).json({ message: "Gender is required" });
            }
            user.gender = nextGender;
        }

        if (password !== undefined) {
            const nextPassword = String(password);
            if (nextPassword.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters" });
            }
            user.password = nextPassword;
        }

        await user.save();

        return res.status(200).json({
            user: {
                id: user._id,
                age: user.age,
                gender: user.gender,
                username: user.username,
                profileImage: user.profileImage,
                role: user.role,
            },
        });
    } catch (error) {
        console.log("Error in updateMe controller:", error);
        return res.status(500).json({ message: "Internal Server error" });
    }
};