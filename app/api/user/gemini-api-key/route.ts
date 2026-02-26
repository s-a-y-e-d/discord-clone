import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import db from "@/lib/db";
import { encrypt } from "@/lib/encrypt";

export async function POST(req: Request) {
  console.log("[GEMINI_API_KEY] Route hit");
  try {
    const profile = await currentProfile();
    console.log("[GEMINI_API_KEY] Profile:", profile?.id);
    const { apiKey } = await req.json();
    console.log("[GEMINI_API_KEY] API Key provided:", !!apiKey);

    if (!profile) {
      console.log("[GEMINI_API_KEY] Unauthorized: No profile");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!apiKey) {
      console.log("[GEMINI_API_KEY] Error: API Key is required");
      return new NextResponse("API Key is required", { status: 400 });
    }

    // Encrypt the API key before storing it
    const encryptedKey = encrypt(apiKey);
    console.log("[GEMINI_API_KEY] Encrypted key generated successfully");

    const user = await db.user.update({
      where: {
        id: profile.id,
      },
      data: {
        encryptedGeminiApiKey: encryptedKey,
      },
    });

    // Don't leak the newly encrypted key to the client
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[USER_GEMINI_API_KEY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
