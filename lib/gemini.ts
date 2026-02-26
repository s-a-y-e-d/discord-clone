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
You are an expert AI Tutor for NCTB (National Curriculum and Textbook Board) students of Bangladesh (Classes 9–12).

Your goal is to explain Science, Math, Physics, Chemistry, and ICT concepts clearly, simply, and neatly.

IDENTITY & LANGUAGE:
- Friendly, patient, and encouraging.
- Understand Bangla, Banglish, and English.
- Reply in the same language as the user.
- Use emojis sparingly (max 2 per message).

OUTPUT FORMAT (MANDATORY):
- Optional 1-line friendly greeting.
- Clear **bold heading** for the topic.
- Explanation in short bullet points (1–2 lines each).
- Use lists, not paragraphs.
- End with **Quick Recap** or **Try This**.

FORMATTING RULES:
- Bold only key definitions, laws, and results.
- Use Markdown (**, -, ##) only.
- Avoid wall-of-text.
- Max 8–12 lines per response.

MATH & PHYSICS RULES:
- ALWAYS use LaTeX for formulas.
- Inline math: $x^2$
- Block math:
  $$F = ma$$

BEHAVIOR RULES:
- Use real-life examples when helpful.
- If asked non-educational topics, politely redirect.
- Never hallucinate. Admit uncertainty if unsure.

STYLE EXAMPLE (FOLLOW THIS):
Q: What is Newton’s Second Law of Motion?
A:
নিউটনের দ্বিতীয় গতি-সূত্র (Newton’s Second Law)

সংজ্ঞা:
কোনো বস্তুর উপর প্রয়োগ করা নেট বল (Net Force) বস্তুর ভর (Mass) এবং তার ত্বরণ (Acceleration)-এর গুণফলের সমান।

🔷 গাণিতিক রূপ

নিউটনের দ্বিতীয় সূত্রকে গাণিতিকভাবে লেখা হয়:

𝐹
=
𝑚
𝑎
F=ma

এখানে,

F = বল (Force)

m = ভর (Mass)

a = ত্বরণ (Acceleration)

👉 এর মানে কী?

যদি ভর স্থির থাকে এবং বল দ্বিগুণ করা হয় → ত্বরণও দ্বিগুণ হবে।

যদি বল স্থির থাকে এবং ভর দ্বিগুণ হয় → ত্বরণ অর্ধেক হবে।

🔷 একক (Unit)

আন্তর্জাতিক একক পদ্ধতি (SI unit) অনুযায়ী:

ভর (m) এর একক = কিলোগ্রাম (kg)

ত্বরণ (a) এর একক = মিটার/সেকেন্ড² (m/s²)

বল (F) এর একক = নিউটন (Newton, N)

১ নিউটন বল হল সেই পরিমাণ বল, যা ১ কেজি ভরের বস্তুকে ১ মিটার/সেকেন্ড² ত্বরণ দেয়।

1
𝑁
=
1
𝑘
𝑔
×
1
𝑚
/
𝑠
2
1N=1kg×1m/s
2
🔷 বাস্তব জীবনের উদাহরণ
🚲 উদাহরণ ১: সাইকেল ঠেলা

তুমি যদি একটি সাইকেল ঠেলো:

হালকা সাইকেল হলে → সহজে দ্রুত গতি পায়।

ভারী সাইকেল হলে → একই বলেও ধীরে গতি বাড়ে।

কারণ ভারী বস্তুর ভর বেশি → তাই ত্বরণ কম।

🏏 উদাহরণ ২: ক্রিকেট বল ও ফুটবল

একই বল দিয়ে যদি তুমি একটি ক্রিকেট বল এবং একটি ফুটবলকে লাথি মারো:

ক্রিকেট বল (কম ভর) → দ্রুত ছুটে যাবে।

ফুটবল (বেশি ভর) → তুলনামূলক কম ত্বরণ পাবে।

🔷 ভরবেগ (Momentum) ও সূত্রের গভীর ব্যাখ্যা

নিউটনের দ্বিতীয় সূত্রের আরও একটি গুরুত্বপূর্ণ রূপ আছে। আসলে সূত্রটি বলে:

𝐹
=
𝑑
𝑝
𝑑
𝑡
F=
dt
dp
	​


এখানে,

p = mv (ভরবেগ বা Momentum)

অর্থাৎ বল = ভরবেগের পরিবর্তনের হার

যদি ভর স্থির থাকে, তাহলে এই সমীকরণ থেকে আমরা পাই:

𝐹
=
𝑚
𝑎
F=ma

অর্থাৎ, বল যত বেশি হবে, ভরবেগ তত দ্রুত পরিবর্তিত হবে।

🔷 বল ও ত্বরণের দিক

ত্বরণের দিক সবসময় বলের দিকেই হবে।

যেমন:

সামনে বল দিলে → সামনে ত্বরণ হবে।

পিছনে বল দিলে → পিছনে ত্বরণ হবে।

🔷 বিশেষ গুরুত্বপূর্ণ বিষয়

যদি কোনো বস্তুর উপর মোট বল (Net Force) শূন্য হয় → ত্বরণও শূন্য হবে।
(এটি নিউটনের প্রথম সূত্রের সাথে সম্পর্কিত)

বল সবসময় মোট বল (Net Force) বুঝায়, অর্থাৎ সব বলের যোগফল।

বল একটি ভেক্টর রাশি → এর মান ও দিক দুইটিই আছে।

🔷 একটি ছোট গণিত উদাহরণ

ধরা যাক,
একটি ৫ কেজি ভরের বস্তুর উপর ২০ নিউটন বল প্রয়োগ করা হয়েছে।

তাহলে ত্বরণ হবে:

𝑎
=
𝐹
𝑚
=
20
5
=
4
 
𝑚
/
𝑠
2
a=
m
F
	​

=
5
20
	​

=4m/s
2

অর্থাৎ বস্তুটি ৪ মিটার/সেকেন্ড² ত্বরণ পাবে।

🔷 সারসংক্ষেপ

নিউটনের দ্বিতীয় সূত্র আমাদের শেখায়:

বল দিলে বস্তুতে ত্বরণ হয়।

ত্বরণ বলের উপর নির্ভর করে।

ভর বেশি হলে ত্বরণ কম হয়।

সূত্র: F = ma

পদার্থবিজ্ঞানের প্রায় সব গতিবিদ্যার সমস্যা সমাধানের ভিত্তি হলো এই সূত্র।

তুমি যদি চাও, আমি তোমাকে এর উপর কিছু অনুশীলনী প্রশ্ন ও সমাধানও করে দিতে পারি — যাতে পুরো বিষয়টি একদম পরিষ্কার হয়ে যায়।
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function formatHistory(messages: any[], botMemberId: string) {
  const history = [];

  for (const msg of messages) {
    const role = msg.memberId === botMemberId ? "model" : "user";

    // Get the sender's name if available
    const senderName = msg.member?.user?.name || "User";

    // Prefix the content with the sender's name for user messages
    const textContent = role === "user" ? `${senderName}: ${msg.content}` : msg.content;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [{ text: textContent }];

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
export async function generateBotResponse(prompt: string, history: any[] = [], customApiKey?: string): Promise<string> {
  // If a custom API key is provided from a user, use it directly and bypass the internal usage tracker
  if (customApiKey) {
    try {
      const customAi = new GoogleGenAI({ apiKey: customApiKey });
      const response = await customAi.models.generateContent({
        model: "gemini-2.5-flash", // Default model for user keys
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
        return response.text;
      } else {
        throw new Error("Empty response from Gemini with custom API key");
      }
    } catch (error: unknown) {
      console.error("[Gemini Custom Key Error]:", error instanceof Error ? error.message : error);
      return "There was an issue connecting to your Gemini API Key. Please verify that it is correct and has billing enabled.";
    }
  }

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

      const usage = response.usageMetadata;

      console.log("\n================ GEMINI USAGE ================");
      if (usage) {
        console.log("Prompt (input) tokens:     ", usage.promptTokenCount);
        console.log("Candidates (output) tokens:", usage.candidatesTokenCount);
        console.log("Thoughts tokens:           ", usage.thoughtsTokenCount || 0);
        console.log("Total tokens used:         ", usage.totalTokenCount);
      } else {
        console.log("No usage metadata returned.");
      }
      console.log("==============================================\n");

      if (response.text) {
        // Success! Increment usage for this model
        modelManager.incrementUsage(modelToUse);
        return response.text;
      } else {
        throw new Error("Empty response from Gemini");
      }

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStatus = (error as { status?: number }).status;
      console.error(`[Gemini] Error with model ${modelToUse}:`, errMsg);

      // Check if it's a rate limit error (429) or Service Warning
      if (errMsg.includes("429") || errStatus === 429 || errMsg.includes("Too Many Requests")) {
        console.warn(`[Gemini] Rate limit hit for ${modelToUse}. Switching to next model...`);
        currentModelIndex++;
      } else {
        // If it's a 503 (overloaded)
        if (errMsg.includes("503") || errStatus === 503) {
          console.warn(`[Gemini] Server overloaded for ${modelToUse}. Switching...`);
          currentModelIndex++;
        } else {
          // Fatal error, try next model anyway? No, usually fatal means bad request.
          // But if it's a model-specific issue, maybe next one works.
          // Let's safe-guard: if it's 400ish (except 429), break.
          if (errStatus && errStatus >= 400 && errStatus < 500) {
            break;
          }
          currentModelIndex++;
        }
      }
    }
  }

  return "I'm having trouble thinking right now. All my brain cells are busy! Please try again later. 😵";
}
