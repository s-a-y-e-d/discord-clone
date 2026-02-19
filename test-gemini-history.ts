import 'dotenv/config';
import { formatHistory, generateBotResponse } from "./lib/gemini";

// Mock Bot ID
const BOT_ID = "bot-123";

// Mock Messages
const mockMessages = [
  {
    content: "What is this image?",
    memberId: "user-456",
    fileUrl: "https://utfs.io/f/ae2db94d-3df6-419c-845e-1815c1031d23-icon.png", // Using the bot avatar as a test image
  }
];

async function main() {
  console.log("Testing formatHistory...");
  const history = await formatHistory(mockMessages, BOT_ID);

  if (history.length > 0 && history[0].parts.length > 1) {
    console.log("History formatted correctly with image!");
  } else {
    console.error("History formatting failed:", JSON.stringify(history, null, 2));
    return;
  }

  console.log("Testing generateBotResponse with history...");
  const response = await generateBotResponse("Describe the image", history);
  console.log("Bot Response:", response);
}

main();
