import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { currentProfilePages } from "@/lib/current-profile-pages";
import db from "@/lib/db";
import { getBotMember, getChatHistory, getServerImportantFiles } from "@/lib/bot-utils";
import { generateBotResponse, formatHistory } from "@/lib/gemini";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const profile = await currentProfilePages(req);
    const { content, fileUrl, nonce, isImportant } = req.body;
    const { serverId, channelId: queryChannelId } = req.query;
    const channelId = queryChannelId as string;

    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    if (!serverId)
      return res.status(400).json({ error: "Server ID Missing" });

    if (!channelId)
      return res.status(400).json({ error: "Channel ID Missing" });

    if (!content)
      return res.status(400).json({ error: "Content Missing" });

    const server = await db.server.findFirst({
      where: {
        id: serverId as string,
        members: {
          some: {
            userId: profile.id
          }
        }
      },
      include: {
        members: true
      }
    });

    if (!server)
      return res.status(404).json({ message: "Server not found" });

    const channel = await db.channel.findFirst({
      where: {
        id: channelId,
        serverId: serverId as string
      }
    });

    if (!channel)
      return res.status(404).json({ message: "Channel not found" });

    const member = server.members.find(
      (member: typeof server.members[0]) => member.userId === profile.id
    );

    if (!member)
      return res.status(404).json({ message: "Member not found" });

    const message = await db.message.create({
      data: {
        content,
        fileUrl,
        channelId: channelId,
        memberId: member.id,
        isImportant: isImportant as boolean,
      },
      include: {
        member: {
          include: {
            user: true
          }
        }
      }
    });

    // Capture IO instance early to ensure availability
    const io = res?.socket?.server?.io;
    const channelKey = `chat:${channelId}:messages`;

    io?.emit(channelKey, {
      ...message,
      nonce,
    });

    // Emit server-level activity for unread tracking in sidebar
    const activityKey = `server:${serverId}:new-activity`;
    io?.emit(activityKey, {
      channelId,
      senderMemberId: member.id,
    });

    res.status(200).json(message);

    // Bot Interception Logic
    if (content.includes("@StudyBot") || content.startsWith("/study")) {
      const typingKey = `chat:${channelId}:typing`;
      let botMember;

      try {
        botMember = await getBotMember(serverId as string);
        const prompt = content.replace("@StudyBot", "").replace("/study", "").trim();

        console.log("[DEBUG] Emitting typing event:", typingKey, { memberId: botMember.id, isTyping: true });
        io?.emit(typingKey, {
          memberId: botMember.id,
          isTyping: true
        });

        // Phase 2: Fetch and format history
        const history = await getChatHistory(channelId);
        const serverImportantFiles = await getServerImportantFiles(serverId as string);

        const combinedHistory = [...serverImportantFiles, ...history];
        const formattedHistory = await formatHistory(combinedHistory, botMember.id);

        let decryptedKey: string | undefined = undefined;

        if (server.userId) {
          const owner = await db.user.findUnique({
            where: { id: server.userId },
            select: { encryptedGeminiApiKey: true },
          });

          if (owner?.encryptedGeminiApiKey) {
            const { decrypt } = await import("@/lib/encrypt");
            decryptedKey = decrypt(owner.encryptedGeminiApiKey);
          }
        }

        if (!decryptedKey) {
          // If the admin hasn't set an API key, we should inform the user
          const botMessage = await db.message.create({
            data: {
              content: "The Server Admin must configure their Gemini API Key to use AI features. Please contact them.",
              channelId: channelId,
              memberId: botMember.id,
            },
            include: { member: { include: { user: true } } },
          });
          io?.emit(channelKey, botMessage);
          io?.emit(activityKey, { channelId, senderMemberId: botMember.id });
          io?.emit(typingKey, { memberId: botMember.id, isTyping: false });
          return;
        }

        const botResponseText = await generateBotResponse(prompt, formattedHistory, decryptedKey);

        const botMessage = await db.message.create({
          data: {
            content: botResponseText,
            channelId: channelId,
            memberId: botMember.id,
          },
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
        });

        io?.emit(channelKey, botMessage);

        // Emit activity for bot message
        io?.emit(activityKey, {
          channelId,
          senderMemberId: botMember.id,
        });

        console.log("[DEBUG] Emitting stop typing event (success):", typingKey);
        io?.emit(typingKey, {
          memberId: botMember.id,
          isTyping: false
        });

      } catch (botError) {
        console.error("[BOT_ERROR]", botError);
        if (botMember) {
          console.log("[DEBUG] Emitting stop typing event (error):", typingKey);
          io?.emit(typingKey, {
            memberId: botMember.id,
            isTyping: false
          });
        }
      }
    }
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}