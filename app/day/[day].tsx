import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function DayDetailsScreen() {
  const router = useRouter();
  const { day } = useLocalSearchParams();

  const [tasks, setTasks] = useState<{ text: string; done: boolean }[]>([]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;

    setTasks([...tasks, { text: newTask.trim(), done: false }]);
    setNewTask("");
  };

  const toggleTask = (index: number) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Day",
          headerStyle: { backgroundColor: "#000" },
          headerTitleStyle: {
            color: "#fff",
            fontWeight: "bold",
          },
          headerTintColor: "#4e0000",
          headerBackTitle: "",
        }}
      />

      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>Day {day}</Text>
        <Text style={styles.subtitle}>Challenges</Text>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Add a challenge..."
            placeholderTextColor="#555"
            value={newTask}
            onChangeText={setNewTask}
          />

          <Pressable style={styles.addButton} onPress={addTask}>
            <Text style={styles.addButtonText}>Add Task</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
          {tasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No challenges on this day</Text>
            </View>
          ) : (
            tasks.map((task, index) => (
              <Pressable
                key={index}
                onPress={() => toggleTask(index)}
                style={styles.taskItem}
              >
                <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
                  {task.done && <Text style={styles.checkmark}>✓</Text>}
                </View>

                <Text style={[styles.taskText, task.done && styles.taskDone]}>
                  {task.text}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 24,
    paddingHorizontal: 22,
  },
  backButton: {
    marginBottom: 18,
    alignSelf: "flex-start",
  },
  backText: {
    color: "#777",
    fontSize: 20,
    fontWeight: "500",
  },
  title: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "bold",
    letterSpacing: -1,
  },
  subtitle: {
    color: "#4e0000",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 2,
    marginBottom: 26,
  },
  inputCard: {
    backgroundColor: "#080808",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    padding: 16,
    borderRadius: 20,
    fontSize: 16,
    marginBottom: 14,
  },
  addButton: {
    backgroundColor: "#4e0000",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  taskList: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: "#050505",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#111",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
  taskItem: {
    backgroundColor: "#080808",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#4e0000",
    marginRight: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDone: {
    backgroundColor: "#4e0000",
  },
  checkmark: {
    color: "#fff",
    fontWeight: "bold",
  },
  taskText: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
  },
  taskDone: {
    color: "#666",
    textDecorationLine: "line-through",
  },
});