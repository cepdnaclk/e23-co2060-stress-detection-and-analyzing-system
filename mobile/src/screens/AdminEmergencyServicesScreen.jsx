/**
 * AdminEmergencyServicesScreen.jsx
 *
 * Admin management page for Emergency Mental Health Services.
 * Follows the same architecture, theme system, SafeScreen, BubbleBackground,
 * Modal pattern and styling conventions as AdminTherapyHubScreen.jsx.
 *
 * Features:
 *  - List all services (sorted by displayOrder)
 *  - Add a new service (Modal form)
 *  - Edit an existing service (same Modal, pre-populated)
 *  - Delete a service (Alert confirmation)
 *  - Pull-to-refresh
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import SafeScreen from "../../components/SafeScreen";
import BubbleBackground from "../../components/BubbleBackground";
import { useAuthStore } from "../../store/authStore";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../lib/emergencyServicesApi";

// ─── Theme (exactly mirrors AdminTherapyHubScreen) ───────────────────────────
const LIGHT = {
  page: "#eef5fb", card: "#ffffff", text: "#0f2f4c", subText: "#537290",
  border: "#d6e5f3", accent: "#1f7ed0", accentSoft: "#e3f2fd",
  input: "#f0f7ff", danger: "#d64545", success: "#1f9d62",
  modalBg: "#ffffff",
  // App's primary blue header — matching AppDrawer header color
  headerBg: "#0b5ea8", headerText: "#ffffff",
  // Red kept only for delete (danger) and emergency contact chip
  contactColor: "#c0392b", contactBg: "#fdecea",
};
const DARK = {
  page: "#071528", card: "#0d2138", text: "#eaf2ff", subText: "#9db8d5",
  border: "#25425f", accent: "#5ab0ff", accentSoft: "#0f2a44",
  input: "#0f2a44", danger: "#e74c3c", success: "#2dba87",
  modalBg: "#0d2138",
  headerBg: "#0a2a50", headerText: "#eaf2ff",
  contactColor: "#ff7070", contactBg: "#3a1515",
};

// ─── Empty form state ─────────────────────────────────────────────────────────
const EMPTY_FORM = { serviceName: "", contact: "", description: "", displayOrder: "" };

// ─── ServiceCard ──────────────────────────────────────────────────────────────
function ServiceCard({ service, theme, onEdit, onDelete }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.orderBadge}>
          <Text style={[styles.orderText, { color: theme.accent }]}>
            #{service.displayOrder}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable
            onPress={() => onEdit(service)}
            style={[styles.actionBtn, { backgroundColor: theme.accentSoft }]}
            accessibilityLabel={`Edit ${service.serviceName}`}
          >
            <Ionicons name="pencil" size={15} color={theme.accent} />
          </Pressable>
          <Pressable
            onPress={() => onDelete(service)}
            style={[styles.actionBtn, { backgroundColor: "#fdecea" }]}
            accessibilityLabel={`Delete ${service.serviceName}`}
          >
            <Ionicons name="trash" size={15} color={theme.danger} />
          </Pressable>
        </View>
      </View>

      <Text style={[styles.cardServiceName, { color: theme.text }]} numberOfLines={2}>
        {service.serviceName}
      </Text>
      <View style={[styles.contactChip, { backgroundColor: theme.contactBg }]}>
        <Ionicons name="call-outline" size={13} color={theme.contactColor} />
        <Text style={[styles.contactChipText, { color: theme.contactColor }]}>{service.contact}</Text>
      </View>
      <Text style={[styles.cardDescription, { color: theme.subText }]} numberOfLines={3}>
        {service.description}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminEmergencyServicesScreen() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? DARK : LIGHT;
  const { token } = useAuthStore();

  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget]     = useState(null); // null = add, object = edit
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);

  // ── Fetch ──
  const fetchServices = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError(err.message ?? "Failed to load services");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { fetchServices(); }, [fetchServices])
  );

  // ── Open modal ──
  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }

  function openEdit(service) {
    setEditTarget(service);
    setForm({
      serviceName: service.serviceName,
      contact: service.contact,
      description: service.description,
      displayOrder: String(service.displayOrder),
    });
    setModalVisible(true);
  }

  // ── Validate ──
  function validateForm() {
    if (!form.serviceName.trim()) {
      Alert.alert("Validation Error", "Service Name is required.");
      return false;
    }
    if (!form.contact.trim()) {
      Alert.alert("Validation Error", "Contact is required.");
      return false;
    }
    if (!form.description.trim()) {
      Alert.alert("Validation Error", "Description is required.");
      return false;
    }
    return true;
  }

  // ── Save ──
  async function handleSave() {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        serviceName: form.serviceName.trim(),
        contact: form.contact.trim(),
        description: form.description.trim(),
        displayOrder: form.displayOrder !== "" ? Number(form.displayOrder) : 0,
      };

      if (editTarget) {
        await updateService(token, editTarget._id, payload);
        Alert.alert("Success", "Service updated successfully.");
      } else {
        await createService(token, payload);
        Alert.alert("Success", "New service added successfully.");
      }

      setModalVisible(false);
      setForm(EMPTY_FORM);
      setEditTarget(null);
      fetchServices();
    } catch (err) {
      Alert.alert("Error", err.message ?? "Failed to save service.");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ──
  function handleDelete(service) {
    Alert.alert(
      "Delete Service",
      "Are you sure you want to delete this emergency mental-health service?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteService(token, service._id);
              Alert.alert("Deleted", "Service removed successfully.");
              fetchServices();
            } catch (err) {
              Alert.alert("Error", err.message ?? "Failed to delete service.");
            }
          },
        },
      ]
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeScreen>
      <BubbleBackground />

      {/* ── Header ── */}
      <View style={[styles.pageHeader, { backgroundColor: theme.headerBg }]}>
        <Text style={[styles.pageHeaderTitle, { color: theme.headerText }]}>
          Emergency Services Management
        </Text>
        <Pressable
          onPress={openAdd}
          style={[styles.addBtn, { backgroundColor: "rgba(255,255,255,0.18)" }]}
          accessibilityLabel="Add emergency service"
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Service</Text>
        </Pressable>
      </View>

      {/* ── List ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchServices(true)} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centred}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.stateText, { color: theme.subText }]}>Loading services…</Text>
          </View>
        ) : error ? (
          <View style={styles.centred}>
            <Ionicons name="cloud-offline-outline" size={48} color={theme.subText} />
            <Text style={[styles.stateText, { color: theme.subText }]}>{error}</Text>
            <Pressable
              onPress={() => fetchServices()}
              style={[styles.retryBtn, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.centred}>
            <Ionicons name="information-circle-outline" size={48} color={theme.subText} />
            <Text style={[styles.stateText, { color: theme.subText }]}>
              No emergency services found. Tap "Add Service" to create the first one.
            </Text>
          </View>
        ) : (
          services.map((svc) => (
            <ServiceCard
              key={svc._id}
              service={svc}
              theme={theme}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      {/* ── Add / Edit Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: theme.modalBg }]}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editTarget ? "Edit Service" : "Add Emergency Service"}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Close form"
              >
                <Ionicons name="close" size={24} color={theme.subText} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Service Name */}
              <Text style={[styles.label, { color: theme.text }]}>
                Service Name <Text style={{ color: theme.danger }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                value={form.serviceName}
                onChangeText={(v) => setForm((f) => ({ ...f, serviceName: v }))}
                placeholder="e.g. National Mental Health Helpline"
                placeholderTextColor={theme.subText}
                autoCapitalize="words"
              />

              {/* Contact */}
              <Text style={[styles.label, { color: theme.text }]}>
                Contact <Text style={{ color: theme.danger }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                value={form.contact}
                onChangeText={(v) => setForm((f) => ({ ...f, contact: v }))}
                placeholder="e.g. 1926 or 011 268 2535"
                placeholderTextColor={theme.subText}
                keyboardType="default"
              />

              {/* Description */}
              <Text style={[styles.label, { color: theme.text }]}>
                Description <Text style={{ color: theme.danger }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Describe what this service provides…"
                placeholderTextColor={theme.subText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Display Order */}
              <Text style={[styles.label, { color: theme.text }]}>Display Order</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                value={form.displayOrder}
                onChangeText={(v) => setForm((f) => ({ ...f, displayOrder: v }))}
                placeholder="e.g. 1 (lower = shown first)"
                placeholderTextColor={theme.subText}
                keyboardType="numeric"
              />

              {/* Save button */}
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={[styles.saveBtn, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]}
                accessibilityLabel={editTarget ? "Update service" : "Create service"}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editTarget ? "Update Service" : "Add Service"}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  pageHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  pageHeaderTitle: { fontSize: 17, fontWeight: "700", flex: 1, marginRight: 12 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  scrollContent: { padding: 16, paddingBottom: 32 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  orderText: { fontSize: 12, fontWeight: "700" },
  cardActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  cardServiceName: { fontSize: 15, fontWeight: "700", marginBottom: 6, lineHeight: 21 },
  contactChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contactChipText: { fontSize: 13, fontWeight: "700" },
  cardDescription: { fontSize: 12, lineHeight: 17 },

  centred: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 12,
  },
  stateText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 4,
  },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },

  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: { minHeight: 90, paddingTop: 10 },

  saveBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
