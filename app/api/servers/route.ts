import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { MemberRole } from "@/generated/prisma";
import { getSession } from "@/lib/auth-actions";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, imageUrl } = await req.json();
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const server = await prisma.server.create({
      data: {
        id: uuidv4(),
        name,
        imageUrl,
        inviteCode: uuidv4(),
        userId: session.user.id,
        channels: {
          create: [
            { name: "general", user: { connect: { id: session.user.id } } }
          ]
        },
        members: {
          create: [
            { userId: session.user.id, role: MemberRole.ADMIN }
          ]
        }
      }
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
