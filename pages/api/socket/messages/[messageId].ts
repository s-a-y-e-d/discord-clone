import { NextApiRequest } from "next";
import { MemberRole } from "@/generated/prisma";

import { NextApiResponseServerIo } from "@/types";
import { currentProfilePages } from "@/lib/current-profile-pages";
import db from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "DELETE" && req.method !== "PATCH")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const profile = await currentProfilePages(req);
    const { content, emoji } = req.body;
    const { serverId, channelId, messageId } = req.query;

    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    if (!serverId)
      return res.status(400).json({ error: "Server ID Missing" });

    if (!channelId)
      return res.status(400).json({ error: "Channel ID Missing" });

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
      return res.status(404).json({ error: "Server not found" });

    const channel = await db.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: serverId as string
      }
    });

    if (!channel)
      return res.status(404).json({ error: "Channel not found" });

    const member = server.members.find(
      (member: typeof server.members[0]) => member.userId === profile.id
    );

    if (!member)
      return res.status(404).json({ error: "Member not found" });

    let message = await db.message.findFirst({
      where: {
        id: messageId as string,
        channelId: channelId as string
      },
      include: {
        member: {
          include: {
            user: true
          }
        },
        reactions: {
          include: {
            member: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!message || message.deleted)
      return res.status(404).json({ error: "Message not found" });

    const isMessageOwner = message.memberId === member.id;
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;
    const canModify = isMessageOwner || isAdmin || isModerator;

    if (req.method === "DELETE") {
      if (!canModify) return res.status(401).json({ error: "Unauthorized" });

      message = await db.message.update({
        where: {
          id: messageId as string
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
          },
          reactions: {
            include: {
              member: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });
    }

    if (req.method === "PATCH") {
      if (emoji) {
        // Toggle reaction
        const existingReaction = await db.reaction.findFirst({
          where: {
            messageId: messageId as string,
            memberId: member.id,
            emoji
          }
        });

        if (existingReaction) {
          await db.reaction.delete({
            where: {
              id: existingReaction.id
            }
          });
        } else {
          await db.reaction.create({
            data: {
              messageId: messageId as string,
              memberId: member.id,
              emoji
            }
          });
        }

        // Refetch message to get updated reactions
        message = await db.message.findFirst({
          where: {
            id: messageId as string,
          },
          include: {
            member: {
              include: {
                user: true
              }
            },
            reactions: {
              include: {
                member: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        });
      }

      // Handle pin toggle and content edit (outside emoji block)
      const isPinnedToggle = req.body.isPinned !== undefined;
      if (isPinnedToggle && !canModify) {
        return res.status(401).json({ error: "Unauthorized to pin/unpin" });
      }

      const dataToUpdate: { content?: string; isPinned?: boolean; updatedAt?: Date } = {};
      if (content !== undefined && isMessageOwner) {
        dataToUpdate.content = content;
      }
      if (isPinnedToggle) {
        dataToUpdate.isPinned = req.body.isPinned;
      }

      // Preserve updatedAt when only pin status changes (no content edit)
      if (isPinnedToggle && !dataToUpdate.content) {
        dataToUpdate.updatedAt = message!.updatedAt;
      }

      if (Object.keys(dataToUpdate).length > 0) {
        message = await db.message.update({
          where: {
            id: messageId as string
          },
          data: dataToUpdate,
          include: {
            member: {
              include: {
                user: true
              }
            },
            reactions: {
              include: {
                member: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        });
      }
    }

    const updateKey = `chat:${channelId}:messages:update`;

    res?.socket?.server?.io?.emit(updateKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.error("[MESSAGES_ID]", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}