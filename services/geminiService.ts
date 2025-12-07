import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLeadsByLocation = async (location: string): Promise<Omit<Lead, 'id' | 'isSelected'>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 3 fictional but realistic business leads located in ${location}. 
      Ensure the phone numbers are formatted for the region. 
      The category must be one of: 'Transporte', 'Software', 'Consultoría', 'Industrial', or 'Otros'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              address: { type: Type.STRING },
              phone: { type: Type.STRING },
              website: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['Transporte', 'Software', 'Consultoría', 'Industrial', 'Otros'] }
            },
            required: ["name", "address", "phone", "website", "category"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    return data;
  } catch (error) {
    console.error("Error generating leads:", error);
    return [];
  }
};
