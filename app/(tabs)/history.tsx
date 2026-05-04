import { colors } from "@/constants/theme";
import {
    getDiaryDays,
    getReadableDate,
    getTotals,
} from "@/services/diaryStore";
import { getGoals, NutritionGoals } from "@/services/goalsStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HistoryScreen() {
  const [days, setDays] = useState<any[]>([]);
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
        setDays(await getDiaryDays());
        setGoals(await getGoals());
      };

      load();
    }, [])
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.subtitle}>Your daily nutrition diary.</Text>

      {days.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptyText}>
            Add your first meal and it will appear here.
          </Text>
        </View>
      ) : (
        days.map((day) => {
          const totals = getTotals(day.meals);
          const progress = Math.min(totals.calories / goals.calories, 1);

          return (
            <View key={day.date} style={styles.dayCard}>
              <View style={styles.dayTop}>
                <View>
                  <Text style={styles.dayTitle}>
                    {day.date === new Date().toISOString().slice(0, 10)
                      ? "Today"
                      : getReadableDate(day.date)}
                  </Text>
                  <Text style={styles.daySub}>
                    {day.meals.length} meal{day.meals.length > 1 ? "s" : ""}
                  </Text>
                </View>

                <Text style={styles.calories}>
                  {Math.round(totals.calories)} / {goals.calories}
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>

              <View style={styles.macroRow}>
                <Text style={styles.macroText}>P {totals.protein.toFixed(1)}g</Text>
                <Text style={styles.macroText}>C {totals.carbs.toFixed(1)}g</Text>
                <Text style={styles.macroText}>F {totals.fat.toFixed(1)}g</Text>
                <Text style={styles.macroText}>Fiber {totals.fiber.toFixed(1)}g</Text>
              </View>
            </View>
          );
        })
      )}

      <View style={{ height: 110 }} />
    </ScrollView>
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
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 8,
  },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  dayTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  daySub: {
    color: colors.muted,
    marginTop: 4,
  },
  calories: {
    color: colors.orange,
    fontSize: 18,
    fontWeight: "900",
  },
  progressTrack: {
    height: 10,
    backgroundColor: colors.cardSoft,
    borderRadius: 999,
    marginTop: 18,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.orange,
    borderRadius: 999,
  },
  macroRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  macroText: {
    color: colors.muted,
    backgroundColor: colors.cardSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "800",
  },
});