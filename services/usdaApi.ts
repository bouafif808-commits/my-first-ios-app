const API_KEY = "7qRhu10Pb2j9niLk2kOZQTreg5ZitKKoDK9SX2Sp";
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

export type FoodSearchResult = {
  fdcId: number;
  description: string;
  dataType?: string;
  brandName?: string;
};

export type MacroResult = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodDetailsResult = {
  macrosPer100g: MacroResult;
  servingGrams: number;
  servingLabel: string;
};

// 🚫 junk filter words
const blockedWords = [
  "bread","cake","muffin","pie","cookie","chips","babyfood",
  "fried","salted","dried","baked","candy","cereal","sauce",
  "boilers","fryers","skin","with skin",
];

function cleanText(text: string) {
  return text.toLowerCase().replace(/,/g, "").trim();
}

// 🍌 smart serving estimates
function estimateServingGrams(description: string) {
  const desc = cleanText(description);

  if (desc.includes("banana")) return 118;
  if (desc.includes("egg")) return 50;
  if (desc.includes("apple")) return 182;
  if (desc.includes("orange")) return 131;
  if (desc.includes("chicken breast")) return 120;

  return 100;
}

// 🔍 strict filtering
function isRelevantFood(food: FoodSearchResult, query: string) {
  const desc = cleanText(food.description);
  const q = cleanText(query);
  const words = q.split(" ").filter(Boolean);

  const containsQuery = words.every((word) => desc.includes(word));
  if (!containsQuery) return false;

  const blocked = blockedWords.some(
    (word) => desc.includes(word) && !q.includes(word)
  );
  if (blocked) return false;

  // 🍗 chicken cleanup
  if (q.includes("chicken breast")) {
    if (!desc.includes("chicken") || !desc.includes("breast")) return false;
    if (desc.includes("skin")) return false;
    if (desc.includes("broiler") || desc.includes("fryer")) return false;
  }

  // 🥚 egg cleanup
  if (q === "egg" || q === "eggs") {
    if (!desc.includes("egg")) return false;
    if (desc.includes("substitute") || desc.includes("powder")) return false;
  }

  // 🍌 banana cleanup
  if (q === "banana" || q === "bananas") {
    if (!desc.includes("banana")) return false;
    if (!desc.includes("raw") && desc !== "banana") return false;
  }

  return true;
}

// 🧠 scoring system (THIS is what makes it feel like a real app)
function sortBestMatches(a: FoodSearchResult, b: FoodSearchResult, query: string) {
  const q = cleanText(query);
  const ad = cleanText(a.description);
  const bd = cleanText(b.description);

  const score = (desc: string, food: FoodSearchResult) => {
    let s = 0;

    // exact matches
    if (desc === q) s += 200;
    if (desc === `${q} raw`) s += 180;
    if (desc.includes(`${q} raw`)) s += 150;

    // chicken logic
    if (q.includes("chicken breast")) {
      if (desc.includes("chicken breast")) s += 160;
      if (desc.includes("boneless")) s += 60;
      if (desc.includes("skinless")) s += 80;
      if (desc.includes("raw")) s += 50;
      if (desc.includes("meat only")) s += 80;
      if (desc.includes("skin")) s -= 200;
      if (desc.includes("broiler") || desc.includes("fryer")) s -= 200;
    }

    // egg logic
    if (q === "egg" || q === "eggs") {
      if (desc.includes("egg whole")) s += 120;
      if (desc.includes("large")) s += 60;
      if (desc.includes("raw")) s += 40;
      if (desc.includes("white") || desc.includes("yolk")) s -= 30;
    }

    // banana logic
    if (q === "banana" || q === "bananas") {
      if (desc === "banana raw") s += 200;
      if (desc.includes("banana raw")) s += 160;
      if (desc.includes("raw")) s += 80;
    }

    // general boosts
    if (desc.includes("raw")) s += 35;
    if (desc.includes("whole")) s += 25;

    // data quality
    if (food.dataType === "Foundation") s += 40;
    if (food.dataType === "SR Legacy") s += 30;
    if (food.dataType === "Survey (FNDDS)") s += 5;

    // penalties
    if (food.brandName) s -= 40;
    if (desc.length > 60) s -= 20;
    if (desc.length > 90) s -= 40;

    return s;
  };

  return score(bd, b) - score(ad, a);
}

// 🔎 SEARCH
export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(`${BASE_URL}/foods/search?api_key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        pageSize: 30,
        dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
      }),
    });

    const data = await response.json();
    const foods: FoodSearchResult[] = data.foods || [];

    return foods
      .filter((f) => isRelevantFood(f, query))
      .sort((a, b) => sortBestMatches(a, b, query))
      .slice(0, 3); // 🔥 clean UI
  } catch (err) {
    console.log("Search error:", err);
    return [];
  }
}

// 🧬 nutrition extractor (FIXES 0g bug)
function extractAmount(n: any) {
  return Number(n?.amount ?? n?.value ?? 0);
}

function getName(n: any) {
  return String(n?.nutrient?.name ?? "").toLowerCase();
}

function getNumber(n: any) {
  return String(n?.nutrient?.number ?? "");
}

function getUnit(n: any) {
  return String(n?.nutrient?.unitName ?? "").toLowerCase();
}

// 📊 GET DETAILS
export async function getFoodDetails(fdcId: number): Promise<FoodDetailsResult> {
  try {
    const res = await fetch(`${BASE_URL}/food/${fdcId}?api_key=${API_KEY}`);
    const data = await res.json();

    const nutrients = data.foodNutrients || [];

    const find = (num: string, keyword: string) => {
      return (
        extractAmount(nutrients.find((n: any) => getNumber(n) === num)) ||
        extractAmount(nutrients.find((n: any) => getName(n).includes(keyword)))
      );
    };

    const protein = find("1003", "protein");
    const carbs = find("1005", "carbohydrate");
    const fat = find("1004", "fat");

    let calories = extractAmount(
      nutrients.find((n: any) =>
        getName(n).includes("energy") && getUnit(n).includes("kcal")
      )
    );

    if (!calories && protein + carbs + fat > 0) {
      calories = protein * 4 + carbs * 4 + fat * 9;
    }

    const servingGrams =
      data.foodPortions?.find((p: any) => p.gramWeight)?.gramWeight ||
      estimateServingGrams(data.description || "");

    return {
      macrosPer100g: {
        calories: Math.round(calories),
        protein,
        carbs,
        fat,
      },
      servingGrams,
      servingLabel: `1 item ≈ ${Math.round(servingGrams)}g`,
    };
  } catch (err) {
    console.log("Details error:", err);

    return {
      macrosPer100g: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      servingGrams: 100,
      servingLabel: "1 item ≈ 100g",
    };
  }
}

// 🔢 calculations
export function calculateByItems(
  macros: MacroResult,
  qty: number,
  grams: number
) {
  const total = (qty * grams) / 100;

  return {
    calories: Math.round(macros.calories * total),
    protein: +(macros.protein * total).toFixed(1),
    carbs: +(macros.carbs * total).toFixed(1),
    fat: +(macros.fat * total).toFixed(1),
  };
}