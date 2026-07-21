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
import { Ionicons } from "@expo/vector-icons";

import SafeScreen from "../../components/SafeScreen";
import BubbleBackground from "../../components/BubbleBackground";
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
  const [allSpecializations, setAllSpecializations] = useState([]);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await doctorApi.getPublicDoctors({
        search: search.trim(),
        specialization: specialization.trim(),
        availability,
        sort,
      });
      const docs = data.doctors ?? [];
      setDoctors(docs);
      if (allSpecializations.length === 0 && docs.length > 0) {
        const specs = Array.from(new Set(docs.map((doc) => doc.specialization).filter(Boolean)));
        setAllSpecializations(specs);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialization, availability, sort]);

  return (
    <SafeScreen>
      <BubbleBackground variant="subtle" />
      <ScrollView contentContainerStyle={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>Volunteer Doctors</Text>
          <Text style={doctorStyles.pageSubtitle}>
            Search available specialists and request a consultation with the right doctor.
          </Text>
        </View>

        <View style={doctorStyles.searchContainer}>
          <View style={doctorStyles.searchBarRow}>
            <View style={doctorStyles.searchFieldContainer}>
              <Ionicons name="search-outline" size={18} color="#7a8ea6" style={doctorStyles.searchIcon} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={fetchDoctors}
                placeholder="Search doctors by name, hospital..."
                style={doctorStyles.searchTextInput}
                placeholderTextColor="#7a8ea6"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")} style={doctorStyles.clearButton}>
                  <Ionicons name="close-circle" size={16} color="#7a8ea6" />
                </Pressable>
              )}
            </View>
            <Pressable style={doctorStyles.searchActionButton} onPress={fetchDoctors}>
              <Ionicons name="arrow-forward-outline" size={18} color="#ffffff" />
            </Pressable>
          </View>

          {/* Horizontal scroll for filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={doctorStyles.horizontalFilterScroll}
          >
            {/* Availability Filters */}
            <View style={doctorStyles.filterGroup}>
              {filterOptions.map((value) => (
                <Pressable
                  key={value || "all"}
                  onPress={() => setAvailability(value)}
                  style={[
                    doctorStyles.filterChip,
                    availability === value ? doctorStyles.filterChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      doctorStyles.filterChipText,
                      availability === value ? doctorStyles.filterChipTextActive : null,
                    ]}
                  >
                    {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "All Availability"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={doctorStyles.filterDivider} />

            {/* Sort Options */}
            <View style={doctorStyles.filterGroup}>
              {[
                ["rating", "Top Rated"],
                ["reviews", "Most Reviewed"],
                ["experience", "Most Experienced"],
                ["newest", "Newest"],
              ].map(([value, label]) => (
                <Pressable
                  key={value}
                  onPress={() => setSort(value)}
                  style={[
                    doctorStyles.filterChip,
                    sort === value ? doctorStyles.filterChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      doctorStyles.filterChipText,
                      sort === value ? doctorStyles.filterChipTextActive : null,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {allSpecializations.length > 0 && (
              <>
                <View style={doctorStyles.filterDivider} />
                {/* Specialization Options */}
                <View style={doctorStyles.filterGroup}>
                  <Pressable
                    onPress={() => setSpecialization("")}
                    style={[
                      doctorStyles.filterChip,
                      specialization === "" ? doctorStyles.filterChipActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        doctorStyles.filterChipText,
                        specialization === "" ? doctorStyles.filterChipTextActive : null,
                      ]}
                    >
                      All Specializations
                    </Text>
                  </Pressable>
                  {allSpecializations.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setSpecialization(item)}
                      style={[
                        doctorStyles.filterChip,
                        specialization === item ? doctorStyles.filterChipActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          doctorStyles.filterChipText,
                          specialization === item ? doctorStyles.filterChipTextActive : null,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
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
