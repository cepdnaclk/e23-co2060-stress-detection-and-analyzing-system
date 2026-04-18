import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, Linking } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { API_URL } from "../../constants/api";
import styles from "../../assets/styles/clinical_locator.styles";

export default function ClinicalLocatorScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const openInGoogleMaps = (clinic) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name)}&query_place_id=${clinic.place_id}`;
    Linking.openURL(url);
  };

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
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
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
                <Callout tooltip={false} onPress={() => openInGoogleMaps(clinic)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{clinic.name}</Text>
                  <Text style={styles.calloutAddress}>
                    {clinic.vicinity || "Address unavailable"}
                  </Text>
                  <Text style={styles.calloutLink}>Tap to open in Google Maps ↗</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
    </View>
  );
}
