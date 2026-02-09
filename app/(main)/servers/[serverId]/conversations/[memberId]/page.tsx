import { ChatHeader } from "@/components/chat/chat-header";
import { findOrCreateConversation } from "@/lib/conversation";
import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";

type ServerIdPageProps = {
  params: Promise<{
    memberId: string;
    serverId: string;
  }>;
}

export default async function ChannelPage(props: ServerIdPageProps) {
  const params = await props.params;

  const currentUser = await currentProfile();
  if (!currentUser) {
    redirect("/sign-in");
  }

  const currentMemberId = await prisma.member.findFirst({
    where: {
      userId: currentUser.id,
      serverId: params.serverId,

    },
    include: { user: true }
  });

  if (!currentMemberId) {
    redirect("/");
  }

  const conversation = await findOrCreateConversation(currentMemberId.id, params.memberId);

  const { memberOne, memberTwo } = conversation;

  const otherMember = memberOne.userId === currentUser.id ? memberTwo : memberOne;
  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        imageUrl={otherMember.user.imageUrl}
        name={otherMember.user.name}
        serverId={params.serverId}
        type='conversation'
      />
    </div>
  );
}