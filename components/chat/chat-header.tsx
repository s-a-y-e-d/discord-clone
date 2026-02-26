"use client";

import { Hash, ArrowLeft, Pin } from "lucide-react";
import Link from "next/link";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState, useEffect } from "react";

import UserAvatar from "@/components/user-avatar";
import { MobileRightSidebarToggle } from "@/components/mobile-right-sidebar-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { useModal } from "@/hooks/use-modal-store";
import { useScrollToMessage } from "@/hooks/use-scroll-to-message";
import { User } from "@/generated/prisma";

interface ChatHeaderProps {
  serverId: string;
  name: string;
  type: "channel" | "conversation";
  imageUrl?: string;
  rightSidebar?: React.ReactNode;
  pinnedMessagesSidebar?: React.ReactNode;
  showUnlockAi?: boolean;
  profile?: User;
}

export const ChatHeader = ({
  serverId,
  name,
  type,
  imageUrl,
  rightSidebar,
  pinnedMessagesSidebar,
  showUnlockAi,
  profile,
}: ChatHeaderProps) => {
  const { onOpen } = useModal();
  const [pinOpen, setPinOpen] = useState(false);

  // Close the pinned messages sheet when a pinned message is clicked
  useEffect(() => {
    const unsub = useScrollToMessage.subscribe((state) => {
      if (state.targetMessageId) {
        setPinOpen(false);
      }
    });
    return unsub;
  }, []);

  return (
    <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-[#1f2128] border-b-2">
      {/* Mobile: Back arrow to server sidebar view */}
      <Link
        href={`/servers/${serverId}`}
        className="md:hidden mr-2 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      {type === "channel" && (
        <Hash className="w-5 h-5 text-zinc-500 dark:text-zinc-400 mr-2" />
      )}
      {type === "conversation" && (
        <UserAvatar
          src={imageUrl}
          name={name}
          className="h-8 w-8 md:h-8 md:w-8 mr-2"
        />
      )}
      <p className="font-semibold text-md text-black dark:text-white">
        {name}
      </p>
      <div className="ml-auto flex items-center gap-x-2">
        {showUnlockAi && profile && (
          <button
            onClick={() => onOpen("unlockAi", { profile })}
            className="px-3 py-1 mr-2 text-xs font-semibold rounded-md bg-indigo-500 hover:bg-indigo-500/90 text-white transition-colors"
          >
            Unlock AI Features
          </button>
        )}
        {pinnedMessagesSidebar && (
          <Sheet open={pinOpen} onOpenChange={setPinOpen}>
            <SheetTrigger asChild>
              <button className="mr-2 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition">
                <Pin className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-80">
              <VisuallyHidden>
                <SheetTitle>Pinned Messages</SheetTitle>
              </VisuallyHidden>
              {pinnedMessagesSidebar}
            </SheetContent>
          </Sheet>
        )}
        {rightSidebar && (
          <MobileRightSidebarToggle rightSidebar={rightSidebar} />
        )}
      </div>
    </div>
  );
};
