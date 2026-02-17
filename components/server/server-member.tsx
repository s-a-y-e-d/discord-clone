"use client";

import { useEffect } from "react";

import UserAvatar from "@/components/user-avatar";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useUnreadCounts } from "@/components/providers/unread-provider";
import { cn } from "@/lib/utils";

type ServerMemberProps = {
  member: {
    id: string;
    role: string;
    user: {
      name: string;
      image?: string | null;
    };
  };
};

export default function ServerMember({ member }: ServerMemberProps) {
  const params = useParams();
  const router = useRouter();
  const { unreadCounts, markConversationAsRead } = useUnreadCounts();

  const unreadCount = unreadCounts.members[member.id] || 0;
  const isActive = params?.memberId === member.id;

  useEffect(() => {
    if (isActive && unreadCount > 0) {
      markConversationAsRead(member.id);
    }
  }, [isActive, unreadCount, markConversationAsRead, member.id]);

  const onClick = () => {
    markConversationAsRead(member.id);
    router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
  }

  return (
    <div
      onClick={onClick}
      className="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1 cursor-pointer">
      <UserAvatar
        src={member.user.image || ""}
        name={member.user.name}
        className="h-8 w-8 md:h-8 md:w-8"
      />
      <div className="flex flex-col gap-y-1 flex-1 min-w-0">
        <div className="flex items-center gap-x-2">
          <p className={cn(
            "line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
            unreadCount > 0 && "text-zinc-800 dark:text-zinc-100 font-bold"
          )}>
            {member.user.name}
          </p>
          {member.role === "GUEST" && null}
          {member.role === "MODERATOR" && <ShieldCheck className="h-4 w-4 text-indigo-500" />}
          {member.role === "ADMIN" && <ShieldAlert className="h-4 w-4 text-rose-500" />}
        </div>
      </div>
      {unreadCount > 0 && (
        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </div>
  )
}
