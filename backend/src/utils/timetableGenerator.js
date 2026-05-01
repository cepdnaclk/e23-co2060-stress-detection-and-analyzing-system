import OpenAI from "openai";

function minutesFromHHMM(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function hhmmFromMinutes(totalMinutes) {
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = String(Math.floor(normalized / 60)).padStart(2, "0");
  const m = String(normalized % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function durationMinutes(startHHMM, endHHMM) {
  const start = minutesFromHHMM(startHHMM);
  const end = minutesFromHHMM(endHHMM);

  if (start === null || end === null) return null;
  if (end >= start) return end - start;
  return (24 * 60 - start) + end;
}

function isLowIntensityBlock(block) {
  const type = String(block?.type || "").toLowerCase();
  const activity = String(block?.activity || "").toLowerCase();
  return type === "free" || type === "break" || type === "recovery" || activity.includes("free") || activity.includes("break") || activity.includes("recovery");
}

function estimateTaskMinutes(task) {
  if (task?.duration_minutes && task.duration_minutes > 0) {
    return task.duration_minutes;
  }

  const name = String(task?.name || "").toLowerCase();

  if (name.includes("reading")) return 30;
  if (name.includes("project")) return 60;
  if (name.includes("study") || name.includes("exam") || name.includes("revise") || name.includes("revision") || name.includes("homework") || name.includes("assignment")) return 45;
  if (name.includes("walk") || name.includes("exercise") || name.includes("break")) return 30;

  return 45;
}

function sameHHMM(a, b) {
  return String(a || "").slice(0, 5) === String(b || "").slice(0, 5);
}

function isWakeActivity(activity) {
  return /\b(wake\s*up|wake|get\s*up)\b/i.test(String(activity || ""));
}

function isSleepActivity(activity) {
  return /\b(sleep|go\s*to\s*bed|bedtime)\b/i.test(String(activity || ""));
}

function placeSessionInFreeBlock(blocks, activityName, sessionMinutes, breakMinutes = 0) {
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (String(block.type || "").toLowerCase() !== "free") continue;

    const freeMinutes = durationMinutes(block.start, block.end);
    if (freeMinutes === null || freeMinutes < sessionMinutes + breakMinutes) continue;

    const startMinutes = minutesFromHHMM(block.start);
    const sessionEnd = hhmmFromMinutes(startMinutes + sessionMinutes);

    if (breakMinutes > 0) {
      const breakEnd = hhmmFromMinutes(minutesFromHHMM(sessionEnd) + breakMinutes);
      blocks.splice(i, 1,
        {
          start: block.start,
          end: sessionEnd,
          activity: activityName,
          type: "activity"
        },
        {
          start: sessionEnd,
          end: breakEnd,
          activity: "Break",
          type: "break"
        },
        {
          start: breakEnd,
          end: block.end,
          activity: "Free",
          type: "free"
        }
      );
    } else {
      blocks.splice(i, 1,
        {
          start: block.start,
          end: sessionEnd,
          activity: activityName,
          type: "activity"
        },
        {
          start: sessionEnd,
          end: block.end,
          activity: "Free",
          type: "free"
        }
      );
    }

    return true;
  }

  return false;
}

function normalizeBlocks(timetable) {
  if (!timetable || !Array.isArray(timetable.blocks) || timetable.blocks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks
    .filter((block) => block && /^\d{2}:\d{2}$/.test(block.start) && /^\d{2}:\d{2}$/.test(block.end))
    .map((block) => ({
      ...block,
      type: String(block.type || "").toLowerCase(),
      activity: String(block.activity || "").trim()
    }))
    .sort(
      (a, b) =>
        minutesFromHHMM(a.start) - minutesFromHHMM(b.start) ||
        minutesFromHHMM(a.end) - minutesFromHHMM(b.end)
    );

  const merged = [];

  for (const block of blocks) {
    const previous = merged[merged.length - 1];

    if (previous && previous.end === block.start && isLowIntensityBlock(previous) && isLowIntensityBlock(block)) {
      previous.end = block.end;
      previous.type = "free";
      previous.activity = "Free";
      continue;
    }

    if (
      previous &&
      previous.type === block.type &&
      previous.end === block.start &&
      previous.activity === block.activity
    ) {
      previous.end = block.end;
      continue;
    }

    merged.push({ ...block });
  }

  return { ...timetable, blocks: merged };
}

function fillGapsBetweenBlocks(timetable, wakeTime, sleepTime) {
  if (!timetable || !Array.isArray(timetable.blocks) || timetable.blocks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks
    .map((block) => ({ ...block }))
    .filter((block) => block.start && block.end)
    .sort(
      (a, b) =>
        minutesFromHHMM(a.start) - minutesFromHHMM(b.start) ||
        minutesFromHHMM(a.end) - minutesFromHHMM(b.end)
    );

  const filled = [];
  const normalizedWake = String(wakeTime || blocks[0]?.start || "07:00").slice(0, 5);
  const normalizedSleep = String(sleepTime || blocks[blocks.length - 1]?.end || "23:00").slice(0, 5);

  let cursor = normalizedWake;

  for (const block of blocks) {
    const blockStart = String(block.start).slice(0, 5);
    const blockEnd = String(block.end).slice(0, 5);

    if (minutesFromHHMM(blockStart) > minutesFromHHMM(cursor)) {
      filled.push({
        start: cursor,
        end: blockStart,
        activity: "Free",
        type: "free"
      });
    }

    filled.push({
      ...block,
      start: blockStart,
      end: blockEnd
    });

    cursor = blockEnd;
  }

  if (minutesFromHHMM(cursor) < minutesFromHHMM(normalizedSleep)) {
    filled.push({
      start: cursor,
      end: normalizedSleep,
      activity: "Free",
      type: "free"
    });
  }

  return { ...timetable, blocks: filled };
}

function normalizeWakeAndSleepBlocks(timetable, sleepTime) {
  if (!timetable || !Array.isArray(timetable.blocks) || timetable.blocks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks.map((block) => ({ ...block }));

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const activity = String(block.activity || "");

    if (isWakeActivity(activity)) {
      const start = String(block.start || "").slice(0, 5);
      const end = hhmmFromMinutes(minutesFromHHMM(start) + 10);
      block.start = start;
      block.end = end;
      block.type = "activity";
      block.activity = "Wake up";
      continue;
    }

    if (isSleepActivity(activity)) {
      const end = String(block.end || sleepTime || "23:00").slice(0, 5);
      const start = hhmmFromMinutes(minutesFromHHMM(end) - 10);
      block.start = start;
      block.end = end;
      block.type = "activity";
      block.activity = "Sleep";
    }
  }

  const lastBlock = blocks[blocks.length - 1];
  if (lastBlock && !isSleepActivity(lastBlock.activity) && sleepTime) {
    const end = String(sleepTime).slice(0, 5);
    const start = hhmmFromMinutes(minutesFromHHMM(end) - 20);

    if (minutesFromHHMM(lastBlock.end) > minutesFromHHMM(start)) {
      lastBlock.end = start;
      blocks.push({
        start,
        end,
        activity: "Sleep",
        type: "activity"
      });
    } else if (lastBlock.end === end) {
      lastBlock.activity = isLowIntensityBlock(lastBlock) ? "Sleep" : lastBlock.activity;
    }
  }

  return { ...timetable, blocks };
}

function ensureMorningRoutine(timetable) {
  if (!timetable || !Array.isArray(timetable.blocks) || timetable.blocks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks.map((block) => ({ ...block }));
  const wakeIndex = blocks.findIndex((block) => String(block.activity || "").toLowerCase().includes("wake up"));

  if (wakeIndex === -1) {
    return timetable;
  }

  const wakeBlock = blocks[wakeIndex];
  const routineStart = wakeBlock.end;
  const routineEnd = hhmmFromMinutes(minutesFromHHMM(routineStart) + 20);

  const nextBlock = blocks[wakeIndex + 1];
  if (nextBlock && minutesFromHHMM(nextBlock.start) <= minutesFromHHMM(routineEnd)) {
    if (String(nextBlock.type || "").toLowerCase() === "free") {
      nextBlock.start = routineEnd;
    }
  } else {
    blocks.splice(wakeIndex + 1, 0, {
      start: routineStart,
      end: routineEnd,
      activity: "Morning routine",
      type: "activity"
    });
  }

  return { ...timetable, blocks };
}

function hasMealBlock(blocks, mealName) {
  const target = String(mealName || "").toLowerCase();
  return (blocks || []).some(
    (block) =>
      String(block.activity || "").toLowerCase().includes(target)
  );
}

function insertMealIntoBlocks(blocks, mealName, mealStart, mealMinutes) {
  const startMinutes = minutesFromHHMM(mealStart);
  const mealEnd = hhmmFromMinutes(startMinutes + mealMinutes);

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (String(block.type || "").toLowerCase() !== "free") continue;

    const blockStart = minutesFromHHMM(block.start);
    const blockEnd = minutesFromHHMM(block.end);
    if (blockStart > startMinutes || blockEnd < minutesFromHHMM(mealEnd)) continue;

    const insertItems = [];

    if (blockStart < startMinutes) {
      insertItems.push({
        start: block.start,
        end: mealStart,
        activity: "Free",
        type: "free"
      });
    }

    insertItems.push({
      start: mealStart,
      end: mealEnd,
      activity: mealName,
      type: "meal"
    });

    if (blockEnd > minutesFromHHMM(mealEnd)) {
      insertItems.push({
        start: mealEnd,
        end: block.end,
        activity: "Free",
        type: "free"
      });
    }

    blocks.splice(i, 1, ...insertItems);
    return true;
  }

  return false;
}

function insertFixedBlockIntoBlocks(blocks, fixedBlock) {
  const startMinutes = minutesFromHHMM(fixedBlock.start);
  const endMinutes = minutesFromHHMM(fixedBlock.end);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (String(block.type || "").toLowerCase() !== "free") continue;

    const blockStart = minutesFromHHMM(block.start);
    const blockEnd = minutesFromHHMM(block.end);
    if (blockStart > startMinutes || blockEnd < endMinutes) continue;

    const insertItems = [];

    if (blockStart < startMinutes) {
      insertItems.push({
        start: block.start,
        end: fixedBlock.start,
        activity: "Free",
        type: "free"
      });
    }

    insertItems.push({ ...fixedBlock });

    if (blockEnd > endMinutes) {
      insertItems.push({
        start: fixedBlock.end,
        end: block.end,
        activity: "Free",
        type: "free"
      });
    }

    blocks.splice(i, 1, ...insertItems);
    return true;
  }

  return false;
}

function ensureWakeBlock(timetable, wakeTime) {
  if (!timetable || !Array.isArray(timetable.blocks) || timetable.blocks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks.map((block) => ({ ...block }));
  const hasWake = blocks.some((block) => isWakeActivity(block.activity));

  if (hasWake) {
    return { ...timetable, blocks };
  }

  const start = String(wakeTime || "07:00").slice(0, 5);
  const end = hhmmFromMinutes(minutesFromHHMM(start) + 10);

  insertFixedBlockIntoBlocks(blocks, {
    start,
    end,
    activity: "Wake up",
    type: "activity"
  });

  return { ...timetable, blocks };
}

function getUserMentionedMeals(rawText) {
  const mentioned = new Set();
  const text = String(rawText || "").toLowerCase();

  if (/breakfast\s+at\s+\d{1,2}:\d{2}|breakfast\s+\d{1,2}:\d{2}|\d{1,2}:\d{2}.*breakfast/i.test(text)) {
    mentioned.add("Breakfast");
  }

  if (/lunch\s+at\s+\d{1,2}:\d{2}|lunch\s+\d{1,2}:\d{2}|\d{1,2}:\d{2}.*lunch/i.test(text)) {
    mentioned.add("Lunch");
  }

  if (/dinner\s+at\s+\d{1,2}:\d{2}|dinner\s+\d{1,2}:\d{2}|\d{1,2}:\d{2}.*dinner/i.test(text)) {
    mentioned.add("Dinner");
  }

  return mentioned;
}

function ensureDefaultMeals(timetable, wakeTime, sleepTime, rawText = "") {
  if (!timetable || !Array.isArray(timetable.blocks) || timetable.blocks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks.map((block) => ({ ...block }));
  const normalizedWake = minutesFromHHMM(String(wakeTime || "07:00").slice(0, 5));
  const normalizedSleep = minutesFromHHMM(String(sleepTime || "23:00").slice(0, 5));
  const userMentionedMeals = getUserMentionedMeals(rawText);

  const mealPlan = [
    {
      name: "Breakfast",
      start: hhmmFromMinutes(normalizedWake + 30),
      minutes: 30
    },
    {
      name: "Lunch",
      start: "13:00",
      minutes: 45
    },
    {
      name: "Dinner",
      start: "19:00",
      minutes: 45
    }
  ];

  for (const meal of mealPlan) {
    if (userMentionedMeals.has(meal.name)) {
      continue;
    }

    if (minutesFromHHMM(meal.start) < normalizedWake || minutesFromHHMM(meal.start) + meal.minutes > normalizedSleep) {
      continue;
    }

    if (hasMealBlock(blocks, meal.name)) {
      continue;
    }

    insertMealIntoBlocks(blocks, meal.name, meal.start, meal.minutes);
  }

  return { ...timetable, blocks };
}

function reconcileExactTimeTasks(timetable, tasks) {
  if (!timetable || !Array.isArray(timetable.blocks) || !Array.isArray(tasks) || tasks.length === 0) {
    return timetable;
  }

  let blocks = timetable.blocks.map((block) => ({ ...block }));

  for (const task of tasks) {
    const exactStart = task?.fixed_time?.start ? String(task.fixed_time.start).slice(0, 5) : null;
    const exactEnd = task?.fixed_time?.end ? String(task.fixed_time.end).slice(0, 5) : null;
    const taskName = String(task?.name || "").trim();

    if (!exactStart || !exactEnd || !taskName) continue;

    blocks = blocks.filter((block) => {
      const activity = String(block.activity || "").trim().toLowerCase();
      const sameName = activity === taskName.toLowerCase();
      const overlapsExact =
        minutesFromHHMM(block.start) < minutesFromHHMM(exactEnd) &&
        minutesFromHHMM(block.end) > minutesFromHHMM(exactStart);

      if (sameName) return false;
      if (!overlapsExact) return true;

      return String(block.type || "").toLowerCase() === "free";
    });

    const insertIndex = blocks.findIndex((block) => minutesFromHHMM(block.start) >= minutesFromHHMM(exactStart));
    const exactBlock = {
      start: exactStart,
      end: exactEnd,
      activity: taskName,
      type: "activity"
    };

    if (insertIndex === -1) {
      blocks.push(exactBlock);
      continue;
    }

    const target = blocks[insertIndex];
    const targetStart = minutesFromHHMM(target.start);
    const targetEnd = minutesFromHHMM(target.end);
    const exactStartMinutes = minutesFromHHMM(exactStart);
    const exactEndMinutes = minutesFromHHMM(exactEnd);

    if (targetStart >= exactEndMinutes) {
      blocks.splice(insertIndex, 0, exactBlock);
      continue;
    }

    if (String(target.type || "").toLowerCase() === "free" && targetStart <= exactStartMinutes && targetEnd >= exactEndMinutes) {
      const before = targetStart < exactStartMinutes
        ? {
            start: target.start,
            end: exactStart,
            activity: "Free",
            type: "free"
          }
        : null;

      const after = targetEnd > exactEndMinutes
        ? {
            start: exactEnd,
            end: target.end,
            activity: "Free",
            type: "free"
          }
        : null;

      const insertItems = [];
      if (before) insertItems.push(before);
      insertItems.push(exactBlock);
      if (after) insertItems.push(after);

      blocks.splice(insertIndex, 1, ...insertItems);
      continue;
    }

    blocks.splice(insertIndex, 0, exactBlock);
  }

  return { ...timetable, blocks };
}

function placeTaskMinutesInFreeBlocks(blocks, taskName, minutesNeeded, startIndex = 0) {
  let remaining = minutesNeeded;

  for (let i = startIndex; i < blocks.length && remaining > 0; ) {
    const block = blocks[i];
    if (String(block.type || "").toLowerCase() !== "free") {
      i += 1;
      continue;
    }

    const freeMinutes = durationMinutes(block.start, block.end);
    if (freeMinutes === null || freeMinutes <= 0) {
      i += 1;
      continue;
    }

    const pieceMinutes = Math.min(remaining, freeMinutes);
    const pieceEnd = hhmmFromMinutes(minutesFromHHMM(block.start) + pieceMinutes);
    const activityBlock = {
      start: block.start,
      end: pieceEnd,
      activity: taskName,
      type: "activity"
    };

    if (pieceMinutes === freeMinutes) {
      blocks.splice(i, 1, activityBlock);
      remaining -= pieceMinutes;
      i += 1;
      continue;
    }

    blocks.splice(i, 1,
      activityBlock,
      {
        start: pieceEnd,
        end: block.end,
        activity: "Free",
        type: "free"
      }
    );

    remaining -= pieceMinutes;
    i += 2;
  }

  return remaining;
}

function reconcileDurationTasks(timetable, tasks) {
  if (!timetable || !Array.isArray(timetable.blocks) || !Array.isArray(tasks) || tasks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks.map((block) => ({ ...block }));

  for (const task of tasks) {
    const targetMinutes = task?.duration_minutes;
    const taskName = String(task?.name || "").trim().toLowerCase();

    if (!taskName || !targetMinutes || targetMinutes <= 0) continue;

    const matchingIndexes = blocks
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => String(block.activity || "").trim().toLowerCase() === taskName && String(block.type || "").toLowerCase() === "activity")
      .map(({ index }) => index);

    if (!matchingIndexes.length) continue;

    let total = matchingIndexes.reduce(
      (sum, index) => sum + (durationMinutes(blocks[index].start, blocks[index].end) || 0),
      0
    );

    if (total <= targetMinutes) continue;

    let excess = total - targetMinutes;

    for (let i = matchingIndexes.length - 1; i >= 0 && excess > 0; i -= 1) {
      const blockIndex = matchingIndexes[i];
      const block = blocks[blockIndex];
      const blockMinutes = durationMinutes(block.start, block.end) || 0;

      if (blockMinutes <= excess) {
        blocks.splice(blockIndex, 1);
        excess -= blockMinutes;
        continue;
      }

      const newEnd = hhmmFromMinutes(minutesFromHHMM(block.end) - excess);
      block.end = newEnd;
      excess = 0;
    }

    continue;
  }

  for (const task of tasks) {
    const targetMinutes = task?.duration_minutes;
    const taskName = String(task?.name || "").trim().toLowerCase();

    if (!taskName || !targetMinutes || targetMinutes <= 0) continue;

    const matchingIndexes = blocks
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => String(block.activity || "").trim().toLowerCase() === taskName && String(block.type || "").toLowerCase() === "activity")
      .map(({ index }) => index);

    if (!matchingIndexes.length) continue;

    const total = matchingIndexes.reduce(
      (sum, index) => sum + (durationMinutes(blocks[index].start, blocks[index].end) || 0),
      0
    );

    if (total >= targetMinutes) continue;

    const deficit = targetMinutes - total;
    const preferredStartIndex = matchingIndexes[matchingIndexes.length - 1] + 1;

    let remaining = placeTaskMinutesInFreeBlocks(blocks, taskName, deficit, preferredStartIndex);

    if (remaining > 0) {
      remaining = placeTaskMinutesInFreeBlocks(blocks, taskName, remaining, 0);
    }
  }

  return { ...timetable, blocks };
}

function insertMissingTaskBlocks(timetable, tasks) {
  if (!timetable || !Array.isArray(timetable.blocks) || timetable.blocks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks.map((block) => ({ ...block }));
  const existingActivities = new Set(
    blocks.map((block) => String(block.activity || "").trim().toLowerCase())
  );

  const missingTasks = (tasks || []).filter((task) => {
    const name = String(task?.name || "").trim().toLowerCase();
    return name && !existingActivities.has(name);
  });

  if (!missingTasks.length) {
    return timetable;
  }

  for (const task of missingTasks) {
    const taskName = String(task.name || "").trim();
    const taskMinutes = estimateTaskMinutes(task);
    if (!taskName || taskMinutes <= 0) continue;

    if (task.fixed_time?.start && task.fixed_time?.end) {
      const exactStart = String(task.fixed_time.start);
      const exactEnd = String(task.fixed_time.end);
      const exactDuration = durationMinutes(exactStart, exactEnd) ?? taskMinutes;

      const alreadyPlaced = blocks.some(
        (block) =>
          String(block.activity || "").trim().toLowerCase() === taskName.toLowerCase() &&
          sameHHMM(block.start, exactStart) &&
          sameHHMM(block.end, exactEnd)
      );

      if (alreadyPlaced) {
        continue;
      }

      const exactBlock = {
        start: exactStart,
        end: exactEnd,
        activity: taskName,
        type: "activity"
      };

      const exactSlotIndex = blocks.findIndex(
        (block) =>
          String(block.type || "").toLowerCase() === "free" &&
          minutesFromHHMM(block.start) <= minutesFromHHMM(exactStart) &&
          minutesFromHHMM(block.end) >= minutesFromHHMM(exactEnd)
      );

      if (exactSlotIndex !== -1) {
        const freeBlock = blocks[exactSlotIndex];
        if (sameHHMM(freeBlock.start, exactStart) && sameHHMM(freeBlock.end, exactEnd)) {
          blocks.splice(exactSlotIndex, 1, exactBlock);
        } else if (sameHHMM(freeBlock.start, exactStart)) {
          blocks.splice(exactSlotIndex, 1,
            exactBlock,
            {
              start: exactEnd,
              end: freeBlock.end,
              activity: "Free",
              type: "free"
            }
          );
        } else {
          const beforeFreeEnd = exactStart;
          const afterFreeStart = exactEnd;
          blocks.splice(exactSlotIndex, 1,
            {
              start: freeBlock.start,
              end: beforeFreeEnd,
              activity: "Free",
              type: "free"
            },
            exactBlock,
            {
              start: afterFreeStart,
              end: freeBlock.end,
              activity: "Free",
              type: "free"
            }
          );
        }
      } else {
        blocks.push(exactBlock);
      }

      continue;
    }

    let placed = false;

    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      if (String(block.type || "").toLowerCase() !== "free") continue;

      const freeMinutes = durationMinutes(block.start, block.end);
      if (freeMinutes === null || freeMinutes < taskMinutes) continue;

      const start = block.start;
      const taskEnd = hhmmFromMinutes(minutesFromHHMM(start) + taskMinutes);

      const inserted = {
        start,
        end: taskEnd,
        activity: taskName,
        type: "activity"
      };

      if (taskEnd === block.end) {
        blocks.splice(i, 1, inserted);
      } else {
        blocks.splice(i, 1,
          inserted,
          {
            start: taskEnd,
            end: block.end,
            activity: "Free",
            type: "free"
          }
        );
      }

      placed = true;
      break;
    }

    if (!placed) {
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && String(lastBlock.type || "").toLowerCase() === "free") {
        const lastFreeMinutes = durationMinutes(lastBlock.start, lastBlock.end);
        if (lastFreeMinutes !== null && lastFreeMinutes >= taskMinutes) {
          const taskStart = lastBlock.start;
          const taskEnd = hhmmFromMinutes(minutesFromHHMM(taskStart) + taskMinutes);

          blocks.splice(blocks.length - 1, 1,
            {
              start: taskStart,
              end: taskEnd,
              activity: taskName,
              type: "activity"
            },
            {
              start: taskEnd,
              end: lastBlock.end,
              activity: "Free",
              type: "free"
            }
          );
        }
      }
    }
  }

  return { ...timetable, blocks };
}

function enforceBreakAfterFree(timetable, sleepTime) {
  if (!timetable || !Array.isArray(timetable.blocks) || timetable.blocks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks.map((b) => ({ ...b, type: String(b.type || "").toLowerCase() }));

  // If the model returns "break -> free", rewrite it as "free -> short break".
  for (let i = 1; i < blocks.length; i += 1) {
    const prev = blocks[i - 1];
    const curr = blocks[i];

    if (prev.type !== "break" || curr.type !== "free") continue;
    if (prev.end !== curr.start) continue;

    const prevDuration = durationMinutes(prev.start, prev.end);
    const currDuration = durationMinutes(curr.start, curr.end);
    if (prevDuration === null || currDuration === null) continue;
    if (currDuration < 10) continue;

    const newBreakMinutes = 5;
    const freeEnd = hhmmFromMinutes(minutesFromHHMM(curr.end) - newBreakMinutes);

    blocks.splice(i - 1, 2,
      {
        start: prev.start,
        end: freeEnd,
        activity: "Free time",
        type: "free"
      },
      {
        start: freeEnd,
        end: curr.end,
        activity: "Break",
        type: "break"
      }
    );

    i -= 1;
  }

  // Ensure each free block is followed by a short break unless the day ends at sleep time.
  for (let i = 0; i < blocks.length; i += 1) {
    const curr = blocks[i];
    if (curr.type !== "free") continue;
    if (curr.end === sleepTime) continue;

    const next = blocks[i + 1];
    if (next && next.type === "break") continue;

    const freeDuration = durationMinutes(curr.start, curr.end);
    if (freeDuration === null || freeDuration < 10) continue;

    const newBreakMinutes = 5;
    const breakStart = hhmmFromMinutes(minutesFromHHMM(curr.end) - newBreakMinutes);
    const breakEnd = curr.end;

    curr.end = breakStart;
    blocks.splice(i + 1, 0, {
      start: breakStart,
      end: breakEnd,
      activity: "Break",
      type: "break"
    });
    i += 1;
  }

  return { ...timetable, blocks };
}

function buildClientConfig() {
  const provider = (process.env.LLM_PROVIDER || "").toLowerCase();
  const openaiKey = (process.env.OPENAI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();

  if (openaiKey && openaiKey.startsWith("AIza")) {
    throw new Error(
      "OPENAI_API_KEY looks like a Google API key (AIza...). Use an OpenAI key (sk-...) or set LLM_PROVIDER=groq with GROQ_API_KEY (gsk_...)."
    );
  }

  const useGroq =
    provider === "groq" ||
    Boolean(groqKey) ||
    (provider !== "openai" && typeof openaiKey === "string" && openaiKey.startsWith("gsk_"));

  if (useGroq) {
    const apiKey = groqKey || openaiKey;

    if (!apiKey) {
      throw new Error("GROQ_API_KEY (or OPENAI_API_KEY with a Groq key) is not set.");
    }

    return {
      client: new OpenAI({
        apiKey,
        baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"
      }),
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant"
    };
  }

  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to your .env file.");
  }

  return {
    client: new OpenAI({ apiKey: openaiKey }),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini"
  };
}

async function generateTimetable(schedule) {
  const { client, model } = buildClientConfig();

  const wakeTime = schedule.wake_time || "07:00";
  const sleepTime = schedule.sleep_time || "23:00";
  const goalText = schedule.goal || schedule.raw_text || "None";
  const rawText = schedule.raw_text || "None";

  const fixedActivitiesText = (schedule.activities || []).length
    ? schedule.activities.map((a) => `${a.name} from ${a.start} to ${a.end}`).join("\n")
    : "None";

  const tasksText = (schedule.tasks || []).length
    ? schedule.tasks
      .map((t) => {
        const fixed = t.fixed_time ? `fixed ${t.fixed_time.start}-${t.fixed_time.end}` : "flexible";
        const duration = t.duration_minutes ? `${t.duration_minutes} minutes` : "duration not specified";
        return `- ${t.name} | ${fixed} | ${duration} | priority: ${t.priority || "medium"}`;
      })
      .join("\n")
    : "None";

  const prompt = `
You are a productivity assistant.

Using the following schedule data, generate a clear daily timetable as JSON.

Primary goal or intent:
${goalText}

Raw user message:
${rawText}

Wake time: ${wakeTime}
Sleep time: ${sleepTime}
Fixed-time activities:
${fixedActivitiesText}

User tasks (from free-text input):
${tasksText}

Return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "wake_time": "HH:MM",
  "sleep_time": "HH:MM",
  "blocks": [
    {
      "start": "HH:MM",
      "end": "HH:MM",
      "activity": "Activity name",
      "type": "activity" | "break" | "meal" | "free"
    }
  ],
  "summary": "One-sentence summary of the day"
}
Routine rules:
1) Always include Wake up, Sleep, Breakfast, Lunch, and Dinner in every routine.
2) Fill the entire period from wake time to sleep time with contiguous blocks and keep them in chronological order.
3) If a task or activity has a fixed time, schedule it exactly at that time.
4) If a task has a duration, preserve that duration exactly and place it in a realistic slot.
5) Do not invent new subjects, tasks, or activities. Only schedule what the user actually mentioned.
6) Do not skip any user-mentioned task or activity. Every input item must appear somewhere in the routine.
7) Prefer a balanced day with work, meals, and short breaks.
8) Do not overlap blocks or leave gaps between blocks.
9) Use the raw user message as the main source of truth and infer the routine from it.
10) After each task, leave 10 to 30 minutes of free time when the schedule has room.
11) If a study or work task is long, split it into shorter sessions with a short break in the middle instead of one very long block.
`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You generate optimized student timetables. Infer the schedule from the user's raw message and always respond with valid JSON only, no markdown." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  const raw = response.choices[0].message.content.trim();

  // Strip markdown code fences if the LLM wraps the JSON
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(cleaned);
    let timetable = normalizeBlocks(parsed);

    timetable = ensureWakeBlock(timetable, wakeTime);
    timetable = normalizeWakeAndSleepBlocks(timetable, sleepTime);
    timetable = ensureMorningRoutine(timetable);
    timetable = reconcileExactTimeTasks(timetable, schedule.tasks);

    if (Array.isArray(schedule.tasks) && schedule.tasks.length) {
      timetable = insertMissingTaskBlocks(timetable, schedule.tasks);
    }

    timetable = reconcileDurationTasks(timetable, schedule.tasks);

    timetable = normalizeWakeAndSleepBlocks(timetable, sleepTime);
    timetable = ensureMorningRoutine(timetable);
    timetable = reconcileExactTimeTasks(timetable, schedule.tasks);
    timetable = reconcileDurationTasks(timetable, schedule.tasks);
    timetable = fillGapsBetweenBlocks(timetable, wakeTime, sleepTime);
    timetable = ensureDefaultMeals(timetable, wakeTime, sleepTime, rawText);
    timetable = normalizeBlocks(timetable);

    return timetable;
  } catch {
    // Fallback: return raw text so the frontend can still display something
    return { raw_text: raw, blocks: [] };
  }
}

export default generateTimetable;