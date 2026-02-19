/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

async function main() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Starting with 2.0 to be safe, then I'll try 2.5 if user persists, or I can try 2.5 here.
      // User said "Exclusively use gemini-2.5-flash".
      // But if it fails I need to know.
      // I will try 2.5 first.
      model: 'gemini-2.5-flash',
      contents: 'Hello, are you there?',
    });
    console.log("Response:", response.text);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
