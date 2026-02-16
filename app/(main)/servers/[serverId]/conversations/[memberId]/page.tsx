import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import db from "@/lib/db";
import { findOrCreateConversation } from "@/lib/conversation";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { MediaRoom } from "@/components/media-room";
import { MobileRightSidebarContent } from "@/components/mobile-right-sidebar-content";

interface MemberIdPageProps {
  params: Promise<{
    memberId: string;
    serverId: string;
  }>;
  searchParams: Promise<{
    video?: boolean;
  }>;
}

const MemberIdPage = async (props: MemberIdPageProps) => {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/sign-in");
  }

  const currentMember = await db.member.findFirst({
    where: {
      serverId: params.serverId,
      userId: profile.id,
    },
    include: {
      user: true,
    },
  });

  if (!currentMember) {
    return redirect("/");
  }

  const conversation = await findOrCreateConversation(
    currentMember.id,
    params.memberId
  );

  if (!conversation) {
    return redirect(`/servers/${params.serverId}`);
  }

  const { memberOne, memberTwo } = conversation;

  const otherMember = memberOne.id === currentMember.id ? memberTwo : memberOne;

  return (
    <div className="bg-white dark:bg-background flex flex-col h-full overflow-hidden">
      <ChatHeader
        imageUrl={otherMember.user.imageUrl || undefined}
        name={otherMember.user.name}
        serverId={params.serverId}
        type="conversation"
        rightSidebar={<MobileRightSidebarContent serverId={params.serverId} />}
      />
      {searchParams.video && (
        <MediaRoom
          chatId={conversation.id}
          video={true}
          audio={true}
          user={profile}
        />
      )}
      {!searchParams.video && (
        <>
          <ChatMessages
            member={currentMember}
            name={otherMember.user.name}
            chatId={conversation.id}
            type="conversation"
            apiUrl="/api/direct-messages"
            paramKey="conversationId"
            paramValue={conversation.id}
            socketUrl="/api/socket/direct-messages"
            socketQuery={{
              conversationId: conversation.id,
            }}
          />
          <ChatInput
            member={currentMember}
            name={otherMember.user.name}
            type="conversation"
            apiUrl="/api/socket/direct-messages"
            query={{
              conversationId: conversation.id,
            }}
          />
        </>
      )}
    </div>
  );
}

export default MemberIdPage;