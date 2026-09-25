import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ActivityIndicator, Pressable, Linking } from "react-native";
import { WebView } from "react-native-webview";
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

  const mapHtml = useMemo(() => {
    if (!userLocation) return "";

    const clinicsJson = JSON.stringify(clinics).replace(/</g, '\\u003c');
    const userLat = userLocation.latitude;
    const userLng = userLocation.longitude;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; background: #e5e3df; }
          .user-marker {
            width: 20px;
            height: 20px;
            background: #2563EB;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.35);
          }
          .clinic-pin {
            width: 32px;
            height: 32px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            center: [${userLat}, ${userLng}],
            zoom: 14,
            zoomControl: false
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(map);

          // User Location Pin
          const userIcon = L.divIcon({
            className: 'custom-user-icon',
            html: '<div class="user-marker"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          L.marker([${userLat}, ${userLng}], { icon: userIcon }).addTo(map);

          // Clinic Pins (SVG Red Marker)
          const clinicSvg = \`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#E53935">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          \`;

          const clinicIcon = L.divIcon({
            className: 'clinic-pin',
            html: clinicSvg,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });

          const clinics = ${clinicsJson};

          clinics.forEach((clinic, idx) => {
            if (clinic.geometry && clinic.geometry.location) {
              const marker = L.marker([clinic.geometry.location.lat, clinic.geometry.location.lng], {
                icon: clinicIcon
              }).addTo(map);

              marker.on('click', () => {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SELECT_CLINIC',
                    clinic: clinic
                  }));
                }
              });
            }
          });

          map.on('click', () => {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DESELECT' }));
            }
          });
        </script>
      </body>
      </html>
    `;
  }, [userLocation, clinics]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "SELECT_CLINIC") {
        setSelectedClinic(data.clinic);
      } else if (data.type === "DESELECT") {
        setSelectedClinic(null);
      }
    } catch (e) {
      console.log("Error parsing WebView message:", e);
    }
  };

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
        <WebView
          originWhitelist={["*"]}
          source={{ html: mapHtml }}
          style={styles.map}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
        />
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

