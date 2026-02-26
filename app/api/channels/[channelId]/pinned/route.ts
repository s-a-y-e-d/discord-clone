import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import db from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    const pinnedMessages = await db.message.findMany({
      where: {
        channelId: channelId,
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
    console.log("[PINNED_MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
