import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  Pressable,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../../components/SafeScreen";
import styles from "../../assets/styles/therapy_hub.styles";
import { API_URL, fetchWithTimeout } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";

export default function TherapyHubScreen() {
  const { token } = useAuthStore();
  
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [error, setError] = useState(null);

  // Audio Playback State
  const soundRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);

  // Fetch exercises from backend
  useEffect(() => {
    let isMounted = true;

    const loadExercises = async () => {
      if (!token) {
        setIsLoading(false);
        setError("Please login to view therapy exercises.");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetchWithTimeout(`${API_URL}/therapy-hub`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch therapy hub exercises");
        }

        if (isMounted) {
          setExercises(data.exercises || []);
        }
      } catch (err) {
        console.error("Fetch exercises error:", err);
        if (isMounted) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadExercises();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Handle Play/Pause toggling
  const handlePlayTrack = async (track) => {
    if (isAudioLoading) return;

    try {
      setIsAudioLoading(true);

      // 1. If another audio is playing (or same audio is loaded), stop and unload it
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (err) {
          console.warn("Unloading error:", err);
        }
        soundRef.current = null;
      }

      // 2. If the user clicked the currently active and playing track, we toggle it to off
      if (playingId === track._id && isPlaying) {
        setPlayingId(null);
        setIsPlaying(false);
        setCurrentTrack(null);
        setIsAudioLoading(false);
        return;
      }

      // Configure Expo audio to play in silent mode and background
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        shouldRouteThroughEarpieceIOS: false,
      });

      // Construct absolute URL for playback
      const backendBaseUrl = API_URL.replace("/api", "");
      const fullAudioUrl = `${backendBaseUrl}${track.audioUrl}`;

      // Load and play track
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fullAudioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);

            if (status.didJustFinish) {
              setPlayingId(null);
              setIsPlaying(false);
              setCurrentTrack(null);
              if (soundRef.current) {
                soundRef.current.unloadAsync().catch(() => {});
                soundRef.current = null;
              }
            }
          }
        }
      );

      soundRef.current = newSound;
      setPlayingId(track._id);
      setCurrentTrack(track);
    } catch (err) {
      console.error("Playback error:", err);
      Alert.alert("Playback Error", "Unable to load and play this audio file.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  // Toggle current track play/pause from bottom player
  const togglePlayPause = async () => {
    if (!soundRef.current) return;
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (err) {
      console.error("Toggle playback error:", err);
    }
  };

  // Close / Stop playback entirely
  const stopPlayback = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (err) {
        console.warn("Unloading error:", err);
      }
      soundRef.current = null;
    }
    setPlayingId(null);
    setIsPlaying(false);
    setCurrentTrack(null);
    setPosition(0);
    setDuration(0);
  };

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch((err) => {
          console.warn("Unmount cleanup error:", err);
        });
      }
    };
  }, []);

  // Filter exercises by category and display order (Relaxation Sessions must preserve displayOrder)
  const relaxationSessions = exercises
    .filter((ex) => ex.category === "Relaxation Sessions")
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const calmMusic = exercises
    .filter((ex) => ex.category === "Calm Music")
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const natureSounds = exercises
    .filter((ex) => ex.category === "Nature Sounds")
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Render loading indicator
  if (isLoading) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Discovering calming exercises...</Text>
        </View>
      </SafeScreen>
    );
  }

  // Render error message
  if (error) {
    return (
      <SafeScreen>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#e53935" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeScreen>
    );
  }

  const renderExerciseCard = (item) => {
    const isCurrent = playingId === item._id;
    return (
      <Pressable
        key={item._id}
        onPress={() => handlePlayTrack(item)}
        style={[styles.card, isCurrent && styles.activeCard]}
      >
        <View style={styles.cardImageContainer}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons
                name={item.category === "Relaxation Sessions" ? "leaf-outline" : item.category === "Calm Music" ? "musical-notes-outline" : "water-outline"}
                size={36}
                color="#bbdefb"
              />
            </View>
          )}
          <View style={styles.playIconOverlay}>
            <Ionicons
              name={isCurrent && isPlaying ? "pause-circle" : "play-circle"}
              size={48}
              color="#ffffff"
            />
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.badgesWrapper}>
            {item.recommendedStressLevels && item.recommendedStressLevels.map((lvl) => {
              let badgeColor = "#e3f2fd";
              let textColor = "#1976D2";
              if (lvl === "Severe" || lvl === "Extremely Severe") {
                badgeColor = "#ffebee";
                textColor = "#c62828";
              } else if (lvl === "Moderate") {
                badgeColor = "#fff3e0";
                textColor = "#ef6c00";
              }
              return (
                <View key={lvl} style={[styles.badge, { backgroundColor: badgeColor }]}>
                  <Text style={[styles.badgeText, { color: textColor }]}>{lvl}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Pressable>
    );
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Therapy Hub</Text>
          <Text style={styles.headerSubtitle}>
            Take a breath, listen to guided sessions, and restore your inner peace.
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 🌿 Relaxation Sessions */}
          {relaxationSessions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌿 Relaxation Sessions</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {relaxationSessions.map(renderExerciseCard)}
              </ScrollView>
            </View>
          )}

          {/* 🎵 Calm Music */}
          {calmMusic.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎵 Calm Music</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {calmMusic.map(renderExerciseCard)}
              </ScrollView>
            </View>
          )}

          {/* 🌧 Nature Sounds */}
          {natureSounds.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌧 Nature Sounds</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {natureSounds.map(renderExerciseCard)}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Bottom Floating Player */}
        {currentTrack && (
          <View style={styles.playerBar}>
            {/* Progress Bar Line */}
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>

            <View style={styles.playerContent}>
              {currentTrack.thumbnail ? (
                <Image source={{ uri: currentTrack.thumbnail }} style={styles.playerThumbnail} />
              ) : (
                <View style={styles.playerThumbnailPlaceholder}>
                  <Ionicons name="musical-note" size={18} color="#1976D2" />
                </View>
              )}
              
              <View style={styles.playerInfo}>
                <Text style={styles.playerTitle} numberOfLines={1}>
                  {currentTrack.title}
                </Text>
                <Text style={styles.playerCategory} numberOfLines={1}>
                  {currentTrack.category}
                </Text>
              </View>

              <View style={styles.playerControls}>
                <Pressable onPress={togglePlayPause} style={styles.playerControlBtn}>
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={24}
                    color="#1976D2"
                  />
                </Pressable>
                
                <Pressable onPress={stopPlayback} style={styles.playerControlBtn}>
                  <Ionicons name="close" size={24} color="#555555" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeScreen>
  );
}