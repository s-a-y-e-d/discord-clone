import dotenv from "dotenv";
dotenv.config();
import { generateBotResponse } from "./lib/gemini";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Testing Gemini Fallback Logic...");
  try {
    const response = await generateBotResponse("Hello from test script!");
    console.log("\nResponse received:", response);

    const usagePath = path.join(process.cwd(), "gemini-usage.json");
    if (fs.existsSync(usagePath)) {
      console.log("\nUsage file created:", fs.readFileSync(usagePath, "utf-8"));
    } else {
      console.log("\nUsage file NOT created.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
