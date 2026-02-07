import { ServerSidebar } from "@/components/server/server-sidebar";
import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";

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

  return (
    <div className="h-full">
      <div
        suppressHydrationWarning
        className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0"
      >
        <ServerSidebar serverId={serverId} />
      </div>
      <main className="h-full md:pl-60">
        {children}
      </main>

    </div>
  )
}