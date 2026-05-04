import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function TabLayout() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.orange,
          tabBarInactiveTintColor: colors.dim,
          tabBarLabelStyle: styles.label,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Today",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sunny" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            title: "",
            tabBarButton: () => (
              <Pressable style={styles.plusButton} onPress={() => setOpen(true)}>
                <Text style={styles.plusText}>＋</Text>
              </Pressable>
            ),
          }}
        />

        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>

      {/* ACTION MODAL */}
      <Modal visible={open} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Quick Add</Text>

            <Pressable
              style={styles.actionButton}
              onPress={() => {
                setOpen(false);
                router.push("/add-meal");
              }}
            >
              <Text style={styles.actionEmoji}>🍽️</Text>
              <Text style={styles.actionText}>Add Meal</Text>
            </Pressable>

            <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#050505",
    borderTopColor: "#151515",
    height: 86,
    paddingBottom: 18,
    paddingTop: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
  },
  plusButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    borderWidth: 6,
    borderColor: "#000",
  },
  plusText: {
    color: "#111",
    fontSize: 36,
    fontWeight: "900",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionCard: {
    width: "85%",
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 16,
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: colors.cardSoft,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  closeButton: {
    marginTop: 10,
    alignItems: "center",
  },
  closeText: {
    color: colors.orange,
    fontWeight: "900",
  },
});