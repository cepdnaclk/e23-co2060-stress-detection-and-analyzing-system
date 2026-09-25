import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TextInput, useColorScheme, TouchableOpacity, Modal } from "react-native";
import SafeScreen from "../../components/SafeScreen";
import BubbleBackground from "../../components/BubbleBackground";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";

const LIGHT = { page: "#eef5fb", card: "#ffffff", text: "#0f2f4c", subText: "#537290", border: "#d6e5f3", accent: "#1f7ed0", search: "#f7fbff" };
const DARK  = { page: "#071528", card: "#0d2138", text: "#eaf2ff", subText: "#9db8d5", border: "#25425f", accent: "#5ab0ff", search: "#0f2a44" };

export default function AdminManagementScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const theme = isDark ? DARK : LIGHT;
  const token = useAuthStore((s) => s.token);

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/admins`, {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch admins");
      setAdmins(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.username || !newAdmin.email || !newAdmin.password) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/admin/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create admin");
      
      Alert.alert("Success", "Admin created successfully");
      setModalVisible(false);
      setNewAdmin({ username: "", email: "", password: "" });
      fetchAdmins();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setToggling(id);
    try {
      const res = await fetch(`${API_URL}/admin/admins/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");
      
      fetchAdmins();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setToggling(null);
    }
  };

  const filteredAdmins = admins.filter((u) => {
    const q = search.toLowerCase();
    const uname = String(u.username || "Unknown").toLowerCase();
    const email = String(u.email || "No email").toLowerCase();
    return uname.includes(q) || email.includes(q);
  });

  const renderItem = ({ item }) => {
    const role = String(item.role || "admin");
    const status = String(item.status || "active");
    return (
      <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.accent + "20" }]}>
            <Ionicons name="person" size={20} color={theme.accent} />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: theme.text }]}>{item.username || "Unknown"}</Text>
            <Text style={[styles.email, { color: theme.subText }]}>{item.email || "No email"}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: role === "super_admin" ? "#9c27b020" : "#eb5a6020" }]}>
            <Text style={[styles.roleText, { color: role === "super_admin" ? "#9c27b0" : "#eb5a60" }]}>
              {role.replace("_", " ")}
            </Text>
          </View>
        </View>
        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <Text style={[styles.detail, { color: status === "active" ? "#2dba87" : "#eb5a60" }]}>
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
          
          {role !== "super_admin" && (
            <TouchableOpacity 
              disabled={toggling === item._id}
              onPress={() => handleToggleStatus(item._id, status)}
              style={[styles.toggleBtn, { backgroundColor: status === "active" ? "#eb5a60" : "#2dba87" }]}
            >
              {toggling === item._id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.toggleBtnText}>{status === "active" ? "Deactivate" : "Activate"}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeScreen>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.page }]} />
      <BubbleBackground />
      <View style={[styles.container, { backgroundColor: "transparent" }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Admin Management</Text>
              <Text style={[styles.headerSub, { color: theme.subText }]}>Total Admins: {admins.length}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.addBtn, { backgroundColor: theme.accent }]}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add Admin</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.searchBar, { backgroundColor: theme.search, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={16} color={theme.subText} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search admins..."
              placeholderTextColor={theme.subText}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : (
          <FlatList
            data={filteredAdmins}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="people-outline" size={48} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.subText }]}>No admins found.</Text>
              </View>
            }
          />
        )}

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Admin</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={theme.subText} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Username</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.search, color: theme.text, borderColor: theme.border }]}
                    value={newAdmin.username}
                    onChangeText={(t) => setNewAdmin(p => ({ ...p, username: t }))}
                    placeholder="admin_user"
                    placeholderTextColor={theme.subText}
                    autoCapitalize="none"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Email</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.search, color: theme.text, borderColor: theme.border }]}
                    value={newAdmin.email}
                    onChangeText={(t) => setNewAdmin(p => ({ ...p, email: t }))}
                    placeholder="admin@example.com"
                    placeholderTextColor={theme.subText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Password</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.search, color: theme.text, borderColor: theme.border }]}
                    value={newAdmin.password}
                    onChangeText={(t) => setNewAdmin(p => ({ ...p, password: t }))}
                    placeholder="••••••••"
                    placeholderTextColor={theme.subText}
                    secureTextEntry
                  />
                </View>
              </View>
              
              <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: theme.border }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.modalBtnCancelText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: theme.accent }]}
                  onPress={handleCreateAdmin}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>Create Admin</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTitle: { fontSize: 24, fontWeight: "bold" },
  headerSub: { fontSize: 14, marginTop: 4, marginBottom: 12 },
  addBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  searchBar: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  list: { padding: 16, gap: 12 },
  userCard: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  cardHeader: { flexDirection: "row", padding: 16, alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  userInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: "600" },
  email: { fontSize: 13, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleText: { fontSize: 11, fontWeight: "bold", textTransform: "capitalize" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderTopWidth: 1 },
  detail: { fontSize: 13, fontWeight: "600" },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, minWidth: 90, alignItems: "center" },
  toggleBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 40 },
  emptyText: { fontSize: 16, marginTop: 12 },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  closeBtn: { padding: 4 },
  modalBody: { padding: 16, gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 15 },
  modalFooter: { flexDirection: "row", padding: 16, borderTopWidth: 1, gap: 12 },
  modalBtn: { flex: 1, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalBtnCancel: { borderWidth: 1 },
  modalBtnCancelText: { fontWeight: "600", fontSize: 15 },
  modalBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 }
});
