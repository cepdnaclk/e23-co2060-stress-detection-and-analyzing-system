import TherapyHubExercise from "../models/TherapyHubExercise.js";

export const getTherapyHubExercises = async (req, res) => {
  try {
    const exercises = await TherapyHubExercise.find().sort({ displayOrder: 1 });
    return res.status(200).json({
      success: true,
      exercises,
    });
  } catch (error) {
    console.error("Error in getTherapyHubExercises controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server error",
      error: error.message,
    });
  }
};
