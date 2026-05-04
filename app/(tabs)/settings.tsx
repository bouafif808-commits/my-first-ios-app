import { colors } from "@/constants/theme";
import {
    getGoals,
    NutritionGoals,
    saveGoals,
} from "@/services/goalsStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function SettingsScreen() {
  const [goals, setGoals] = useState<NutritionGoals>({
    calories: 1800,
    protein: 130,
    carbs: 170,
    fat: 55,
    fiber: 25,
  });

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const saved = await getGoals();
        setGoals(saved);
      };

      load();
    }, [])
  );

  const updateGoal = (key: keyof NutritionGoals, value: string) => {
    const number = Number(value.replace(/[^0-9]/g, ""));

    setGoals({
      ...goals,
      [key]: number,
    });
  };

  const save = async () => {
    await saveGoals(goals);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Set your daily nutrition goals.</Text>

      <View style={styles.card}>
        <GoalInput
          label="Calories"
          unit="kcal"
          value={goals.calories}
          onChange={(value) => updateGoal("calories", value)}
        />

        <GoalInput
          label="Protein"
          unit="g"
          value={goals.protein}
          onChange={(value) => updateGoal("protein", value)}
        />

        <GoalInput
          label="Carbs"
          unit="g"
          value={goals.carbs}
          onChange={(value) => updateGoal("carbs", value)}
        />

        <GoalInput
          label="Fat"
          unit="g"
          value={goals.fat}
          onChange={(value) => updateGoal("fat", value)}
        />

        <GoalInput
          label="Fiber"
          unit="g"
          value={goals.fiber}
          onChange={(value) => updateGoal("fiber", value)}
        />

        <Pressable style={styles.saveButton} onPress={save}>
          <Text style={styles.saveText}>Save Goals</Text>
        </Pressable>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function GoalInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.goalRow}>
      <View>
        <Text style={styles.goalLabel}>{label}</Text>
        <Text style={styles.goalSub}>Daily target</Text>
      </View>

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(value)}
          onChangeText={onChange}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 60,
    paddingHorizontal: 18,
  },
  title: {
    color: colors.text,
    fontSize: 38,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 32,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalRow: {
    backgroundColor: colors.cardSoft,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  goalSub: {
    color: colors.muted,
    marginTop: 3,
    fontSize: 12,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#050505",
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  input: {
    color: colors.text,
    width: 70,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
    paddingVertical: 10,
  },
  unit: {
    color: colors.muted,
    marginLeft: 6,
    fontWeight: "800",
  },
  saveButton: {
    backgroundColor: colors.orange,
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    marginTop: 6,
  },
  saveText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "900",
  },
});