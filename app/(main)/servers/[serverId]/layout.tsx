import { ServerSidebar } from "@/components/server/server-sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default async function ServerIdLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ serverId: string }>
}) {
  const { serverId } = await params;

  const user = await currentProfile();
  if (!user) {
    redirect('/sign-in')
  }

  const server = await prisma.server.findUnique({
    where: {
      id: serverId,
      members: {
        some: {
          userId: user.id,
        }
      }
    }
  });

  if (!server) {
    redirect('/')
  }

  const member = await prisma.member.findFirst({
    where: {
      serverId: serverId,
      userId: user.id,
    }
  });

  const sharedFiles = await prisma.message.findMany({
    where: {
      channel: {
        serverId: serverId,
      },
      fileUrl: {
        not: null,
      },
      member: {
        role: {
          in: ["ADMIN", "MODERATOR"]
        }
      }
    },
    include: {
      member: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <div className="h-full">
      <div className="md:hidden h-full">
        {children}
      </div>

      <div className="hidden md:flex h-full w-full">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20}>
            <ServerSidebar serverId={serverId} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60}>
            {children}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={20}>
            <RightSidebar
              serverFiles={sharedFiles}
              role={member?.role}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}