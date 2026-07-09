import TherapyHubExercise from "../models/TherapyHubExercise.js";

export const seedTherapyHubExercises = async () => {
  try {
    const count = await TherapyHubExercise.countDocuments();
    if (count === 0) {
      console.log("Seeding Therapy Hub Exercises...");

      const relaxationExercises = [
        {
          title: "Brief Mindfulness",
          description: "A short guided mindfulness exercise to help you calm your thoughts and focus on the present moment.",
          category: "Relaxation Sessions",
          audioUrl: "/uploads/audio/relaxation/1-brief-mindfulness.mp3",
          displayOrder: 1,
          recommendedStressLevels: ["Mild", "Moderate", "Severe", "Extremely Severe"],
          thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400",
        },
        {
          title: "Leaves on a Stream",
          description: "Practice observing thoughts without judgment using a peaceful visualization.",
          category: "Relaxation Sessions",
          audioUrl: "/uploads/audio/relaxation/2-leaves-on-a-stream.mp3",
          displayOrder: 2,
          recommendedStressLevels: ["Mild", "Moderate", "Severe", "Extremely Severe"],
          thumbnail: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=400",
        },
        {
          title: "Progressive Muscle Relaxation",
          description: "Reduce physical tension by relaxing each muscle group one at a time.",
          category: "Relaxation Sessions",
          audioUrl: "/uploads/audio/relaxation/3-progressive-muscle-relaxation.mp3",
          displayOrder: 3,
          recommendedStressLevels: ["Mild", "Moderate", "Severe", "Extremely Severe"],
          thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400",
        },
        {
          title: "Abdominal Breathing",
          description: "Slow, deep breathing to reduce stress and improve relaxation.",
          category: "Relaxation Sessions",
          audioUrl: "/uploads/audio/relaxation/4-abdominal-breathing.mp3",
          displayOrder: 4,
          recommendedStressLevels: ["Mild", "Moderate", "Severe", "Extremely Severe"],
          thumbnail: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=400",
        },
        {
          title: "Managing Math Anxiety",
          description: "Guided relaxation designed to reduce anxiety related to studying or exams.",
          category: "Relaxation Sessions",
          audioUrl: "/uploads/audio/relaxation/5-managing-math-anxiety.mp3",
          displayOrder: 5,
          recommendedStressLevels: ["Mild", "Moderate", "Severe", "Extremely Severe"],
          thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400",
        },
        {
          title: "Body Image Relaxation",
          description: "Develop self-compassion and improve body awareness through guided relaxation.",
          category: "Relaxation Sessions",
          audioUrl: "/uploads/audio/relaxation/6-body-image.mp3",
          displayOrder: 6,
          recommendedStressLevels: ["Mild", "Moderate", "Severe", "Extremely Severe"],
          thumbnail: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=400",
        },
      ];

      const musicExercises = [
        {
          title: "Ambient Nature",
          description: "Soothing nature soundscapes blended with gentle music to create a peaceful background.",
          category: "Calm Music",
          audioUrl: "/uploads/audio/music/ambient-nature.mp3",
          displayOrder: 1,
          recommendedStressLevels: ["Normal", "Mild", "Moderate"],
          thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400",
        },
        {
          title: "Inspiring Dreams",
          description: "Uplifting and dreamlike acoustic melodies to inspire creativity and ease the mind.",
          category: "Calm Music",
          audioUrl: "/uploads/audio/music/Inspiring-Dreams.mp3",
          displayOrder: 2,
          recommendedStressLevels: ["Normal", "Mild", "Moderate"],
          thumbnail: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=400",
        },
        {
          title: "Laetha",
          description: "A beautiful, serene instrumental journey designed for deep focus and quiet contemplation.",
          category: "Calm Music",
          audioUrl: "/uploads/audio/music/Laetha.mp3",
          displayOrder: 3,
          recommendedStressLevels: ["Normal", "Mild", "Moderate"],
          thumbnail: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=400",
        },
        {
          title: "Magical Moments",
          description: "Soft, magical piano chords and ambient pads that evoke a sense of wonder and peace.",
          category: "Calm Music",
          audioUrl: "/uploads/audio/music/Magical-Moments.mp3",
          displayOrder: 4,
          recommendedStressLevels: ["Normal", "Mild", "Moderate"],
          thumbnail: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=400",
        },
        {
          title: "Warm Memories",
          description: "Comforting and nostalgic acoustic harmonies that wrap around you like a warm blanket.",
          category: "Calm Music",
          audioUrl: "/uploads/audio/music/Warm-Memories.mp3",
          displayOrder: 5,
          recommendedStressLevels: ["Normal", "Mild", "Moderate"],
          thumbnail: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=400",
        },
        {
          title: "Winter",
          description: "A tranquil, cool atmospheric melody that brings quiet stillness and calm clarity.",
          category: "Calm Music",
          audioUrl: "/uploads/audio/music/Winter.mp3",
          displayOrder: 6,
          recommendedStressLevels: ["Normal", "Mild", "Moderate"],
          thumbnail: "https://images.unsplash.com/photo-1482531007909-192ac913980a?q=80&w=400",
        },
      ];

      const natureExercises = [
        {
          title: "Atmospheric Wind",
          description: "The gentle, whistling sound of wind moving through open valleys and rustling leaves.",
          category: "Nature Sounds",
          audioUrl: "/uploads/audio/nature/atmospheric-wind.mp3",
          displayOrder: 1,
          recommendedStressLevels: ["Normal", "Mild", "Moderate", "Severe"],
          thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400",
        },
        {
          title: "Happy Birds Singing",
          description: "Bright and cheerful birds chirping to bring the freshness of a sunny morning to your day.",
          category: "Nature Sounds",
          audioUrl: "/uploads/audio/nature/happy-birds-singing.mp3",
          displayOrder: 2,
          recommendedStressLevels: ["Normal", "Mild", "Moderate", "Severe"],
          thumbnail: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?q=80&w=400",
        },
        {
          title: "Nightingale Song in Forest",
          description: "The beautiful, melodic evening song of a nightingale deep within a quiet forest.",
          category: "Nature Sounds",
          audioUrl: "/uploads/audio/nature/nightingale-song-in-forest.mp3",
          displayOrder: 3,
          recommendedStressLevels: ["Normal", "Mild", "Moderate", "Severe"],
          thumbnail: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=400",
        },
        {
          title: "Ocean Waves",
          description: "Rhythmic, rolling ocean waves crashing on the shore to wash away your stress.",
          category: "Nature Sounds",
          audioUrl: "/uploads/audio/nature/ocean-waves.mp3",
          displayOrder: 4,
          recommendedStressLevels: ["Normal", "Mild", "Moderate", "Severe"],
          thumbnail: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=400",
        },
        {
          title: "River in Forest",
          description: "The peaceful, continuous sound of a flowing river winding through forest trees.",
          category: "Nature Sounds",
          audioUrl: "/uploads/audio/nature/river-in-forest.mp3",
          displayOrder: 5,
          recommendedStressLevels: ["Normal", "Mild", "Moderate", "Severe"],
          thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400",
        },
      ];

      const allExercises = [...relaxationExercises, ...musicExercises, ...natureExercises];
      await TherapyHubExercise.insertMany(allExercises);
      console.log(`Successfully seeded ${allExercises.length} Therapy Hub exercises.`);
    } else {
      console.log("Therapy Hub Exercises already seeded.");
    }
  } catch (error) {
    console.error("Error seeding Therapy Hub exercises:", error);
  }
};
