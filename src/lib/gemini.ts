import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface TourPackage {
  id: string;
  destination: {
    city: string;
    country: string;
    description: string;
    weather: string;
  };
  flights: {
    origin: string;
    airline: string;
    price: number;
    duration: string;
  };
  accommodation: {
    name: string;
    stars: number;
    pricePerNight: number;
    amenities: string[];
  };
  transfers: {
    type: string;
    price: number;
  };
  analytics: {
    profitabilityScore: number; // 0-100
    priceIncreaseProbability: number; // 0-100
    demandTrend: "Rising" | "Stable" | "Decreasing";
    seasonality: string;
    analysisSummary: string;
  };
  totalPrice: number;
  category: string; // Budget, Exclusive, Exotic
}

const tourPackageSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    destination: {
      type: Type.OBJECT,
      properties: {
        city: { type: Type.STRING },
        country: { type: Type.STRING },
        description: { type: Type.STRING, description: "A highly enticing, atmospheric short description." },
        weather: { type: Type.STRING }
      },
      required: ["city", "country", "description", "weather"]
    },
    flights: {
      type: Type.OBJECT,
      properties: {
        origin: { type: Type.STRING },
        airline: { type: Type.STRING, description: "Fictional or real realistic airline" },
        price: { type: Type.NUMBER },
        duration: { type: Type.STRING }
      },
      required: ["origin", "airline", "price", "duration"]
    },
    accommodation: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        stars: { type: Type.NUMBER },
        pricePerNight: { type: Type.NUMBER },
        amenities: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["name", "stars", "pricePerNight", "amenities"]
    },
    transfers: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "e.g., Private Car, Shuttle" },
        price: { type: Type.NUMBER }
      },
      required: ["type", "price"]
    },
    analytics: {
      type: Type.OBJECT,
      properties: {
        profitabilityScore: { type: Type.NUMBER, description: "0-100 score indicating profitability / value for money" },
        priceIncreaseProbability: { type: Type.NUMBER, description: "0-100 probability that the price will increase soon" },
        demandTrend: { type: Type.STRING, description: "Rising, Stable, or Decreasing" },
        seasonality: { type: Type.STRING, description: "Detailed look at why this season is good or bad." },
        analysisSummary: { type: Type.STRING, description: "Expert AI summary of why this package is a good or bad investment." }
      },
      required: ["profitabilityScore", "priceIncreaseProbability", "demandTrend", "seasonality", "analysisSummary"]
    },
    totalPrice: { type: Type.NUMBER },
    category: { type: Type.STRING, description: "Budget, Exclusive, or Exotic" }
  },
  required: ["id", "destination", "flights", "accommodation", "transfers", "analytics", "totalPrice", "category"]
};

export async function generateDailySelections(originCities: string[]): Promise<TourPackage[]> {
  const prompt = `Generate 3 distinct, highly detailed travel packages from these European cities: ${originCities.join(", ")}. 
  The destinations must be popular warm places suitable for the current season.
  Categorize them into 'Budget', 'Exclusive', and 'Exotic'.
  Include rigorous analytical data predicting price fluctuations and profitability.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: tourPackageSchema
      }
    }
  });

  return JSON.parse(response.text.trim());
}

export async function generateCustomTour(
  origin: string,
  destination: string,
  dates: string,
  preferences: string
): Promise<TourPackage> {
  const prompt = `Create a custom detailed travel package.
  Origin: ${origin}
  Destination: ${destination}
  Dates: ${dates}
  Preferences: ${preferences}
  
  Compile flights, transfers, accommodation, and deep analytics on whether this is a profitable time to book (price increase probability, demand).`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro", // Use Pro for custom logic and advanced reasoning
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: tourPackageSchema
    }
  });

  return JSON.parse(response.text.trim());
}
