import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TextInput, useColorScheme } from "react-native";
import SafeScreen from "../../components/SafeScreen";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";

const LIGHT = { page: "#eef5fb", card: "#ffffff", text: "#0f2f4c", subText: "#537290", border: "#d6e5f3", accent: "#1f7ed0", search: "#f7fbff" };
const DARK  = { page: "#071528", card: "#0d2138", text: "#eaf2ff", subText: "#9db8d5", border: "#25425f", accent: "#5ab0ff", search: "#0f2a44" };

export default function AdminUsersScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const theme = isDark ? DARK : LIGHT;
  const token = useAuthStore((s) => s.token);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch users");
      setUsers(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const uname = String(u.username || "Unknown").toLowerCase();
    const email = String(u.email || "No email").toLowerCase();
    const role  = String(u.role || "user").toLowerCase();
    return uname.includes(q) || email.includes(q) || role.includes(q);
  });

  const renderItem = ({ item }) => {
    const role = String(item.role || "user");
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
          <View style={[styles.roleBadge, { backgroundColor: role === "admin" ? "#eb5a6020" : role === "volunteer_doctor" ? "#2dba8720" : theme.search }]}>
            <Text style={[styles.roleText, { color: role === "admin" ? "#eb5a60" : role === "volunteer_doctor" ? "#2dba87" : theme.text }]}>
              {role.replace("_", " ")}
            </Text>
          </View>
        </View>
        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <Text style={[styles.detail, { color: theme.subText }]}>Age: {item.age || "N/A"}</Text>
          <Text style={[styles.detail, { color: theme.subText }]}>Gender: {item.gender || "N/A"}</Text>
          <Text style={[styles.detail, { color: theme.subText }]}>Joined: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.page }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>User Management</Text>
          <Text style={[styles.headerSub, { color: theme.subText }]}>Total Users: {users.length}</Text>
          <View style={[styles.searchBar, { backgroundColor: theme.search, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={16} color={theme.subText} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, email, or role..."
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
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="people-outline" size={48} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.subText }]}>No users found.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: "bold" },
  headerSub: { fontSize: 14, marginTop: 4, marginBottom: 12 },
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
  cardFooter: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderTopWidth: 1 },
  detail: { fontSize: 12, fontWeight: "500" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 40 },
  emptyText: { fontSize: 16, marginTop: 12 },
});
