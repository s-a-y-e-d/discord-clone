import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import db from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { channelId, conversationId } = await req.json();

    if (!channelId && !conversationId) {
      return new NextResponse("Channel ID or Conversation ID required", {
        status: 400,
      });
    }

    if (channelId) {
      await db.channelReadStatus.upsert({
        where: {
          userId_channelId: {
            userId: profile.id,
            channelId,
          },
        },
        update: {
          lastReadAt: new Date(),
        },
        create: {
          userId: profile.id,
          channelId,
          lastReadAt: new Date(),
        },
      });
    }

    if (conversationId) {
      await db.conversationReadStatus.upsert({
        where: {
          userId_conversationId: {
            userId: profile.id,
            conversationId,
          },
        },
        update: {
          lastReadAt: new Date(),
        },
        create: {
          userId: profile.id,
          conversationId,
          lastReadAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[READ_STATUS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
