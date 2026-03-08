import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { API_URL } from "../../constants/api";

export default function ClinicalLocatorScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission was denied. Please enable it in settings.");
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = location.coords;
        setUserLocation({ latitude, longitude });

        const response = await fetch(
          `${API_URL}/clinics/nearby?latitude=${latitude}&longitude=${longitude}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch clinics from server.");
        }

        const data = await response.json();
        setClinics(data.clinics || []);
      } catch (err) {
        console.log("Error in ClinicalLocatorScreen:", err);
        setError("Could not load nearby clinics. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Fetching your location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {userLocation && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation={false}
        >
          {/* User marker (blue) */}
          <Marker
            coordinate={userLocation}
            pinColor="blue"
            title="You are here"
          />

          {/* Psychiatrist markers (red) */}
          {clinics.map((clinic, index) => (
            <Marker
              key={clinic.place_id || index}
              coordinate={{
                latitude: clinic.geometry.location.lat,
                longitude: clinic.geometry.location.lng,
              }}
              pinColor="red"
            >
              <Callout tooltip={false}>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{clinic.name}</Text>
                  <Text style={styles.calloutAddress}>
                    {clinic.vicinity || "Address unavailable"}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#555",
  },
  errorText: {
    fontSize: 15,
    color: "#D32F2F",
    textAlign: "center",
  },
  callout: {
    width: 200,
    padding: 8,
  },
  calloutName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1976D2",
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: "#555",
  },
});