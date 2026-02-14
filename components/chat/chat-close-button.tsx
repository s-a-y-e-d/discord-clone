"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { ActionTooltip } from "@/components/action-tooltip";

export const ChatCloseButton = () => {
  const router = useRouter();

  return (
    <ActionTooltip label="Close">
      <button
        onClick={() => router.back()}
        className="hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 p-2 rounded-md transition md:hidden"
      >
        <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition" />
      </button>
    </ActionTooltip>
  )
}
