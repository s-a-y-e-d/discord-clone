import db from "@/lib/db";
import { Member, MemberRole } from "@/generated/prisma/index";

export const BOT_EMAIL = "bot@studybot.ai";
export const BOT_NAME = "StudyBot";
export const BOT_AVATAR = "https://utfs.io/f/ae2db94d-3df6-419c-845e-1815c1031d23-icon.png"; // Placeholder or specific bot avatar

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
        id: "study-bot-id", // Fixed ID for easier reference if needed, or let cuid generate it. Let's use a fixed one for consistency if possible, or just let DB handle it. Actually, fixed ID might conflict if using cuid elsewhere. Let's use a specific CUIDish string or let it auto-generate.
        // Actually, let's use a specific ID so we can hardcode it if needed, but safe to let Prisma generate.
        // Let's stick to auto-generated to be safe with CUID collisions, but we search by email.
        name: BOT_NAME,
        email: BOT_EMAIL,
        imageUrl: BOT_AVATAR,
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
