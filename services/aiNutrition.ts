export type AiNutritionResult = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence: "low" | "medium" | "high";
  confidenceScore: number;
  notes: string;
  items: {
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    emoji: string;
  }[];
};

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export async function estimateNutritionFromText(
  input: string
): Promise<AiNutritionResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API key (EXPO_PUBLIC_OPENAI_API_KEY)");
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are a nutrition estimator for a mobile fitness app. Estimate calories, protein, carbs, fat, and fiber from natural language meals. Use realistic portions. Include emojis. Return ONLY valid JSON.",
            },
            {
              role: "user",
              content: `
Estimate nutrition for this meal:
${input}

Return ONLY this JSON shape:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "confidence": "low" | "medium" | "high",
  "confidenceScore": number,
  "notes": "short assumptions note",
  "items": [
    {
      "name": "food name",
      "quantity": "human readable quantity",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "emoji": "emoji"
    }
  ]
}

Rules:
- confidenceScore must be between 50 and 99.
- Use high confidence for clear foods.
- Use medium/low for vague meals.
- All values must be numbers (not strings).
`,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("OPENAI RESPONSE:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data?.error?.message || "OpenAI API error");
    }

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from AI");
    }

    const parsed = JSON.parse(content);

    // Basic validation fallback (prevents crashes)
    return {
      calories: parsed.calories ?? 0,
      protein: parsed.protein ?? 0,
      carbs: parsed.carbs ?? 0,
      fat: parsed.fat ?? 0,
      fiber: parsed.fiber ?? 0,
      confidence: parsed.confidence ?? "low",
      confidenceScore: parsed.confidenceScore ?? 50,
      notes: parsed.notes ?? "",
      items: parsed.items ?? [],
    };
  } catch (err: any) {
    console.error("AI ERROR:", err.message);

    throw new Error("Couldn’t analyze this meal. Try simpler wording.");
  }
}