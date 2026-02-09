"use client";

import { Hash, Volume2, X } from "lucide-react";
import UserAvatar from "../user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { useRouter } from "next/navigation";

interface ChatHeaderProps {
  serverId: string;
  name: string;
  type: "channel" | "conversation";
  imageUrl?: string | null;
}

export const ChatHeader = ({
  serverId,
  name,
  type,
  imageUrl,
}: ChatHeaderProps) => {
  const router = useRouter();

  return (
    <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
      {type === "channel" && (
        <Hash className="w-5 h-5 text-zinc-500 dark:text-zinc-400 mr-2" />
      )}
      {type === "conversation" && (
        <UserAvatar
          src={imageUrl || undefined}
          name={name}
          className="h-8 w-8 md:h-8 md:w-8 mr-2"
        />
      )}
      <p className="font-semibold text-md text-black dark:text-white">
        {name}
      </p>

      <div className="ml-auto flex items-center gap-2">
        {type === "channel" && (
          <ActionTooltip label="Voice Channel">
            <button className="hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 p-2 rounded-md transition">
              <Volume2 className="w-5 h-5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition" />
            </button>
          </ActionTooltip>
        )}

        <ActionTooltip label="Close">
          <button
            onClick={() => router.back()}
            className="hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 p-2 rounded-md transition md:hidden"
          >
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition" />
          </button>
        </ActionTooltip>
      </div>
    </div>
  );
};
