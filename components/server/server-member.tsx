"use client"

import UserAvatar from "@/components/user-avatar";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

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

  const onClick = () => {
    router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
  }

  return (
    <div
      onClick={onClick}
      className="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1">
      <UserAvatar
        src={member.user.image || ""}
        name={member.user.name}
        className="h-8 w-8 md:h-8 md:w-8"
      />
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-x-2">
          <p className="line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition">
            {member.user.name}
          </p>
          {member.role === "GUEST" && null}
          {member.role === "MODERATOR" && <ShieldCheck className="h-4 w-4 text-indigo-500" />}
          {member.role === "ADMIN" && <ShieldAlert className="h-4 w-4 text-rose-500" />}
        </div>
      </div>
    </div>
  )
}
