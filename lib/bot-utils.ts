import db from "@/lib/db";
import { Member, MemberRole } from "@/generated/prisma/index";

export const BOT_EMAIL = "bot@studybot.ai";
export const BOT_NAME = "StudyBot";
export const BOT_AVATAR = "/bot.png";

/**
 * Ensures the StudyBot user exists in the database.
 */
export async function getOrCreateBotUser() {
  let botUser = await db.user.findUnique({
    where: {
      email: BOT_EMAIL,
    },
  });

  if (!botUser) {
    botUser = await db.user.create({
      data: {
        id: "study-bot-id",
        name: BOT_NAME,
        email: BOT_EMAIL,
        imageUrl: BOT_AVATAR,
        image: BOT_AVATAR,
      },
    });
  } else if (botUser.imageUrl !== BOT_AVATAR || botUser.image !== BOT_AVATAR) {
    botUser = await db.user.update({
      where: { id: botUser.id },
      data: {
        imageUrl: BOT_AVATAR,
        image: BOT_AVATAR,
      },
    });
  }

  return botUser;
}

/**
 * Ensures the StudyBot is a member of the specified server.
 */
export async function getBotMember(serverId: string): Promise<Member> {
  const botUser = await getOrCreateBotUser();

  let botMember = await db.member.findFirst({
    where: {
      serverId: serverId,
      userId: botUser.id,
    },
  });

  if (!botMember) {
    botMember = await db.member.create({
      data: {
        serverId: serverId,
        userId: botUser.id,
        role: MemberRole.GUEST, // Bot is a guest, or maybe MODERATOR if it needs to see all channels? GUEST is safer.
      },
    });
  }

  return botMember;
}

/**
 * Fetches the recent chat history for a channel.
 */
export async function getChatHistory(channelId: string, limit: number = 20) {
  const messages = await db.message.findMany({
    where: {
      channelId,
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
  });

  return messages.reverse();
}

/**
 * Fetches the recent chat history for a direct message conversation.
 */
export async function getDirectMessageHistory(conversationId: string, limit: number = 20) {
  const messages = await db.directMessage.findMany({
    where: {
      conversationId,
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
  });

  return messages.reverse();
}

/**
 * Fetches all important messages/files from a specific server.
 */
export async function getServerImportantFiles(serverId: string) {
  const importantMessages = await db.message.findMany({
    where: {
      channel: {
        serverId: serverId,
      },
      isImportant: true,
      deleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
  });

  return importantMessages.reverse();
}
