import { RightSidebar } from "@/components/right-sidebar";
import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/db";

interface MobileRightSidebarContentProps {
  serverId: string;
}

export const MobileRightSidebarContent = async ({
  serverId,
}: MobileRightSidebarContentProps) => {
  const user = await currentProfile();
  if (!user) return null;

  const member = await prisma.member.findFirst({
    where: {
      serverId,
      userId: user.id,
    },
  });

  const sharedFiles = await prisma.message.findMany({
    where: {
      channel: {
        serverId,
      },
      fileUrl: {
        not: null,
      },
      member: {
        role: {
          in: ["ADMIN", "MODERATOR"],
        },
      },
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <RightSidebar
      serverFiles={sharedFiles}
      role={member?.role}
    />
  );
};
