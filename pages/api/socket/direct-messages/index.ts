import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/db";

const db = prisma;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const profile = await currentProfile();
    const { content, fileUrl } = req.body;
    const { conversationId } = req.query;

    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    if (!conversationId)
      return res.status(400).json({ error: "Conversation ID Missing" });

    if (!content)
      return res.status(400).json({ error: "Content Missing" });

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId as string,
        OR: [
          { memberOne: { userId: profile.id } },
          { memberTwo: { userId: profile.id } }
        ]
      },
      include: {
        memberOne: {
          include: { user: true }
        },
        memberTwo: {
          include: { user: true }
        }
      }
    });

    if (!conversation)
      return res.status(404).json({ error: "Connversation not found" });

    const member =
      conversation.memberOne.userId === profile.id
        ? conversation.memberOne
        : conversation.memberTwo;

    if (!member)
      return res.status(404).json({ message: "Member not found" });

    const message = await db.directMessage.create({
      data: {
        content,
        fileUrl,
        conversationId: conversationId as string,
        memberId: member.id
      },
      include: {
        member: {
          include: {
            user: true
          }
        }
      }
    });

    const channelKey = `chat:${conversationId}:messages`;

    res?.socket?.server?.io?.emit(channelKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.error("[DIRECT_MESSAGES_POST]", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}