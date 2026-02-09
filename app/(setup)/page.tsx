import InitialModal from "@/components/modals/initial-modal";
import { getSession } from "@/lib/auth-actions"
import prisma from "@/lib/db";
import { redirect } from "next/navigation";

export default async function SetUpPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in')
  }

  const server = await prisma.server.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.id
        }
      }
    }
  });
  const generalChannel = await prisma.channel.findFirst({
    where: {
      serverId: server?.id,
      name: 'general'
    }
  });

  if (server && generalChannel) {
    redirect(`/servers/${server.id}/channels/${generalChannel.id}`)
  }


  return (
    <InitialModal />
  )
}
