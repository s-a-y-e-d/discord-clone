import { MemberRole } from "@/generated/prisma";
import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const { channelId } = await params;
    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    console.log("[DELETE_CHANNEL] Request received for channel", channelId, "in server", serverId);

    const server = await prisma.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            userId: profile.id,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            }
          }
        }
      },
      data: {
        channels: {
          delete: {
            id: channelId,
            name: {
              not: "general",
            }
          }
        }
      }
    });

    console.log("[DELETE_CHANNEL] Server updated. Channel deleted.");

    return NextResponse.json(server);
  } catch (error) {
    console.log("[CHANNEL_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { name, type } = await req.json();
    const { searchParams } = new URL(req.url);

    const { channelId } = await params;
    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    if (name === "general") {
      return new NextResponse("Name cannot be 'general'", { status: 400 });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        members: {
          some: {
            userId: profile.id,
            role: {
              in: [MemberRole.ADMIN, MemberRole.MODERATOR],
            }
          }
        }
      },
      data: {
        channels: {
          update: {
            where: {
              id: channelId,
              NOT: {
                name: "general",
              },
            },
            data: {
              name,
              type,
            }
          }
        }
      }
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[CHANNEL_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
