import { colors } from "@/constants/theme";
import { estimateNutritionFromText } from "@/services/aiNutrition";
import {
    addMealToDate,
    DiaryMeal,
    getMealEmoji,
    getTodayKey,
} from "@/services/diaryStore";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const mealTypes: DiaryMeal["mealType"][] = [
  "Breakfast",
  "Lunch",
  "Snack",
  "Dinner",
];

function getConfidenceColor(confidence: "low" | "medium" | "high") {
  if (confidence === "high") return colors.green;
  if (confidence === "medium") return colors.orange;
  return colors.red;
}

export default function AddMealScreen() {
  const router = useRouter();

  const [mealType, setMealType] = useState<DiaryMeal["mealType"]>("Breakfast");
  const [mealText, setMealText] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [error, setError] = useState("");

  const analyzeMeal = async () => {
    if (!mealText.trim()) return;

    setLoading(true);
    setError("");
    setEstimate(null);

    try {
      const result = await estimateNutritionFromText(mealText.trim());
      setEstimate(result);
    } catch (err) {
      console.log("Analyze meal error:", err);
      setError("Couldn’t analyze this meal. Try again or simplify the wording.");
    }

    setLoading(false);
  };

  const addToToday = async () => {
    if (!estimate) return;

    const meal: DiaryMeal = {
      id: String(Date.now()),
      date: getTodayKey(),
      mealType,
      originalText: mealText.trim(),
      calories: estimate.calories,
      protein: estimate.protein,
      carbs: estimate.carbs,
      fat: estimate.fat,
      fiber: estimate.fiber,
      confidence: estimate.confidence,
      confidenceScore: estimate.confidenceScore,
      notes: estimate.notes,
      items: estimate.items,
      createdAt: new Date().toISOString(),
    };

    await addMealToDate(getTodayKey(), meal);
    router.back();
  };

  const confidenceColor = estimate
    ? getConfidenceColor(estimate.confidence)
    : colors.muted;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Meal",
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text, fontWeight: "900" },
          headerTintColor: colors.orange,
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Describe your meal</Text>
        <Text style={styles.subtitle}>
          Type what you ate and AI will estimate nutrition.
        </Text>

        <View style={styles.mealTypeRow}>
          {mealTypes.map((type) => {
            const active = mealType === type;

            return (
              <Pressable
                key={type}
                onPress={() => setMealType(type)}
                style={[styles.mealTypePill, active && styles.mealTypeActive]}
              >
                <Text style={styles.mealTypeEmoji}>{getMealEmoji(type)}</Text>
                <Text style={[styles.mealTypeText, active && styles.mealTypeTextActive]}>
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Example: 3 eggs, 1 banana and black coffee"
            placeholderTextColor={colors.dim}
            value={mealText}
            onChangeText={setMealText}
            multiline
          />

          <Pressable style={styles.orangeButton} onPress={analyzeMeal}>
            <Text style={styles.orangeButtonText}>Analyze Meal ✨</Text>
          </Pressable>

          {loading && <ActivityIndicator color={colors.orange} style={{ marginTop: 18 }} />}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.examplesCard}>
          <Text style={styles.examplesTitle}>Try examples</Text>
          <Text style={styles.exampleText}>🍝 1 plate spaghetti bolognese</Text>
          <Text style={styles.exampleText}>🥚 3 eggs, banana, black coffee</Text>
          <Text style={styles.exampleText}>🥗 chicken salad with ranch</Text>
        </View>

        {estimate && (
          <View style={[styles.resultCard, { borderColor: confidenceColor }]}>
            <View style={styles.completeRow}>
              <View style={styles.completeLeft}>
                <Text style={styles.completeIcon}>✅</Text>
                <View>
                  <Text style={styles.complete}>Analysis Complete</Text>
                  <Text style={[styles.confidenceSub, { color: confidenceColor }]}>
                    {estimate.confidence.toUpperCase()} CONFIDENCE
                  </Text>
                </View>
              </View>

              <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}>
                <Text style={styles.confidenceBadgeText}>
                  {estimate.confidenceScore}%
                </Text>
              </View>
            </View>

            <Text style={styles.kcal}>{Math.round(estimate.calories)}</Text>
            <Text style={styles.kcalLabel}>calories</Text>

            <View style={styles.nutritionGrid}>
              <Macro label="Protein" value={`${estimate.protein.toFixed(1)}g`} color={colors.green} />
              <Macro label="Carbs" value={`${estimate.carbs.toFixed(1)}g`} color={colors.blue} />
              <Macro label="Fat" value={`${estimate.fat.toFixed(1)}g`} color={colors.yellow} />
              <Macro label="Fiber" value={`${estimate.fiber.toFixed(1)}g`} color={colors.orange} />
            </View>

            <Text style={styles.notes}>{estimate.notes}</Text>

            <Text style={styles.itemsTitle}>Items detected</Text>

            {estimate.items.map((item: any, index: number) => (
              <View key={index} style={styles.itemCard}>
                <Text style={styles.itemEmoji}>{item.emoji || "🍽️"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} • {Math.round(item.calories)} kcal
                  </Text>
                  <Text style={styles.itemMeta}>
                    P {item.protein}g • C {item.carbs}g • F {item.fat}g • Fiber{" "}
                    {item.fiber}g
                  </Text>
                </View>
              </View>
            ))}

            <Pressable style={styles.orangeButton} onPress={addToToday}>
              <Text style={styles.orangeButtonText}>Add to Today</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </>
  );
}

function Macro({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.macroBox}>
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
    marginTop: 18,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 8,
    marginBottom: 20,
  },
  mealTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  mealTypePill: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealTypeActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  mealTypeEmoji: {
    fontSize: 17,
  },
  mealTypeText: {
    color: colors.muted,
    fontWeight: "800",
  },
  mealTypeTextActive: {
    color: "#111",
  },
  inputCard: {
    backgroundColor: colors.card,
    borderRadius: 32,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  input: {
    minHeight: 150,
    backgroundColor: colors.cardSoft,
    borderRadius: 26,
    padding: 18,
    color: colors.text,
    fontSize: 17,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  orangeButton: {
    backgroundColor: colors.orange,
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
  },
  orangeButtonText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 16,
  },
  error: {
    color: colors.red,
    marginTop: 12,
  },
  examplesCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  examplesTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 10,
  },
  exampleText: {
    color: colors.muted,
    marginBottom: 8,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 32,
    padding: 18,
    borderWidth: 1,
    marginBottom: 40,
  },
  completeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  completeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  completeIcon: {
    fontSize: 26,
  },
  complete: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 18,
  },
  confidenceSub: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  confidenceBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  confidenceBadgeText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 15,
  },
  kcal: {
    color: colors.text,
    fontSize: 58,
    fontWeight: "900",
    marginTop: 12,
  },
  kcalLabel: {
    color: colors.muted,
    marginBottom: 14,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  macroBox: {
    width: "47%",
    backgroundColor: colors.cardSoft,
    borderRadius: 20,
    padding: 14,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  macroLabel: {
    color: colors.muted,
    marginTop: 4,
  },
  notes: {
    color: colors.muted,
    marginBottom: 16,
  },
  itemsTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: colors.cardSoft,
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  itemEmoji: {
    fontSize: 26,
  },
  itemName: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
  itemMeta: {
    color: colors.muted,
    marginTop: 3,
    fontSize: 13,
  },
});