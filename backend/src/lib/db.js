import mongoose from "mongoose";

const redactMongoUri = (uri) => {
    if (!uri) return uri;
    try {
        const url = new URL(uri);
        if (url.username) url.username = "***";
        if (url.password) url.password = "***";
        return url.toString();
    } catch {
        return uri.replace(/\/\/([^@]+)@/g, "//***:***@");
    }
};

export const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        console.error(
            "Error connecting to database: MONGO_URI is not set. Add it to backend/.env (and restart the server)."
        );
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(mongoUri);
        console.log(`Database connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        const message = typeof error?.message === "string" ? error.message : "";
        const isAuthFailure =
            message.toLowerCase().includes("authentication failed") ||
            message.toLowerCase().includes("bad auth") ||
            error?.codeName === "AtlasError" ||
            error?.code === 8000;

        console.error(
            `Error connecting to database${isAuthFailure ? " (authentication failed)" : ""}: ${message || error}`
        );
        console.error(`Mongo URI (redacted): ${redactMongoUri(mongoUri)}`);

        if (isAuthFailure) {
            console.error(
                "Fix: verify the MongoDB Atlas Database User username/password in MONGO_URI. If the password contains special characters, URL-encode it (e.g. @ -> %40)."
            );
        }
        process.exit(1); // exit with failure
    }
};