import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import db from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!conversationId) {
      return new NextResponse("Conversation ID missing", { status: 400 });
    }

    const pinnedMessages = await db.directMessage.findMany({
      where: {
        conversationId: conversationId,
        isPinned: true,
        deleted: false,
      },
      include: {
        member: {
          include: {
            user: true,
          }
        },
        reactions: {
          include: {
            member: {
              include: {
                user: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      }
    });

    return NextResponse.json(pinnedMessages);

  } catch (error) {
    console.log("[PINNED_DIRECT_MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
