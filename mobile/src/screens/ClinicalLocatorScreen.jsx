import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, Pressable, Linking } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { API_URL } from "../../constants/api";
import styles from "../../assets/styles/clinical_locator.styles";

export default function ClinicalLocatorScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const openInGoogleMaps = (clinic) => {
    const clinicName = clinic?.name || "Clinic";
    const placeId = clinic?.place_id;

    const url = placeId
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicName)}&query_place_id=${placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicName)}`;

    Linking.openURL(url);
  };
  const handleMarkerPress = (clinic) => {
    setSelectedClinic(clinic);
  };

  const handleMapPress = () => {
    if (selectedClinic) {
      setSelectedClinic(null);
    }
  };

  const getOpenStatus = (clinic) => {
    const isOpen = clinic?.opening_hours?.open_now;
    if (typeof isOpen !== "boolean") {
      return "Opening hours unavailable";
    }
    return isOpen ? "Open now" : "Closed now";
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
          showsPointsOfInterest={false}
          moveOnMarkerPress={false}
          onPress={handleMapPress}
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
              onPress={(event) => {
                event.stopPropagation();
                handleMarkerPress(clinic);
              }}
            />
          ))}
        </MapView>
      )}

      {selectedClinic && (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selectedClinic.name}</Text>
          <Text style={styles.detailAddress}>
            {selectedClinic.vicinity || "Address unavailable"}
          </Text>
          <Text style={styles.detailMeta}>{getOpenStatus(selectedClinic)}</Text>

          {typeof selectedClinic.rating === "number" && (
            <Text style={styles.detailMeta}>Rating: {selectedClinic.rating} / 5</Text>
          )}

          <View style={styles.detailActions}>
            <Pressable
              style={[styles.actionButton, styles.primaryAction]}
              onPress={() => openInGoogleMaps(selectedClinic)}
            >
              <Text style={styles.actionButtonText}>More Info</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => setSelectedClinic(null)}
            >
              <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}


