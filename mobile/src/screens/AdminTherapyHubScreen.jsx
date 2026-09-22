/**
 * AdminTherapyHubScreen.jsx
 *
 * Admin Therapy Hub Management page.
 *
 * Features:
 *  - View all audios grouped by category
 *  - Add audio (with file upload via expo-document-picker)
 *  - Edit audio metadata / replace audio file
 *  - Delete audio (with confirmation)
 *  - Create a new category (dynamic — not hardcoded)
 *
 * Follows the same theme system, SafeScreen, BubbleBackground, and styling
 * conventions as AdminDashboardScreen.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import SafeScreen from "../../components/SafeScreen";
import BubbleBackground from "../../components/BubbleBackground";
import { useAuthStore } from "../../store/authStore";
import {
  getAudios,
  getCategories,
  createAudio,
  updateAudio,
  deleteAudio,
} from "../lib/therapyHubAdminApi";

// ─── Theme (mirrors AdminDashboardScreen) ────────────────────────────────────
const LIGHT = {
  page: "#eef5fb", card: "#ffffff", text: "#0f2f4c", subText: "#537290",
  border: "#d6e5f3", accent: "#1f7ed0", search: "#f7fbff", input: "#f0f7ff",
  danger: "#d64545", success: "#1f9d62", warning: "#d48b2a",
};
const DARK = {
  page: "#071528", card: "#0d2138", text: "#eaf2ff", subText: "#9db8d5",
  border: "#25425f", accent: "#5ab0ff", search: "#0f2a44", input: "#0f2a44",
  danger: "#d64545", success: "#2dba87", warning: "#d48b2a",
};

const STRESS_LEVELS = ["Normal", "Mild", "Moderate", "Severe", "Extremely Severe"];

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "",
  displayOrder: "0",
  recommendedStressLevels: ["Normal", "Mild", "Moderate"],
  thumbnail: "",
};

// ─── Small shared components ─────────────────────────────────────────────────

function SectionHeader({ title, theme, action }) {
  return (
    <View style={ss.sectionHeader}>
      <Text style={[ss.sectionTitle, { color: theme.text }]}>{title}</Text>
      {action}
    </View>
  );
}

function Divider({ theme }) {
  return <View style={[ss.divider, { backgroundColor: theme.border }]} />;
}

function PillBadge({ label, color, theme }) {
  return (
    <View style={[ss.pill, { borderColor: color, backgroundColor: color + "22" }]}>
      <Text style={[ss.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Audio Card ──────────────────────────────────────────────────────────────

function AudioCard({ item, theme, onEdit, onDelete }) {
  const stressPreview = (item.recommendedStressLevels ?? []).slice(0, 3);
  const hasMore = (item.recommendedStressLevels ?? []).length > 3;

  return (
    <View style={[ss.audioCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={ss.audioCardHeader}>
        <View style={[ss.audioIconWrap, { backgroundColor: theme.accent + "22" }]}>
          <Ionicons name="musical-notes" size={20} color={theme.accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[ss.audioTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[ss.audioMeta, { color: theme.subText }]} numberOfLines={1}>
            Order: {item.displayOrder ?? 0}
          </Text>
        </View>
        <View style={ss.audioActions}>
          <Pressable
            style={[ss.iconBtn, { backgroundColor: theme.accent + "18", borderColor: theme.border }]}
            onPress={() => onEdit(item)}
            accessibilityLabel={`Edit ${item.title}`}
          >
            <Ionicons name="create-outline" size={16} color={theme.accent} />
          </Pressable>
          <Pressable
            style={[ss.iconBtn, { backgroundColor: theme.danger + "18", borderColor: theme.border }]}
            onPress={() => onDelete(item)}
            accessibilityLabel={`Delete ${item.title}`}
          >
            <Ionicons name="trash-outline" size={16} color={theme.danger} />
          </Pressable>
        </View>
      </View>

      {!!item.description && (
        <Text style={[ss.audioDesc, { color: theme.subText }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={ss.pillRow}>
        {stressPreview.map((lvl) => (
          <PillBadge key={lvl} label={lvl} color={theme.accent} theme={theme} />
        ))}
        {hasMore && (
          <Text style={[ss.morePills, { color: theme.subText }]}>
            +{(item.recommendedStressLevels ?? []).length - 3}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Category Section ────────────────────────────────────────────────────────

function CategorySection({ categoryName, items, theme, onEdit, onDelete }) {
  return (
    <View style={[ss.categorySection, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={ss.catHeaderRow}>
        <View style={[ss.catDot, { backgroundColor: theme.accent }]} />
        <Text style={[ss.catTitle, { color: theme.text }]}>{categoryName}</Text>
        <View style={[ss.catBadge, { backgroundColor: theme.accent + "22" }]}>
          <Text style={[ss.catBadgeText, { color: theme.accent }]}>{items.length}</Text>
        </View>
      </View>
      <Divider theme={theme} />
      {items.map((item) => (
        <AudioCard
          key={item._id}
          item={item}
          theme={theme}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}

// ─── Form Modal ──────────────────────────────────────────────────────────────

function AudioFormModal({
  visible, onClose, onSave, initialData, categories, theme, isEditing, saving,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fileAsset, setFileAsset] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [useNewCategory, setUseNewCategory] = useState(false);

  // Sync form when modal opens/closes or initial data changes
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setForm({
          title: initialData.title ?? "",
          description: initialData.description ?? "",
          category: initialData.category ?? "",
          displayOrder: String(initialData.displayOrder ?? 0),
          recommendedStressLevels: initialData.recommendedStressLevels ?? ["Normal", "Mild", "Moderate"],
          thumbnail: initialData.thumbnail ?? "",
        });
        setUseNewCategory(false);
        setNewCategory("");
      } else {
        setForm(EMPTY_FORM);
        setUseNewCategory(false);
        setNewCategory("");
      }
      setFileAsset(null);
    }
  }, [visible, initialData]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setFileAsset(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Error", "Could not open file picker. " + err.message);
    }
  };

  const toggleStressLevel = (level) => {
    setForm((prev) => {
      const current = prev.recommendedStressLevels;
      const updated = current.includes(level)
        ? current.filter((l) => l !== level)
        : [...current, level];
      return { ...prev, recommendedStressLevels: updated };
    });
  };

  const handleSave = () => {
    const resolvedCategory = useNewCategory ? newCategory.trim() : form.category.trim();
    if (!form.title.trim()) { Alert.alert("Validation", "Title is required."); return; }
    if (!resolvedCategory) { Alert.alert("Validation", "Category is required."); return; }
    if (!isEditing && !fileAsset) { Alert.alert("Validation", "Please select an audio file."); return; }
    onSave({ ...form, category: resolvedCategory }, fileAsset);
  };

  const inputStyle = [ss.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }];
  const labelStyle = [ss.label, { color: theme.subText }];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ss.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <View style={[ss.modalSheet, { backgroundColor: theme.card }]}>
            {/* Modal header */}
            <View style={[ss.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[ss.modalTitle, { color: theme.text }]}>
                {isEditing ? "Edit Audio" : "Add Audio"}
              </Text>
              <Pressable onPress={onClose} style={ss.modalCloseBtn} accessibilityLabel="Close modal">
                <Ionicons name="close" size={22} color={theme.subText} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={ss.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Title */}
              <Text style={labelStyle}>Title *</Text>
              <TextInput
                style={inputStyle}
                value={form.title}
                onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
                placeholder="e.g. Ocean Waves"
                placeholderTextColor={theme.subText}
                accessibilityLabel="Audio title"
              />

              {/* Category */}
              <Text style={[labelStyle, { marginTop: 12 }]}>Category *</Text>
              <View style={[ss.categoryToggleRow, { borderColor: theme.border }]}>
                <Text style={[ss.categoryToggleLabel, { color: theme.text }]}>Create new category</Text>
                <Switch
                  value={useNewCategory}
                  onValueChange={setUseNewCategory}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#fff"
                  accessibilityLabel="Toggle new category"
                />
              </View>

              {useNewCategory ? (
                <TextInput
                  style={[inputStyle, { marginTop: 6 }]}
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="New category name (e.g. Sleep)"
                  placeholderTextColor={theme.subText}
                  accessibilityLabel="New category name"
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 6 }}
                  contentContainerStyle={ss.categoryChipsRow}
                >
                  {categories.map((cat) => {
                    const selected = form.category === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setForm((p) => ({ ...p, category: cat }))}
                        style={[
                          ss.categoryChip,
                          { borderColor: selected ? theme.accent : theme.border },
                          selected && { backgroundColor: theme.accent + "22" },
                        ]}
                        accessibilityLabel={`Select category ${cat}`}
                      >
                        <Text style={[ss.categoryChipText, { color: selected ? theme.accent : theme.subText }]}>
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Description */}
              <Text style={[labelStyle, { marginTop: 12 }]}>Description</Text>
              <TextInput
                style={[inputStyle, { height: 72, textAlignVertical: "top" }]}
                value={form.description}
                onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                placeholder="Brief description of the audio…"
                placeholderTextColor={theme.subText}
                multiline
                accessibilityLabel="Audio description"
              />

              {/* Audio file */}
              <Text style={[labelStyle, { marginTop: 12 }]}>
                Audio File {isEditing ? "(leave empty to keep existing)" : "*"}
              </Text>
              <Pressable
                style={[ss.filePickerBtn, { borderColor: theme.border, backgroundColor: theme.input }]}
                onPress={pickFile}
                accessibilityLabel="Pick audio file"
              >
                <Ionicons
                  name={fileAsset ? "checkmark-circle" : "cloud-upload-outline"}
                  size={18}
                  color={fileAsset ? theme.success : theme.subText}
                />
                <Text style={[ss.filePickerText, { color: fileAsset ? theme.success : theme.subText }]} numberOfLines={1}>
                  {fileAsset ? fileAsset.name : "Tap to select audio file (MP3, WAV, OGG…)"}
                </Text>
              </Pressable>

              {/* Display order */}
              <Text style={[labelStyle, { marginTop: 12 }]}>Display Order</Text>
              <TextInput
                style={inputStyle}
                value={form.displayOrder}
                onChangeText={(v) => setForm((p) => ({ ...p, displayOrder: v.replace(/[^0-9]/g, "") }))}
                placeholder="0"
                placeholderTextColor={theme.subText}
                keyboardType="numeric"
                accessibilityLabel="Display order"
              />

              {/* Recommended stress levels */}
              <Text style={[labelStyle, { marginTop: 12 }]}>Recommended Stress Levels</Text>
              <View style={ss.stressLevelsGrid}>
                {STRESS_LEVELS.map((level) => {
                  const selected = form.recommendedStressLevels.includes(level);
                  return (
                    <Pressable
                      key={level}
                      onPress={() => toggleStressLevel(level)}
                      style={[
                        ss.stressChip,
                        { borderColor: selected ? theme.accent : theme.border },
                        selected && { backgroundColor: theme.accent + "22" },
                      ]}
                      accessibilityLabel={`Toggle stress level ${level}`}
                    >
                      {selected && (
                        <Ionicons name="checkmark" size={12} color={theme.accent} style={{ marginRight: 3 }} />
                      )}
                      <Text style={[ss.stressChipText, { color: selected ? theme.accent : theme.subText }]}>
                        {level}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Thumbnail URL */}
              <Text style={[labelStyle, { marginTop: 12 }]}>Thumbnail URL (optional)</Text>
              <TextInput
                style={inputStyle}
                value={form.thumbnail}
                onChangeText={(v) => setForm((p) => ({ ...p, thumbnail: v }))}
                placeholder="https://images.unsplash.com/…"
                placeholderTextColor={theme.subText}
                autoCapitalize="none"
                keyboardType="url"
                accessibilityLabel="Thumbnail URL"
              />

              {/* Save button */}
              <Pressable
                style={({ pressed }) => [
                  ss.saveBtn,
                  { backgroundColor: theme.accent, opacity: pressed || saving ? 0.75 : 1 },
                ]}
                onPress={handleSave}
                disabled={saving}
                accessibilityLabel="Save audio"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name={isEditing ? "save-outline" : "add-circle-outline"} size={16} color="#fff" />
                    <Text style={ss.saveBtnText}>{isEditing ? "Save Changes" : "Upload & Create"}</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AdminTherapyHubScreen() {
  const scheme = useColorScheme();
  const { token } = useAuthStore();

  const [manualDark, setManualDark] = useState(null);
  const isDark = manualDark === null ? scheme === "dark" : manualDark;
  const theme = isDark ? DARK : LIGHT;

  // Data
  const [grouped, setGrouped]       = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg]     = useState(null);

  // Modal state
  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget]   = useState(null); // null = create mode
  const [saving, setSaving]           = useState(false);

  // Entrance animation
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  const runEntrance = useCallback(() => {
    fadeIn.setValue(0); slideUp.setValue(16);
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [fadeIn, slideUp]);

  // ── Data loading ───────────────────────────────────────────────────────────

  const load = useCallback(async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setErrorMsg(null);
    try {
      const [audioData, cats] = await Promise.all([
        getAudios(token),
        getCategories(token),
      ]);
      setGrouped(audioData.grouped ?? {});
      setCategories(cats);
      runEntrance();
    } catch (err) {
      setErrorMsg(err.message || "Could not load Therapy Hub data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, runEntrance]);

  useEffect(() => { load(false); }, [load]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditTarget(null);
    setFormVisible(true);
  };

  const openEditModal = (item) => {
    setEditTarget(item);
    setFormVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setFormVisible(false);
    setEditTarget(null);
  };

  const handleSave = async (fields, fileAsset) => {
    setSaving(true);
    try {
      if (editTarget) {
        await updateAudio(token, editTarget._id, fields, fileAsset || null);
        Alert.alert("Success", "Audio updated successfully.");
      } else {
        await createAudio(token, fields, fileAsset);
        Alert.alert("Success", "Audio created and uploaded successfully.");
      }
      setFormVisible(false);
      setEditTarget(null);
      await load(true);
    } catch (err) {
      Alert.alert("Error", err.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      "Delete Audio",
      `Are you sure you want to delete "${item.title}"?\n\nThis will permanently remove the audio file from Azure Blob Storage and cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAudio(token, item._id);
              Alert.alert("Deleted", `"${item.title}" has been deleted.`);
              await load(true);
            } catch (err) {
              Alert.alert("Error", err.message || "Could not delete audio.");
            }
          },
        },
      ]
    );
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const totalCount = Object.values(grouped).reduce((s, items) => s + items.length, 0);

  if (loading) {
    return (
      <SafeScreen>
        <View style={[ss.fill, { backgroundColor: theme.page }]}>
          <BubbleBackground />
          <View style={ss.loadingWrap}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[ss.loadingText, { color: theme.subText }]}>Loading Therapy Hub…</Text>
          </View>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View style={[ss.fill, { backgroundColor: theme.page }]}>
        <BubbleBackground />

        <ScrollView
          contentContainerStyle={ss.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.accent} />
          }
        >
          {/* ── Hero header ── */}
          <View style={[ss.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={ss.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={[ss.heroTitle, { color: theme.text }]}>Therapy Hub Management</Text>
                <Text style={[ss.heroSub, { color: theme.subText }]}>
                  {totalCount} audio{totalCount !== 1 ? "s" : ""} across{" "}
                  {Object.keys(grouped).length} categor{Object.keys(grouped).length !== 1 ? "ies" : "y"}
                </Text>
              </View>
              <Pressable
                onPress={() => setManualDark((p) => p === null ? !isDark : !p)}
                style={({ pressed }) => [ss.themeBtn, { backgroundColor: theme.search, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}
                accessibilityLabel="Toggle dark mode"
              >
                <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={18} color={theme.text} />
              </Pressable>
            </View>

            {/* Action buttons */}
            <View style={ss.actionRow}>
              <Pressable
                style={({ pressed }) => [ss.primaryBtn, { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 }]}
                onPress={openAddModal}
                accessibilityLabel="Add new audio"
              >
                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                <Text style={ss.primaryBtnText}>Add Audio</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Error state ── */}
          {errorMsg ? (
            <View style={[ss.errorCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="warning-outline" size={28} color={theme.danger} />
              <Text style={[ss.errorText, { color: theme.danger }]}>{errorMsg}</Text>
              <Pressable onPress={() => load(false)} style={[ss.retryBtn, { borderColor: theme.accent }]}>
                <Text style={[ss.retryBtnText, { color: theme.accent }]}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {/* ── Content ── */}
          {!errorMsg && (
            <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
              {Object.keys(grouped).length === 0 ? (
                <View style={[ss.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={[ss.emptyIconWrap, { backgroundColor: theme.accent + "18", borderColor: theme.border }]}>
                    <Ionicons name="musical-notes-outline" size={28} color={theme.accent} />
                  </View>
                  <Text style={[ss.emptyTitle, { color: theme.text }]}>No audios yet</Text>
                  <Text style={[ss.emptySub, { color: theme.subText }]}>
                    Tap "Add Audio" to upload the first therapy audio.
                  </Text>
                </View>
              ) : (
                Object.entries(grouped).map(([cat, items]) => (
                  <CategorySection
                    key={cat}
                    categoryName={cat}
                    items={items}
                    theme={theme}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* ── Add / Edit Modal ── */}
        <AudioFormModal
          visible={formVisible}
          onClose={closeModal}
          onSave={handleSave}
          initialData={editTarget}
          categories={categories}
          theme={theme}
          isEditing={!!editTarget}
          saving={saving}
        />
      </View>
    </SafeScreen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  fill:         { flex: 1 },
  scrollContent:{ paddingHorizontal: 16, paddingBottom: 40, gap: 14, paddingTop: 8 },

  // Loading
  loadingWrap:  { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText:  { fontSize: 15, fontWeight: "600" },

  // Hero
  hero:         { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  heroTop:      { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  heroTitle:    { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  heroSub:      { fontSize: 13, fontWeight: "500", marginTop: 2 },
  themeBtn:     { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  actionRow:    { flexDirection: "row", gap: 8 },
  primaryBtn:   { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Error
  errorCard:    { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 10 },
  errorText:    { fontSize: 14, fontWeight: "600", textAlign: "center" },
  retryBtn:     { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6 },
  retryBtnText: { fontSize: 13, fontWeight: "700" },

  // Empty
  emptyCard:    { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 10 },
  emptyIconWrap:{ width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle:   { fontSize: 16, fontWeight: "700" },
  emptySub:     { fontSize: 13, fontWeight: "500", textAlign: "center" },

  // Category section
  categorySection: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  catHeaderRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 8 },
  catDot:       { width: 8, height: 8, borderRadius: 4 },
  catTitle:     { flex: 1, fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  catBadge:     { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { fontSize: 12, fontWeight: "700" },
  divider:      { height: 1, marginHorizontal: 14 },

  // Audio card
  audioCard:      { marginHorizontal: 10, marginVertical: 8, borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  audioCardHeader:{ flexDirection: "row", alignItems: "center" },
  audioIconWrap:  { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  audioTitle:     { fontSize: 14, fontWeight: "700" },
  audioMeta:      { fontSize: 12, fontWeight: "500", marginTop: 1 },
  audioDesc:      { fontSize: 12, lineHeight: 17 },
  audioActions:   { flexDirection: "row", gap: 6 },
  iconBtn:        { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pillRow:        { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  pill:           { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pillText:       { fontSize: 11, fontWeight: "600" },
  morePills:      { fontSize: 11, fontWeight: "600", alignSelf: "center" },

  // Section header
  sectionHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle:   { fontSize: 16, fontWeight: "700" },

  // Modal
  modalOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  modalSheet:     { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", overflow: "hidden" },
  modalHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle:     { fontSize: 17, fontWeight: "800" },
  modalCloseBtn:  { padding: 4 },
  modalBody:      { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16, gap: 4 },

  // Form inputs
  label:          { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 },
  input:          { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: "500" },

  // Category selection
  categoryToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  categoryToggleLabel: { fontSize: 14, fontWeight: "500" },
  categoryChipsRow: { gap: 6, flexDirection: "row" },
  categoryChip:   { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  categoryChipText: { fontSize: 13, fontWeight: "600" },

  // File picker
  filePickerBtn:  { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, borderStyle: "dashed" },
  filePickerText: { flex: 1, fontSize: 13, fontWeight: "500" },

  // Stress levels
  stressLevelsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 4 },
  stressChip:     { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  stressChipText: { fontSize: 12, fontWeight: "600" },

  // Save button
  saveBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, paddingVertical: 14, marginTop: 20 },
  saveBtnText:    { color: "#fff", fontSize: 15, fontWeight: "800" },
});
