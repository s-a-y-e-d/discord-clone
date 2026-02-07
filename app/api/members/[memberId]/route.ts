
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-actions";
import prisma from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const { memberId } = await params;

    const serverId = searchParams.get("serverId");

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!memberId) {
      return new NextResponse("Member ID missing", { status: 400 });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        userId: session.user.id,
      },
      data: {
        members: {
          deleteMany: {
            id: memberId,
            userId: {
              not: session.user.id
            }
          }
        }
      },
      include: {
        members: {
          include: {
            user: true,
          },
          orderBy: {
            role: "asc",
          }
        },
      },
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[MEMBER_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const { role } = await req.json();
    const { memberId } = await params;

    const serverId = searchParams.get("serverId");

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!memberId) {
      return new NextResponse("Member ID missing", { status: 400 });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        userId: session.user.id,
      },
      data: {
        members: {
          update: {
            where: {
              id: memberId,
              userId: {
                not: session.user.id
              }
            },
            data: {
              role
            }
          }
        }
      },
      include: {
        members: {
          include: {
            user: true,
          },
          orderBy: {
            role: "asc",
          }
        },
      },
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[MEMBERS_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
