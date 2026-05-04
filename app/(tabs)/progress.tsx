import { colors } from "@/constants/theme";
import { getDiaryDays, getTotals } from "@/services/diaryStore";
import { getGoals, NutritionGoals } from "@/services/goalsStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

type Range = "Week" | "Month" | "3 Months" | "Year";

const ranges: Range[] = ["Week", "Month", "3 Months", "Year"];
const CHART_MAX = 2400;

export default function ProgressScreen() {
  const [activeRange, setActiveRange] = useState<Range>("Week");
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

  const filteredDays = useMemo(
    () => filterDays(days, activeRange),
    [days, activeRange]
  );

  const totalMeals = filteredDays.flatMap((day) => day.meals);
  const totals = getTotals(totalMeals);

  const dayCount = Math.max(filteredDays.length, 1);
  const dailyAverage = totals.calories / dayCount;

  const bars = buildChartBars(filteredDays, activeRange, goals.calories);

  const macroCalories = {
    protein: totals.protein * 4,
    carbs: totals.carbs * 4,
    fat: totals.fat * 9,
    other: Math.max(totals.fiber * 2, 0),
  };

  const macroTotal =
    macroCalories.protein +
      macroCalories.carbs +
      macroCalories.fat +
      macroCalories.other || 1;

  const shares = {
    protein: macroCalories.protein / macroTotal,
    carbs: macroCalories.carbs / macroTotal,
    fat: macroCalories.fat / macroTotal,
    other: macroCalories.other / macroTotal,
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Progress</Text>

      <View style={styles.rangeContainer}>
        {ranges.map((range) => {
          const active = activeRange === range;

          return (
            <Pressable
              key={range}
              onPress={() => setActiveRange(range)}
              style={[styles.rangeButton, active && styles.rangeButtonActive]}
            >
              <Text style={[styles.rangeText, active && styles.rangeTextActive]}>
                {range}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.statsHeader}>
        <View>
          <Text style={styles.sectionTitle}>Calories</Text>
          <Text style={styles.dateRange}>{getRangeDateLabel(activeRange)}</Text>
        </View>

        <View style={styles.averageWrap}>
          <Text style={styles.averageNumber}>{Math.round(dailyAverage)}</Text>
          <Text style={styles.averageLabel}>Daily Average</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartLeft}>
          {[2400, 1800, 1200, 600, 0].map((num) => (
            <Text key={num} style={styles.axisText}>
              {num.toLocaleString()}
            </Text>
          ))}
        </View>

        <View style={styles.chartRight}>
          <View
            style={[
              styles.goalLine,
              {
                bottom: `${Math.min((goals.calories / CHART_MAX) * 100, 100)}%`,
              },
            ]}
          />

          <Text
            style={[
              styles.goalText,
              {
                bottom: `${Math.min((goals.calories / CHART_MAX) * 100, 100)}%`,
              },
            ]}
          >
            Goal {goals.calories} kcal
          </Text>

          <View style={styles.gridLineTop} />
          <View style={styles.gridLineMid} />
          <View style={styles.gridLineLow} />

          <View style={styles.barsArea}>
            {bars.map((bar, index) => (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${bar.height}%`,
                        backgroundColor: bar.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.breakdownTitle}>Nutrient Breakdown (Daily Avg)</Text>

      <View style={styles.breakdownRow}>
        <MacroDonut
          protein={shares.protein}
          carbs={shares.carbs}
          fat={shares.fat}
          other={shares.other}
        />

        <View style={styles.legend}>
          <Legend
            label="Protein"
            value={`${safeAvg(totals.protein, dayCount)}g (${Math.round(
              shares.protein * 100
            )}%)`}
            color={colors.green}
          />
          <Legend
            label="Carbs"
            value={`${safeAvg(totals.carbs, dayCount)}g (${Math.round(
              shares.carbs * 100
            )}%)`}
            color={colors.blue}
          />
          <Legend
            label="Fat"
            value={`${safeAvg(totals.fat, dayCount)}g (${Math.round(
              shares.fat * 100
            )}%)`}
            color={colors.orange}
          />
          <Legend
            label="Others"
            value={`${safeAvg(totals.fiber, dayCount)}g (${Math.round(
              shares.other * 100
            )}%)`}
            color="#A174FF"
          />
        </View>
      </View>

      <View style={{ height: 130 }} />
    </ScrollView>
  );
}

function safeAvg(value: number, count: number) {
  return Math.round(value / Math.max(count, 1));
}

function filterDays(days: any[], range: Range) {
  const now = new Date();
  const cutoff = new Date();

  if (range === "Week") cutoff.setDate(now.getDate() - 7);
  if (range === "Month") cutoff.setMonth(now.getMonth() - 1);
  if (range === "3 Months") cutoff.setMonth(now.getMonth() - 3);
  if (range === "Year") cutoff.setFullYear(now.getFullYear() - 1);

  return days.filter((day) => new Date(day.date + "T12:00:00") >= cutoff);
}

function getRangeDateLabel(range: Range) {
  const now = new Date();

  if (range === "Week") {
    const start = new Date();
    start.setDate(now.getDate() - 6);

    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  }

  if (range === "Month") return "Last 30 days";
  if (range === "3 Months") return "Last 3 months";
  return "Last 12 months";
}

function buildChartBars(days: any[], range: Range, goal: number) {
  if (days.length === 0) {
    const labels =
      range === "Week"
        ? ["13", "14", "15", "16", "17", "18", "19"]
        : ["1", "2", "3", "4", "5", "6", "7"];

    return labels.map((label) => ({
      label,
      height: 3,
      color: "#222",
    }));
  }

  const sorted = [...days]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  return sorted.map((day) => {
    const totals = getTotals(day.meals);
    const date = new Date(day.date + "T12:00:00");
    const value = totals.calories;

    return {
      label: String(date.getDate()),
      height: Math.min(Math.max((value / CHART_MAX) * 100, 3), 100),
      color:
        value > goal
          ? colors.red
          : value > goal * 0.8
          ? colors.orange
          : colors.green,
    };
  });
}

function MacroDonut({
  protein,
  carbs,
  fat,
  other,
}: {
  protein: number;
  carbs: number;
  fat: number;
  other: number;
}) {
  const size = 142;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { value: protein, color: colors.green },
    { value: carbs, color: colors.blue },
    { value: fat, color: colors.orange },
    { value: other, color: "#A174FF" },
  ];

  let offset = 0;

  return (
    <Svg width={size} height={size}>
      <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#111"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {segments.map((segment, index) => {
          const dash = segment.value * circumference;
          const strokeDasharray = `${dash} ${circumference - dash}`;
          const strokeDashoffset = -offset;
          offset += dash;

          return (
            <Circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              fill="none"
            />
          );
        })}
      </G>
    </Svg>
  );
}

function Legend({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 58,
    paddingHorizontal: 18,
  },
  title: {
    color: colors.text,
    fontSize: 44,
    fontWeight: "900",
    marginBottom: 28,
  },
  rangeContainer: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 26,
    padding: 5,
    marginBottom: 42,
  },
  rangeButton: {
    flex: 1,
    height: 46,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeButtonActive: {
    backgroundColor: "#686868",
  },
  rangeText: {
    color: colors.muted,
    fontWeight: "900",
    fontSize: 15,
  },
  rangeTextActive: {
    color: colors.text,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
  },
  dateRange: {
    color: colors.muted,
    marginTop: 8,
    fontSize: 16,
  },
  averageWrap: {
    alignItems: "flex-end",
  },
  averageNumber: {
    color: colors.text,
    fontSize: 42,
    fontWeight: "900",
  },
  averageLabel: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 14,
  },
  chartCard: {
    height: 360,
    flexDirection: "row",
    marginBottom: 38,
  },
  chartLeft: {
    width: 64,
    justifyContent: "space-between",
    paddingBottom: 34,
    paddingTop: 6,
  },
  axisText: {
    color: colors.muted,
    fontSize: 20,
    fontWeight: "900",
  },
  chartRight: {
    flex: 1,
    position: "relative",
    borderBottomWidth: 1,
    borderColor: "#1A1A1A",
    marginLeft: 8,
    paddingBottom: 32,
  },
  goalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.green,
    opacity: 0.85,
    zIndex: 2,
  },
  goalText: {
    position: "absolute",
    right: 0,
    color: colors.green,
    fontSize: 15,
    fontWeight: "900",
    zIndex: 3,
    marginBottom: 8,
  },
  gridLineTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "25%",
    borderTopWidth: 1,
    borderColor: "#151515",
  },
  gridLineMid: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    borderTopWidth: 1,
    borderColor: "#151515",
  },
  gridLineLow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "75%",
    borderTopWidth: 1,
    borderColor: "#151515",
  },
  barsArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  barColumn: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  barTrack: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "70%",
    alignSelf: "center",
    borderRadius: 999,
    minHeight: 8,
  },
  barLabel: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
  },
  breakdownTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: "900",
    marginBottom: 24,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  legend: {
    flex: 1,
    gap: 20,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 14,
  },
  legendLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    flex: 1,
  },
  legendValue: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "800",
  },
});