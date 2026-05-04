import ProgressRing from "@/components/ProgressRing";
import StatPill from "@/components/StatPill";
import { colors } from "@/constants/theme";
import {
  deleteMeal,
  DiaryMeal,
  getMealEmoji,
  getMealsForDate,
  getTodayKey,
  getTotals,
} from "@/services/diaryStore";
import { getGoals, NutritionGoals } from "@/services/goalsStore";
import {
  addTaskToDate,
  deleteTask,
  getTaskSettings,
  getTasksForDate,
  getTaskStats,
  getTaskStreak,
  MissionTask,
  saveTaskSettings,
  toggleTaskDone,
} from "@/services/tasksStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

type DisplayTask = MissionTask & { done: boolean };

const mealOrder: DiaryMeal["mealType"][] = [
  "Breakfast",
  "Lunch",
  "Snack",
  "Dinner",
];

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPastDays(baseDate: string, count = 5) {
  const base = new Date(baseDate + "T12:00:00");

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - (i + 1));

    return d.toISOString().slice(0, 10);
  });
}

function getWeekDays(selectedDate: string) {
  const base = new Date(selectedDate + "T12:00:00");
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + mondayOffset + index);

    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      day: date.getDate(),
      key: getDateKey(date),
    };
  });
}

function getMonthDays(selectedDate: string) {
  const base = new Date(selectedDate + "T12:00:00");
  const year = base.getFullYear();
  const month = base.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startOffset = firstDay.getDay();
  const totalSlots = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  return Array.from({ length: totalSlots }, (_, index) => {
    const dayNumber = index - startOffset + 1;

    if (dayNumber < 1 || dayNumber > lastDay.getDate()) {
      return null;
    }

    const date = new Date(year, month, dayNumber);

    return {
      day: dayNumber,
      key: getDateKey(date),
    };
  });
}

export default function TodayScreen() {
  const [mode, setMode] = useState<"nutrition" | "tasks">("nutrition");
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [meals, setMeals] = useState<DiaryMeal[]>([]);
  const [tasks, setTasks] = useState<DisplayTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [repeatTasks, setRepeatTasks] = useState(true);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<
    { date: string; total: number; done: number }[]
  >([]);

  const [goals, setGoals] = useState<NutritionGoals>({
    calories: 1800,
    protein: 130,
    carbs: 170,
    fat: 55,
    fiber: 25,
  });

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const monthDays = useMemo(() => getMonthDays(selectedDate), [selectedDate]);

  const totals = getTotals(meals);
  const caloriesLeft = Math.max(goals.calories - totals.calories, 0);
  const calorieProgress = Math.min(totals.calories / goals.calories, 1);

  const taskStats = getTaskStats(tasks);

  const selectedDateLabel =
    selectedDate === getTodayKey()
      ? "Today"
      : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });

  const monthTitle = new Date(selectedDate + "T12:00:00").toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  const loadData = async () => {
    const dayMeals = await getMealsForDate(selectedDate);
    const dayTasks = await getTasksForDate(selectedDate);
    const savedGoals = await getGoals();
    const taskSettings = await getTaskSettings();
    const currentStreak = await getTaskStreak();

    const pastDates = getPastDays(selectedDate);
    const historyData = await Promise.all(
      pastDates.map(async (date) => {
        const dayTasks = await getTasksForDate(date);
        const stats = getTaskStats(dayTasks);

        return {
          date,
          total: stats.total,
          done: stats.done,
        };
      })
    );

    setMeals(dayMeals);
    setTasks(dayTasks as DisplayTask[]);
    setGoals(savedGoals);
    setRepeatTasks(taskSettings.repeatTasks);
    setStreak(currentStreak);
    setHistory(historyData);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  const mealsByType = mealOrder.map((type) => ({
    type,
    meals: meals.filter((meal) => meal.mealType === type),
  }));

  const changeMonth = (direction: "prev" | "next") => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setMonth(date.getMonth() + (direction === "next" ? 1 : -1));
    setSelectedDate(getDateKey(date));
  };

  const selectCalendarDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setCalendarOpen(false);
  };

  const handleDeleteMeal = async (mealId: string) => {
    await deleteMeal(selectedDate, mealId);
    await loadData();
  };

  const handleRepeatToggle = async (value: boolean) => {
    setRepeatTasks(value);
    await saveTaskSettings({ repeatTasks: value });
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    await addTaskToDate(selectedDate, newTask.trim());
    setNewTask("");
    await loadData();
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleTaskDone(taskId, selectedDate);
    await loadData();
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    await loadData();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{selectedDateLabel}</Text>
          <Text style={styles.subtitle}>
            {mode === "nutrition" ? "Nutrition diary" : "Daily missions"}
          </Text>
        </View>

        <Pressable
          style={styles.calendarButton}
          onPress={() => setCalendarOpen(true)}
        >
          <Ionicons name="calendar-outline" size={25} color={colors.orange} />
        </Pressable>
      </View>

      <View style={styles.switchContainer}>
        <Pressable
          onPress={() => setMode("nutrition")}
          style={[
            styles.switchButton,
            mode === "nutrition" && styles.switchActive,
          ]}
        >
          <Text
            style={[
              styles.switchText,
              mode === "nutrition" && styles.switchTextActive,
            ]}
          >
            Nutrition
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode("tasks")}
          style={[styles.switchButton, mode === "tasks" && styles.switchActive]}
        >
          <Text
            style={[
              styles.switchText,
              mode === "tasks" && styles.switchTextActive,
            ]}
          >
            Missions
          </Text>
        </Pressable>
      </View>

      {mode === "nutrition" && (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <View style={styles.weekStrip}>
            {weekDays.map((item) => {
              const active = selectedDate === item.key;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setSelectedDate(item.key)}
                  style={[styles.weekDay, active && styles.weekDayActive]}
                >
                  <Text
                    style={[
                      styles.weekLabel,
                      active && styles.weekLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.weekNumber,
                      active && styles.weekNumberActive,
                    ]}
                  >
                    {item.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.calorieCard}>
            <Text style={styles.cardLabel}>CALORIE GOAL</Text>

            <View style={styles.ringWrap}>
              <ProgressRing
                size={205}
                strokeWidth={18}
                progress={calorieProgress}
              >
                <Text style={styles.ringNumber}>
                  {Math.round(totals.calories)}
                </Text>
                <Text style={styles.ringGoal}>/ {goals.calories} kcal</Text>
              </ProgressRing>
            </View>

            <Text style={styles.leftText}>
              {Math.round(caloriesLeft)} calories left
            </Text>

            <View style={styles.macrosRow}>
              <StatPill
                label={`Protein / ${goals.protein}g`}
                value={`${totals.protein.toFixed(1)}g`}
                color={colors.green}
              />
              <StatPill
                label={`Carbs / ${goals.carbs}g`}
                value={`${totals.carbs.toFixed(1)}g`}
                color={colors.blue}
              />
            </View>

            <View style={styles.macrosRow}>
              <StatPill
                label={`Fat / ${goals.fat}g`}
                value={`${totals.fat.toFixed(1)}g`}
                color={colors.yellow}
              />
              <StatPill
                label={`Fiber / ${goals.fiber}g`}
                value={`${totals.fiber.toFixed(1)}g`}
                color={colors.orange}
              />
            </View>
          </View>

          <View style={styles.mealsHeader}>
            <Text style={styles.sectionTitle}>Meals</Text>

            <Pressable onPress={() => setEditMode(!editMode)}>
              <Text style={styles.editText}>{editMode ? "Done" : "Edit"}</Text>
            </Pressable>
          </View>

          {mealsByType.map(({ type, meals }) => {
            const mealTotals = getTotals(meals);

            return (
              <View key={type} style={styles.mealCard}>
                <View style={styles.mealTop}>
                  <View style={styles.mealTitleRow}>
                    <Text style={styles.mealEmoji}>{getMealEmoji(type)}</Text>
                    <View>
                      <Text style={styles.mealTitle}>{type}</Text>
                      <Text style={styles.mealSub}>
                        {meals.length === 0
                          ? "No meal added"
                          : `${Math.round(mealTotals.calories)} kcal`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.mealCalories}>
                    {meals.length === 0 ? "—" : Math.round(mealTotals.calories)}
                  </Text>
                </View>

                {meals.length === 0 && (
                  <View style={styles.emptyMealBox}>
                    <Text style={styles.emptyMealText}>
                      Tap + to add {type.toLowerCase()}
                    </Text>
                  </View>
                )}

                {meals.map((meal) => (
                  <View key={meal.id} style={styles.loggedMeal}>
                    <View style={styles.loggedMealTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.loggedTitle}>
                          {meal.originalText}
                        </Text>
                        <Text style={styles.loggedMeta}>
                          {Math.round(meal.calories)} kcal • P{" "}
                          {meal.protein.toFixed(1)}g • C{" "}
                          {meal.carbs.toFixed(1)}g • F {meal.fat.toFixed(1)}g •
                          Fiber {meal.fiber.toFixed(1)}g
                        </Text>
                      </View>

                      {editMode && (
                        <Pressable
                          style={styles.deleteButton}
                          onPress={() => handleDeleteMeal(meal.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#111"
                          />
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {mode === "tasks" && (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <View style={styles.weekStrip}>
            {weekDays.map((item) => {
              const active = selectedDate === item.key;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setSelectedDate(item.key)}
                  style={[styles.weekDay, active && styles.weekDayActive]}
                >
                  <Text
                    style={[
                      styles.weekLabel,
                      active && styles.weekLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.weekNumber,
                      active && styles.weekNumberActive,
                    ]}
                  >
                    {item.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>{streak} day streak</Text>
              <Text style={styles.streakSub}>
                Complete all missions daily to keep it alive.
              </Text>
            </View>
          </View>

          <View style={styles.missionHero}>
            <Text style={styles.cardLabel}>DAILY MISSIONS</Text>

            <View style={styles.ringWrap}>
              <ProgressRing
                size={205}
                strokeWidth={18}
                progress={taskStats.progress}
              >
                <Text style={styles.ringNumber}>
                  {taskStats.done}/{taskStats.total}
                </Text>
                <Text style={styles.ringGoal}>completed</Text>
              </ProgressRing>
            </View>

            <Text style={styles.leftText}>
              {taskStats.total === 0
                ? "No missions yet"
                : `${taskStats.total - taskStats.done} missions left`}
            </Text>
          </View>

          <View style={styles.repeatCard}>
            <View>
              <Text style={styles.repeatTitle}>Repeat tasks</Text>
              <Text style={styles.repeatSub}>
                New missions repeat daily by default.
              </Text>
            </View>

            <Switch
              value={repeatTasks}
              onValueChange={handleRepeatToggle}
              trackColor={{ false: "#333", true: colors.orange }}
              thumbColor={repeatTasks ? colors.orangeSoft : "#777"}
            />
          </View>

          <View style={styles.taskInputCard}>
            <Text style={styles.sectionTitle}>Add Mission</Text>

            <View style={styles.taskInputRow}>
              <TextInput
                style={styles.taskInput}
                placeholder="Example: 30 min workout"
                placeholderTextColor={colors.dim}
                value={newTask}
                onChangeText={setNewTask}
                returnKeyType="done"
                onSubmitEditing={handleAddTask}
              />

              <Pressable style={styles.taskAddButton} onPress={handleAddTask}>
                <Ionicons name="add" size={26} color="#111" />
              </Pressable>
            </View>
          </View>

          <View style={styles.mealsHeader}>
            <Text style={styles.sectionTitle}>Missions</Text>

            <Pressable onPress={() => setEditMode(!editMode)}>
              <Text style={styles.editText}>{editMode ? "Done" : "Edit"}</Text>
            </Pressable>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.emptyMissionCard}>
              <Text style={styles.tasksEmoji}>🎯</Text>
              <Text style={styles.tasksTitle}>No missions yet</Text>
              <Text style={styles.tasksText}>
                Add your first mission above. Use repeat tasks to make it daily.
              </Text>
            </View>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <Pressable
                  style={[
                    styles.taskCheckbox,
                    task.done && styles.taskCheckboxDone,
                  ]}
                  onPress={() => handleToggleTask(task.id)}
                >
                  {task.done && (
                    <Ionicons name="checkmark" size={18} color="#111" />
                  )}
                </Pressable>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.taskTitle, task.done && styles.taskTitleDone]}
                  >
                    {task.title}
                  </Text>
                  <Text style={styles.taskMeta}>
                    {task.repeated ? "Repeats daily" : "One-day mission"}
                  </Text>
                </View>

                {editMode && (
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTask(task.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#111" />
                  </Pressable>
                )}
              </View>
            ))
          )}

          <View style={styles.historyBlock}>
            <Text style={styles.sectionTitle}>History</Text>

            {history.map((day) => {
              const label = new Date(day.date + "T12:00:00").toLocaleDateString(
                "en-US",
                {
                  weekday: "short",
                  day: "numeric",
                }
              );

              return (
                <View key={day.date} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{label}</Text>

                  <Text style={styles.historyStats}>
                    {day.done}/{day.total}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      <Modal visible={calendarOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => changeMonth("prev")}
                style={styles.monthButton}
              >
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </Pressable>

              <Text style={styles.monthTitle}>{monthTitle}</Text>

              <Pressable
                onPress={() => changeMonth("next")}
                style={styles.monthButton}
              >
                <Ionicons name="chevron-forward" size={22} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.weekLabels}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <Text key={index} style={styles.monthWeekLabel}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.monthGrid}>
              {monthDays.map((item, index) => {
                if (!item) {
                  return <View key={index} style={styles.monthDayEmpty} />;
                }

                const active = item.key === selectedDate;
                const today = item.key === getTodayKey();

                return (
                  <Pressable
                    key={item.key}
                    onPress={() => selectCalendarDate(item.key)}
                    style={[
                      styles.monthDay,
                      active && styles.monthDayActive,
                      today && !active && styles.monthDayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthDayText,
                        active && styles.monthDayTextActive,
                      ]}
                    >
                      {item.day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={styles.closeButton}
              onPress={() => setCalendarOpen(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 38,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    marginTop: 2,
  },
  calendarButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchContainer: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 4,
    marginBottom: 18,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 18,
    alignItems: "center",
  },
  switchActive: {
    backgroundColor: colors.orange,
  },
  switchText: {
    color: colors.muted,
    fontWeight: "900",
  },
  switchTextActive: {
    color: "#111",
  },
  scroll: {
    flex: 1,
  },
  weekStrip: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 18,
  },
  weekDay: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekDayActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  weekLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  weekLabelActive: {
    color: "#111",
  },
  weekNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  weekNumberActive: {
    color: "#111",
  },
  calorieCard: {
    backgroundColor: colors.card,
    borderRadius: 34,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 22,
  },
  missionHero: {
    backgroundColor: colors.card,
    borderRadius: 34,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  cardLabel: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  ringWrap: {
    alignItems: "center",
    marginTop: 18,
    marginBottom: 12,
  },
  ringNumber: {
    color: colors.text,
    fontSize: 42,
    fontWeight: "900",
  },
  ringGoal: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  leftText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 18,
  },
  macrosRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  mealsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  editText: {
    color: colors.orange,
    fontWeight: "900",
  },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mealEmoji: {
    fontSize: 28,
  },
  mealTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  mealSub: {
    color: colors.muted,
    marginTop: 3,
  },
  mealCalories: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  emptyMealBox: {
    backgroundColor: colors.cardSoft,
    borderRadius: 18,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyMealText: {
    color: colors.muted,
    fontWeight: "800",
  },
  loggedMeal: {
    backgroundColor: colors.cardSoft,
    borderRadius: 20,
    padding: 12,
    marginTop: 12,
  },
  loggedMealTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loggedTitle: {
    color: colors.text,
    fontWeight: "900",
  },
  loggedMeta: {
    color: colors.muted,
    marginTop: 5,
    fontSize: 13,
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  streakCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  streakEmoji: {
    fontSize: 34,
  },
  streakTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  streakSub: {
    color: colors.muted,
    marginTop: 3,
    fontSize: 13,
  },
  repeatCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  repeatTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  repeatSub: {
    color: colors.muted,
    marginTop: 3,
    fontSize: 13,
  },
  taskInputCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  taskInputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  taskInput: {
    flex: 1,
    backgroundColor: colors.cardSoft,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontWeight: "800",
  },
  taskAddButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMissionCard: {
    backgroundColor: colors.card,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 26,
    marginBottom: 18,
  },
  tasksEmoji: {
    fontSize: 46,
    marginBottom: 14,
  },
  tasksTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  tasksText: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  taskCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  taskCheckbox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckboxDone: {
    backgroundColor: colors.orange,
  },
  taskTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  taskTitleDone: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  taskMeta: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  historyBlock: {
    marginTop: 20,
    gap: 12,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyDate: {
    color: colors.text,
    fontWeight: "900",
  },
  historyStats: {
    color: colors.orange,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  calendarModal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  weekLabels: {
    flexDirection: "row",
    marginBottom: 8,
  },
  monthWeekLabel: {
    flex: 1,
    color: colors.muted,
    textAlign: "center",
    fontWeight: "900",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  monthDayEmpty: {
    width: `${100 / 7}%`,
    height: 46,
  },
  monthDay: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  monthDayActive: {
    backgroundColor: colors.orange,
  },
  monthDayToday: {
    borderWidth: 1,
    borderColor: colors.orange,
  },
  monthDayText: {
    color: colors.text,
    fontWeight: "900",
  },
  monthDayTextActive: {
    color: "#111",
  },
  closeButton: {
    backgroundColor: colors.cardSoft,
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 8,
  },
  closeButtonText: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
});