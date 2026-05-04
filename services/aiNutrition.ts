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

const OPENAI_API_KEY = "";

export async function estimateNutritionFromText(
  input: string
): Promise<AiNutritionResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            "You are a nutrition estimator for a mobile fitness app. Estimate calories, protein, carbs, fat, and fiber from natural language meals. Use realistic average portions when unclear. Include emojis for detected food items. Return ONLY valid JSON.",
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
- Use high confidence for clear simple foods and quantities.
- Use medium/low confidence for vague portions like 'plate' or complex meals.
- All macro numbers must be numeric grams, not strings.
- calories must be numeric kcal.
`,
        },
      ],
    }),
  });

  const data = await response.json();

  console.log("OPENAI RESPONSE:", JSON.stringify(data, null, 2));

  if (!response.ok || !data.choices?.[0]?.message?.content) {
    throw new Error(data.error?.message || "OpenAI API failed");
  }

  return JSON.parse(data.choices[0].message.content);
}