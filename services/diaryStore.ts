import AsyncStorage from "@react-native-async-storage/async-storage";

export type MealItem = {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  emoji: string;
};

export type DiaryMeal = {
  id: string;
  date: string;
  mealType: "Breakfast" | "Lunch" | "Snack" | "Dinner";
  originalText: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence: "low" | "medium" | "high";
  confidenceScore: number;
  notes: string;
  items: MealItem[];
  createdAt: string;
};

export type DiaryDay = {
  date: string;
  meals: DiaryMeal[];
};

const STORAGE_KEY = "missionday_diary_v1";

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getReadableDate(dateKey: string) {
  const date = new Date(dateKey + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function getMealEmoji(mealType: DiaryMeal["mealType"]) {
  if (mealType === "Breakfast") return "☀️";
  if (mealType === "Lunch") return "🥗";
  if (mealType === "Snack") return "🍎";
  return "🌙";
}

export function getTotals(meals: DiaryMeal[]) {
  return meals.reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
      carbs: sum.carbs + meal.carbs,
      fat: sum.fat + meal.fat,
      fiber: sum.fiber + meal.fiber,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    }
  );
}

async function readDiary(): Promise<DiaryDay[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeDiary(days: DiaryDay[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(days));
}

export async function getDiaryDays() {
  return await readDiary();
}

export async function getMealsForDate(dateKey: string) {
  const days = await readDiary();
  return days.find((day) => day.date === dateKey)?.meals || [];
}

export async function addMealToDate(dateKey: string, meal: DiaryMeal) {
  const days = await readDiary();
  const existingDay = days.find((day) => day.date === dateKey);

  if (existingDay) {
    existingDay.meals.push(meal);
  } else {
    days.unshift({
      date: dateKey,
      meals: [meal],
    });
  }

  days.sort((a, b) => b.date.localeCompare(a.date));

  await writeDiary(days);
}

export async function deleteMeal(dateKey: string, mealId: string) {
  const days = await readDiary();
  const day = days.find((item) => item.date === dateKey);

  if (!day) return;

  day.meals = day.meals.filter((meal) => meal.id !== mealId);

  await writeDiary(days.filter((item) => item.meals.length > 0));
}

export async function clearDiary() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}