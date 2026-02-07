import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-actions";
import prisma from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const session = await getSession();
    const { serverId } = await params;

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    const server = await prisma.server.update({
      where: {
        id: serverId,
        userId: {
          not: session.user.id
        },
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      data: {
        members: {
          deleteMany: {
            userId: session.user.id
          }
        }
      }
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVER_ID_LEAVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
