import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";


type InviteCodePageprops = {
  params: Promise<{ inviteCode: string }>
}
export default async function InviteCodePage({ params }: InviteCodePageprops) {
  const { inviteCode } = await params;

  const user = await currentProfile();

  if (!user) {
    redirect(`/sign-in?callbackURL=/invite/${inviteCode}`);
  }

  if (!inviteCode) {
    redirect('/');
  }

  const existingServer = await prisma.server.findFirst({
    where: {
      inviteCode,
      members: {
        some: {
          userId: user.id
        }
      }
    }
  });

  if (existingServer) {
    redirect(`/servers/${existingServer.id}`)
  }

  // First check if the server exists with this invite code
  const serverExists = await prisma.server.findFirst({
    where: {
      inviteCode,
    }
  });

  if (!serverExists) {
    return redirect("/");
  }

  const server = await prisma.server.update({
    where: {
      inviteCode,
    },
    data: {
      members: {
        create: [
          {
            userId: user.id,
          }
        ]
      }
    }
  });

  if (server) {
    redirect(`/servers/${server.id}`)
  }

  return null
}
