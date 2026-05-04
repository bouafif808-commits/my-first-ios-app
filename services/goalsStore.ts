import AsyncStorage from "@react-native-async-storage/async-storage";

export type NutritionGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

const GOALS_KEY = "missionday_goals_v1";

export const defaultGoals: NutritionGoals = {
  calories: 1800,
  protein: 130,
  carbs: 170,
  fat: 55,
  fiber: 25,
};

export async function getGoals(): Promise<NutritionGoals> {
  const raw = await AsyncStorage.getItem(GOALS_KEY);

  if (!raw) return defaultGoals;

  try {
    return {
      ...defaultGoals,
      ...JSON.parse(raw),
    };
  } catch {
    return defaultGoals;
  }
}

export async function saveGoals(goals: NutritionGoals) {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}