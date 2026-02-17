import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import db from "@/lib/db";

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId");

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    // Verify user is a member of this server
    const member = await db.member.findFirst({
      where: {
        serverId,
        userId: profile.id,
      },
    });

    if (!member) {
      return new NextResponse("Not a member", { status: 403 });
    }

    // Get all channels in this server
    const channels = await db.channel.findMany({
      where: { serverId },
      select: { id: true },
    });

    const channelIds = channels.map((c) => c.id);

    // Get user's read statuses for these channels
    const channelReadStatuses = await db.channelReadStatus.findMany({
      where: {
        userId: profile.id,
        channelId: { in: channelIds },
      },
    });

    // Build a map of channelId -> lastReadAt
    const channelReadMap = new Map(
      channelReadStatuses.map((s) => [s.channelId, s.lastReadAt])
    );

    // Count unread messages per channel
    const channelUnreadCounts: Record<string, number> = {};

    for (const channelId of channelIds) {
      const lastReadAt = channelReadMap.get(channelId);

      const count = await db.message.count({
        where: {
          channelId,
          deleted: false,
          // Exclude messages sent by the current user
          member: { userId: { not: profile.id } },
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });

      if (count > 0) {
        channelUnreadCounts[channelId] = count;
      }
    }

    // Get conversations involving this member
    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { memberOneId: member.id },
          { memberTwoId: member.id },
        ],
      },
      select: { id: true },
    });

    const conversationIds = conversations.map((c) => c.id);

    // Get read statuses for conversations
    const conversationReadStatuses = await db.conversationReadStatus.findMany({
      where: {
        userId: profile.id,
        conversationId: { in: conversationIds },
      },
    });

    const conversationReadMap = new Map(
      conversationReadStatuses.map((s) => [s.conversationId, s.lastReadAt])
    );

    // Count unread direct messages per conversation
    const conversationUnreadCounts: Record<string, number> = {};

    for (const conversationId of conversationIds) {
      const lastReadAt = conversationReadMap.get(conversationId);

      const count = await db.directMessage.count({
        where: {
          conversationId,
          deleted: false,
          member: { userId: { not: profile.id } },
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });

      if (count > 0) {
        conversationUnreadCounts[conversationId] = count;
      }
    }

    // We also need to map conversations to memberIds for the sidebar
    // The sidebar uses member IDs to navigate to conversations
    const conversationsWithMembers = await db.conversation.findMany({
      where: {
        id: { in: Object.keys(conversationUnreadCounts) },
      },
      select: {
        id: true,
        memberOneId: true,
        memberTwoId: true,
      },
    });

    // Map: memberId -> unread count (the OTHER member, not the current user)
    const memberUnreadCounts: Record<string, number> = {};
    for (const conv of conversationsWithMembers) {
      const otherMemberId =
        conv.memberOneId === member.id ? conv.memberTwoId : conv.memberOneId;
      memberUnreadCounts[otherMemberId] =
        conversationUnreadCounts[conv.id] || 0;
    }

    return NextResponse.json({
      channels: channelUnreadCounts,
      members: memberUnreadCounts,
    });
  } catch (error) {
    console.error("[UNREAD_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
