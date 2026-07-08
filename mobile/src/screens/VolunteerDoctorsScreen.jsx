import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { doctorApi } from "../lib/doctorApi";

const availabilityLabels = {
  available: "Available",
  unavailable: "Unavailable",
};

const filterOptions = ["", "available", "unavailable"];

function DoctorCard({ doctor, onPress }) {
  return (
    <Pressable onPress={onPress} style={doctorStyles.card}>
      <View style={doctorStyles.row}>
        {doctor.profilePicture ? (
          <Image source={{ uri: doctor.profilePicture }} style={doctorStyles.avatar} />
        ) : (
          <View style={doctorStyles.avatar} />
        )}
        <View style={doctorStyles.column}>
          <Text style={doctorStyles.cardTitle}>{doctor.fullName}</Text>
          <Text style={doctorStyles.cardSubtitle}>{doctor.specialization}</Text>
          <Text style={doctorStyles.cardSubtitle}>{doctor.hospital}</Text>
          <Text style={doctorStyles.cardSubtitle}>
            {doctor.yearsOfExperience} years experience
          </Text>
        </View>
      </View>

      <View style={doctorStyles.row}>
        <View style={[doctorStyles.chip, doctor.availability === "available" ? doctorStyles.chipSuccess : doctorStyles.chipWarning]}>
          <Text
            style={[
              doctorStyles.chipText,
              doctor.availability === "available"
                ? doctorStyles.chipTextSuccess
                : doctorStyles.chipTextWarning,
            ]}
          >
            {availabilityLabels[doctor.availability] ?? doctor.availability}
          </Text>
        </View>
        <View style={doctorStyles.chip}>
          <Text style={doctorStyles.chipText}>{doctor.averageRating?.toFixed?.(1) ?? doctor.averageRating ?? 0} rating</Text>
        </View>
        <View style={doctorStyles.chip}>
          <Text style={doctorStyles.chipText}>{doctor.totalReviews ?? 0} reviews</Text>
        </View>
      </View>

      <Pressable style={doctorStyles.button} onPress={onPress}>
        <Text style={doctorStyles.buttonText}>View Profile</Text>
      </Pressable>
    </Pressable>
  );
}

export default function VolunteerDoctorsScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState("rating");
  const [isLoading, setIsLoading] = useState(false);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await doctorApi.getPublicDoctors({
        search: search.trim(),
        specialization: specialization.trim(),
        availability,
        sort,
      });
      setDoctors(data.doctors ?? []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const specializations = useMemo(() => {
    return Array.from(new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean)));
  }, [doctors]);

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>Volunteer Doctors</Text>
          <Text style={doctorStyles.pageSubtitle}>
            Search available specialists and request a consultation with the right doctor.
          </Text>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.label}>Search</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Name, hospital, or specialization"
            style={doctorStyles.input}
            placeholderTextColor="#7a8ea6"
          />

          <View style={doctorStyles.filterRow}>
            <TextInput
              value={specialization}
              onChangeText={setSpecialization}
              placeholder="Specialization"
              style={[doctorStyles.input, doctorStyles.filterInput]}
              placeholderTextColor="#7a8ea6"
            />
          </View>

          <View style={doctorStyles.filterRow}>
            {specializations.slice(0, 8).map((item) => (
              <Pressable
                key={item}
                onPress={() => setSpecialization(item)}
                style={[doctorStyles.chip, specialization === item ? doctorStyles.chipSuccess : null]}
              >
                <Text style={doctorStyles.chipText}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <View style={doctorStyles.filterRow}>
            {[
              ["rating", "Top rated"],
              ["reviews", "Most reviewed"],
              ["experience", "Most experienced"],
              ["newest", "Newest"],
            ].map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setSort(value)}
                style={[doctorStyles.chip, sort === value ? doctorStyles.chipSuccess : null]}
              >
                <Text style={doctorStyles.chipText}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={doctorStyles.filterRow}>
            {filterOptions.map((value) => (
              <Pressable
                key={value || "all"}
                onPress={() => setAvailability(value)}
                style={[
                  doctorStyles.chip,
                  availability === value ? doctorStyles.chipSuccess : null,
                ]}
              >
                <Text style={doctorStyles.chipText}>{value ? value : "all"}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={doctorStyles.button} onPress={fetchDoctors}>
            <Text style={doctorStyles.buttonText}>Refresh Results</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={doctorStyles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : doctors.length === 0 ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.emptyTitle}>No doctors found</Text>
            <Text style={doctorStyles.emptyText}>
              Try changing the search or filters.
            </Text>
          </View>
        ) : (
          <View style={doctorStyles.listGap}>
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor._id}
                doctor={doctor}
                onPress={() => navigation.navigate("Doctor Profile", { doctorId: doctor._id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}
