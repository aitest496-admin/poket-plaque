import { GoogleGenAI } from "@google/genai";
import { ToothData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeDentalChart = async (teeth: ToothData[]): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    
    // Filter to only teeth that have some data
    const activeTeeth = teeth.filter(t => 
        t.mobility > 0 || 
        Object.values(t.plaque).some(Boolean) ||
        t.bleeding.buccal.some(Boolean) || t.bleeding.lingual.some(Boolean) ||
        t.pus.buccal.some(Boolean) || t.pus.lingual.some(Boolean) ||
        t.pocketDepth.buccal.some(d => d !== null && d > 3) ||
        t.pocketDepth.lingual.some(d => d !== null && d > 3)
    );

    if (activeTeeth.length === 0) {
        return "No significant findings recorded in the chart.";
    }

    const prompt = `
    You are an expert Periodontist. Analyze the following raw JSON data representing a patient's 6-point periodontal chart.
    
    Data Structure Legend:
    - id: Tooth number (1-8)
    - mobility: 0-3 scale
    - plaque: boolean for 5 surfaces
    - bleeding (BOP): { buccal: [D,C,M], lingual: [D,C,M] }
    - pus: { buccal: [D,C,M], lingual: [D,C,M] }
    - pocketDepth: { buccal: [D,C,M], lingual: [D,C,M] } (Values in mm)

    Patient Data (Active findings only):
    ${JSON.stringify(activeTeeth, null, 2)}

    Task:
    Provide a concise clinical summary suitable for medical notes. 
    1. Summarize extent of disease (General vs Localized).
    2. Note deepest pockets specifying site (e.g., Tooth #3 DL 8mm).
    3. Note teeth with bleeding/pus.
    4. Categorize Periodontitis severity.
    5. Recommend next steps.

    Format: Use Markdown. Be professional, concise, and standard dental terminology.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Unable to generate analysis.";

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "Error connecting to AI service. Please check your API configuration.";
  }
};