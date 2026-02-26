import db from "./lib/db";
import { encrypt } from "./lib/encrypt";

async function testSave() {
  const user = await db.user.findFirst();
  if (!user) {
    console.log("No user found.");
    return;
  }

  console.log("Trying to update user", user.id);
  const encryptedKey = encrypt("dummy_api_key_123");

  try {
    const updatedUser = await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        encryptedGeminiApiKey: encryptedKey,
      },
      select: {
        id: true,
        encryptedGeminiApiKey: true,
      }
    });

    console.log("Successfully updated:", updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
  }
}

testSave();
