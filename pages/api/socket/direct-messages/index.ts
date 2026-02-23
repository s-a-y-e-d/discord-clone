import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { getOrCreateBotUser, getDirectMessageHistory, getServerImportantFiles } from "@/lib/bot-utils";
import { generateBotResponse, formatHistory } from "@/lib/gemini";
import prisma from "@/lib/db";

const db = prisma;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const profile = await currentProfilePages(req);
    const { content, fileUrl, nonce, isImportant } = req.body;
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
        memberId: member.id,
        isImportant,
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

    res?.socket?.server?.io?.emit(channelKey, {
      ...message,
      nonce,
    });

    // Emit server-level activity for unread tracking in sidebar
    // The "other" member is the one who should see the badge
    const otherMember =
      conversation.memberOne.userId === profile.id
        ? conversation.memberTwo
        : conversation.memberOne;
    const activityKey = `server:${member.serverId}:new-activity`;
    res?.socket?.server?.io?.emit(activityKey, {
      memberId: member.id,
      otherMemberId: otherMember.id,
      conversationId,
    });

    res.status(200).json(message);

    // Bot Interception Logic for DMs
    const botUser = await getOrCreateBotUser();
    if (otherMember.userId === botUser.id) {
      const typingKey = `chat:${conversationId}:typing`;

      try {
        console.log("[DEBUG] Emitting typing event:", typingKey, { memberId: otherMember.id, isTyping: true });
        res?.socket?.server?.io?.emit(typingKey, {
          memberId: otherMember.id,
          isTyping: true
        });

        // Phase 2: Fetch and format history including server important files
        const history = await getDirectMessageHistory(conversationId as string);
        const serverImportantFiles = await getServerImportantFiles(member.serverId);

        const combinedHistory = [...serverImportantFiles, ...history];
        const formattedHistory = await formatHistory(combinedHistory, otherMember.id);

        let decryptedKey: string | undefined = undefined;

        // In DMs, the messaging user must provide their own API key
        if (profile.encryptedGeminiApiKey) {
          const { decrypt } = await import("@/lib/encrypt");
          decryptedKey = decrypt(profile.encryptedGeminiApiKey);
        }

        if (!decryptedKey) {
          const botMessage = await db.directMessage.create({
            data: {
              content: "You must configure your own Gemini API Key to use AI features in Direct Messages. Click 'Unlock AI Features' or visit your profile.",
              conversationId: conversationId as string,
              memberId: otherMember.id,
            },
            include: { member: { include: { user: true } } },
          });
          res?.socket?.server?.io?.emit(channelKey, botMessage);
          res?.socket?.server?.io?.emit(activityKey, { memberId: otherMember.id, otherMemberId: member.id, conversationId });
          res?.socket?.server?.io?.emit(typingKey, { memberId: otherMember.id, isTyping: false });
          return;
        }

        const botResponseText = await generateBotResponse(content, formattedHistory, decryptedKey);

        const botMessage = await db.directMessage.create({
          data: {
            content: botResponseText,
            conversationId: conversationId as string,
            memberId: otherMember.id,
          },
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
        });

        res?.socket?.server?.io?.emit(channelKey, botMessage);

        // Emit activity for bot message
        res?.socket?.server?.io?.emit(activityKey, {
          memberId: otherMember.id,
          otherMemberId: member.id,
          conversationId,
        });

        console.log("[DEBUG] Emitting stop typing event (success):", typingKey);
        res?.socket?.server?.io?.emit(typingKey, {
          memberId: otherMember.id,
          isTyping: false
        });

      } catch (botError) {
        console.error("[BOT_ERROR]", botError);
        console.log("[DEBUG] Emitting stop typing event (error):", typingKey);
        res?.socket?.server?.io?.emit(typingKey, {
          memberId: otherMember.id,
          isTyping: false
        });
      }
    }
  } catch (error) {
    console.error("[DIRECT_MESSAGES_POST]", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}