import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { ServerSidebar } from "@/components/server/server-sidebar";
import { NavigationSidebar } from "@/components/navigation/navigation-sidebar";
import { DesktopRedirect } from "@/components/desktop-redirect";

interface ServerIdPageProps {
  params: Promise<{
    serverId: string;
  }>;
}

const ServerIdPage = async (props: ServerIdPageProps) => {
  const params = await props.params;
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/sign-in");
  }

  const server = await prisma.server.findUnique({
    where: {
      id: params.serverId,
      members: {
        some: {
          userId: profile.id,
        }
      }
    },
    include: {
      channels: {
        where: {
          name: "general"
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  })

  const initialChannel = server?.channels[0];

  if (initialChannel?.name !== "general") {
    return null;
  }

  const channelUrl = `/servers/${params.serverId}/channels/${initialChannel?.id}`;

  return (
    <>
      {/* On desktop, redirect to the general channel */}
      <DesktopRedirect url={channelUrl} />

      {/* On mobile, show NavigationSidebar + ServerSidebar side by side */}
      <div className="md:hidden h-full flex overflow-hidden">
        <div className="w-18 flex-shrink-0">
          <NavigationSidebar />
        </div>
        <div className="flex-1 min-w-0 h-full">
          <ServerSidebar serverId={params.serverId} />
        </div>
      </div>

      {/* On desktop, show nothing (redirect handles it) */}
      <div className="hidden md:flex h-full items-center justify-center text-muted-foreground">
        Redirecting...
      </div>
    </>
  )
}

export default ServerIdPage;
