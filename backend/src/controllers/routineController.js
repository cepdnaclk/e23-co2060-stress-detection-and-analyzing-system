import Routine from "../models/Routine.js";

function normalizeBlocks(blocks) {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .map((block) => ({
      start: String(block?.start || "").slice(0, 5),
      end: String(block?.end || "").slice(0, 5),
      activity: String(block?.activity || "").trim(),
      type: ["activity", "break", "meal", "free"].includes(block?.type)
        ? block.type
        : "activity",
    }))
    .filter((block) => block.start && block.end && block.activity);
}

function buildRoutinePayload(body = {}) {
  const timetable = body.timetable || body.routine || body.schedule || null;
  const blocks = normalizeBlocks(body.blocks || timetable?.blocks);

  if (blocks.length === 0) {
    throw new Error("Routine blocks are required");
  }

  return {
    title: String(body.title || timetable?.title || "Routine").trim(),
    date: String(body.date || timetable?.date || new Date().toISOString().slice(0, 10)),
    summary: String(body.summary || timetable?.summary || "").trim(),
    alertText: String(body.alertText || timetable?.raw_text || body.rawText || "").trim(),
    sourceText: String(body.sourceText || body.rawText || timetable?.raw_text || "").trim(),
    blocks,
  };
}

export const saveRoutine = async (req, res) => {
  try {
    const payload = buildRoutinePayload(req.body);

    const routine = await Routine.create({
      user: req.user._id,
      ...payload,
    });

    return res.status(201).json({
      message: "Routine saved",
      routine,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Failed to save routine",
    });
  }
};

export const getRoutines = async (req, res) => {
  try {
    const routines = await Routine.find({ user: req.user._id })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return res.json({ routines });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch routines",
    });
  }
};

export const getRoutineById = async (req, res) => {
  try {
    const routine = await Routine.findOne({ _id: req.params.id, user: req.user._id }).lean();

    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    return res.json({ routine });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch routine" });
  }
};

export const updateRoutine = async (req, res) => {
  try {
    const payload = buildRoutinePayload(req.body);

    const routine = await Routine.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    return res.json({
      message: "Routine updated",
      routine,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Failed to update routine",
    });
  }
};

export const deleteRoutine = async (req, res) => {
  try {
    const routine = await Routine.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    return res.json({ message: "Routine deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete routine" });
  }
};