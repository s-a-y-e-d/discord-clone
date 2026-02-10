import { NextApiRequest } from "next";
import { MemberRole } from "@/generated/prisma";

import { NextApiResponseServerIo } from "@/types";
import { currentProfile } from "@/lib/current-profile";
import db from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "DELETE" && req.method !== "PATCH")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const profile = await currentProfile();
    const { content } = req.body;
    const { directMessageId, conversationId } = req.query;

    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    if (!conversationId)
      return res.status(400).json({ error: "Conversation ID Missing" });

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId as string,
        OR: [
          { memberOne: { userId: profile.id } },
          { memberTwo: { userId: profile.id } }
        ]
      },
      include: {
        memberOne: { include: { user: true } },
        memberTwo: { include: { user: true } }
      }
    });

    if (!conversation)
      return res.status(404).json({ error: "Conversation not found" });

    const member =
      conversation.memberOne.userId === profile.id
        ? conversation.memberOne
        : conversation.memberTwo;

    if (!member)
      return res.status(404).json({ error: "Member not found" });

    let directMessage = await db.directMessage.findFirst({
      where: {
        id: directMessageId as string,
        conversationId: conversationId as string
      },
      include: {
        member: {
          include: {
            user: true
          }
        }
      }
    });

    if (!directMessage || directMessage.deleted)
      return res.status(404).json({ error: "Message not found" });

    const isMessageOwner = directMessage.memberId === member.id;
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;
    const canModify = isMessageOwner || isAdmin || isModerator;

    if (!canModify) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "DELETE") {
      directMessage = await db.directMessage.update({
        where: {
          id: directMessageId as string
        },
        data: {
          fileUrl: null,
          content: "This message has been deleted.",
          deleted: true
        },
        include: {
          member: {
            include: {
              user: true
            }
          }
        }
      });
    }

    if (req.method === "PATCH") {
      if (!isMessageOwner)
        return res.status(401).json({ error: "Unauthorized" });

      directMessage = await db.directMessage.update({
        where: {
          id: directMessageId as string
        },
        data: {
          content
        },
        include: {
          member: {
            include: {
              user: true
            }
          }
        }
      });
    }

    const updateKey = `chat:${conversationId}:messages:update`;

    res?.socket?.server?.io?.emit(updateKey, directMessage);

    return res.status(200).json(directMessage);
  } catch (error) {
    console.error("[MESSAGES_ID]", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}