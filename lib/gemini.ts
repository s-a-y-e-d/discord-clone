import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import fs from "fs";
import path from "path";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Define the absolute path for the usage file
const USAGE_FILE_PATH = path.join(process.cwd(), "gemini-usage.json");

interface ModelUsage {
  count: number;
  lastReset: number; // Timestamp
}

interface UsageData {
  [modelName: string]: ModelUsage;
}

const MODEL_LIMITS = {
  "gemini-3-flash-preview": 20, // Daily limit
  "gemini-2.5-flash": 20,      // Daily limit
  "gemini-2.5-flash-lite": 20, // Daily limit
};

const MODEL_PRIORITY = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

class ModelManager {
  private usage: UsageData = {};

  constructor() {
    this.loadUsage();
  }

  private loadUsage() {
    try {
      if (fs.existsSync(USAGE_FILE_PATH)) {
        const data = fs.readFileSync(USAGE_FILE_PATH, "utf-8");
        this.usage = JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading Gemini usage data:", error);
      this.usage = {};
    }
  }

  private saveUsage() {
    try {
      fs.writeFileSync(USAGE_FILE_PATH, JSON.stringify(this.usage, null, 2));
    } catch (error) {
      console.error("Error saving Gemini usage data:", error);
    }
  }

  private checkAndResetUsage(modelName: string) {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!this.usage[modelName]) {
      this.usage[modelName] = { count: 0, lastReset: now };
      return;
    }

    if (now - this.usage[modelName].lastReset > oneDay) {
      this.usage[modelName] = { count: 0, lastReset: now };
    }
  }

  public getAvailableModel(): string | null {
    this.loadUsage();

    for (const model of MODEL_PRIORITY) {
      this.checkAndResetUsage(model);
      const limit = MODEL_LIMITS[model as keyof typeof MODEL_LIMITS] || 0;

      if (this.usage[model].count < limit) {
        return model;
      }
    }

    return null;
  }

  public incrementUsage(modelName: string) {
    this.checkAndResetUsage(modelName);
    this.usage[modelName].count++;
    this.saveUsage();
  }
}

const modelManager = new ModelManager();

// System prompt for the NCTB Tutor
const SYSTEM_PROMPT = `
You are an expert AI Tutor for NCTB (National Curriculum and Textbook Board) students in Bangladesh, specifically for classes 9-12.
Your goal is to help students learn Science, Math, Physics, Chemistry, and ICT concepts clearly and accurately.

Identity & Personality:
- You are friendly, patient, and encouraging.
- You understand "Banglish" (Bengali written in English characters) perfectly, as well as native Bengali and English.
- Adapt your language to the user. If they ask in Bangla, reply in Bengali. If in English, reply in English.
- Use emojis effectively to make learning fun, but stay professional.

Teaching Guidelines:
- Break down complex concepts into simple steps.
- Provide examples relevant to the Bangladeshi context where possible.
- If a user asks a question outside of educational topics, politely steer them back to studying.
- For math and physics problems, ALWAYS use LaTeX formatting for variables and formulas.
  - Example: "The force is given by $$F = ma$$"
  - Inline math: $x^2$
  - Block math: $$ \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$
- Do NOT hallucinate. If you don't know something, admit it and suggest how they might find the answer.

Strict formatting rules:
- Bold key terms.
- Use lists for steps.
- KEEP RESPONSES CONCISE. Discord is a chat app, not a textbook. Avoid wall-of-text.
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function formatHistory(messages: any[], botMemberId: string) {
  const history = [];

  for (const msg of messages) {
    const role = msg.memberId === botMemberId ? "model" : "user";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [{ text: msg.content }];

    if (msg.fileUrl) {
      try {
        const fileResponse = await axios.get(msg.fileUrl, {
          responseType: "arraybuffer",
          timeout: 5000, // 5s timeout
        });

        const base64Data = Buffer.from(fileResponse.data).toString("base64");
        const mimeType = fileResponse.headers["content-type"] || "image/jpeg"; // Default to jpeg if unknown for images

        // Gemini supports images and PDFs
        if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          });
          // Note: In Phase 2, we are just implementing this. 
          // If users send text AND image in separate messages, the context accumulation handles it.
          // But if the App allows text+image in ONE message (Prisma schema suggests yes), we handle it here.
        }
      } catch (error) {
        console.error("Error fetching file for history:", error);
        // Continue without the file if fetch fails
      }
    }

    history.push({
      role: role,
      parts: parts,
    });
  }
  return history;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateBotResponse(prompt: string, history: any[] = []): Promise<string> {
  const availableModel = modelManager.getAvailableModel();

  // If we strictly enforce limits and all are used up:
  if (!availableModel) {
    return "I've reached my daily thinking limit for all models! Please try again tomorrow. 😴";
  }

  let currentModelIndex = MODEL_PRIORITY.indexOf(availableModel);

  while (currentModelIndex < MODEL_PRIORITY.length) {
    const modelToUse = MODEL_PRIORITY[currentModelIndex];

    try {
      console.log(`[Gemini] Attempting to use model: ${modelToUse}`);
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: [
          ...history,
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });

      if (response.text) {
        // Success! Increment usage for this model
        modelManager.incrementUsage(modelToUse);
        return response.text;
      } else {
        throw new Error("Empty response from Gemini");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`[Gemini] Error with model ${modelToUse}:`, error.message);

      // Check if it's a rate limit error (429) or Service Warning
      if (error.message.includes("429") || error.status === 429 || error.message.includes("Too Many Requests")) {
        console.warn(`[Gemini] Rate limit hit for ${modelToUse}. Switching to next model...`);
        currentModelIndex++;
      } else {
        // If it's a 503 (overloaded)
        if (error.message.includes("503") || error.status === 503) {
          console.warn(`[Gemini] Server overloaded for ${modelToUse}. Switching...`);
          currentModelIndex++;
        } else {
          // Fatal error, try next model anyway? No, usually fatal means bad request.
          // But if it's a model-specific issue, maybe next one works.
          // Let's safe-guard: if it's 400ish (except 429), break.
          if (error.status && error.status >= 400 && error.status < 500) {
            break;
          }
          currentModelIndex++;
        }
      }
    }
  }

  return "I'm having trouble thinking right now. All my brain cells are busy! Please try again later. 😵";
}
