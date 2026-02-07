import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/db";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ serverId: string }> }
) {
  const params = await props.params;
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.serverId) {
      return new NextResponse("Server ID Missing", { status: 400 });
    }

    const server = await prisma.server.update({
      where: {
        id: params.serverId,
        userId: profile.id,
      },
      data: {
        inviteCode: uuidv4(),
      },
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVER_ID_INVITE_CODE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
