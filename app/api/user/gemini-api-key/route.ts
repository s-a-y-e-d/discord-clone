import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import db from "@/lib/db";
import { encrypt } from "@/lib/encrypt";

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    const { apiKey } = await req.json();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!apiKey) {
      return new NextResponse("API Key is required", { status: 400 });
    }

    // Encrypt the API key before storing it
    const encryptedKey = encrypt(apiKey);

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
