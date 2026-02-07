import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth-actions";
import prisma from "@/lib/db";
import { MemberRole } from "@/generated/prisma";

export async function DELETE(
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
      return new NextResponse("Server ID Missing", { status: 400 });
    }

    const server = await prisma.server.deleteMany({
      where: {
        id: serverId,
        userId: session.user.id,
      }
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVER_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const session = await getSession();
    const { name, imageUrl } = await req.json();
    const { serverId } = await params;

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID Missing", { status: 400 });
    }


    const server = await prisma.server.updateMany({
      where: {
        id: serverId,
        userId: session.user.id,
      },
      data: {
        name,
        imageUrl,
      }
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVER_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
