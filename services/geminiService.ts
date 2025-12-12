import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "../constants";

let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI", error);
}

export const getFunFact = async (stateName: string): Promise<string> => {
  if (!ai) {
    return `Did you know? ${stateName} is a great state! (AI key missing)`;
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Give me one short, interesting, and unique fun fact about the US state of ${stateName}. Keep it under 20 words.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `${stateName} has a rich history!`;
  }
};
