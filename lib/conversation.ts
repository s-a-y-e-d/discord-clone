import prisma from "@/lib/db";

export async function findOrCreateConversation(memberOneId: string,
  memberTwoId: string) {
  let conversation = await findConversation(memberOneId, memberTwoId) || await findConversation(memberTwoId, memberOneId);

  if (!conversation) {
    conversation = await createConversation(memberOneId, memberTwoId);
  }
  return conversation;
}

export async function findConversation(
  memberOneId: string,
  memberTwoId: string
) {
  try {
    return await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            memberOneId: {
              in: [memberOneId, memberTwoId],
            },
          },
          {
            memberTwoId: {
              in: [memberOneId, memberTwoId],
            },
          },
        ],
      },
      include: {
        memberOne: {
          include: { user: true },
        },
        memberTwo: {
          include: { user: true },
        },
      },
    });

  } catch {
    throw new Error("Failed to find conversation");
  }
};


export async function createConversation(
  memberOneId: string,
  memberTwoId: string
) {
  try {
    return await prisma.conversation.create({
      data: {
        memberOneId,
        memberTwoId,
      },
      include: {
        memberOne: {
          include: { user: true },
        },
        memberTwo: {
          include: { user: true },
        },
      },
    });

  } catch {
    throw new Error("Failed to create conversation");
  }
};
