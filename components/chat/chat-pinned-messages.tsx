"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Loader2, ServerCrash, Hash } from "lucide-react";
import { Message, Member, User, Reaction } from "@/generated/prisma";
import { ChatItem } from "./chat-item";
import { useScrollToMessage } from "@/hooks/use-scroll-to-message";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    user: User
  },
  reactions: (Reaction & {
    member: Member & {
      user: User
    }
  })[]
}

interface ChatPinnedMessagesProps {
  chatId: string;
  type: "channel" | "conversation";
  apiUrl: string;
  socketUrl: string;
  socketQuery: Record<string, string>;
  currentMember: Member;
}

export const ChatPinnedMessages = ({
  chatId,
  type,
  apiUrl,
  socketUrl,
  socketQuery,
  currentMember,
}: ChatPinnedMessagesProps) => {
  const [messages, setMessages] = useState<MessageWithMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const scrollToMessage = useScrollToMessage((state) => state.scrollToMessage);

  useEffect(() => {
    let isMounted = true;

    const fetchPinnedMessages = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(apiUrl);
        if (isMounted) {
          setMessages(data);
          setError(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPinnedMessages();

    return () => {
      isMounted = false;
    };
  }, [apiUrl, chatId]);

  return (
    <div className="flex flex-col h-full bg-[#F2F3F5] dark:bg-[#2B2D31]">
      <div className="flex items-center shadow-sm px-4 py-3 h-12 border-b-2 border-neutral-200 dark:border-[#1f2128]">
        <h3 className="font-semibold text-md text-black dark:text-white flex items-center">
          Pinned Messages
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        {isLoading && (
          <div className="flex flex-col flex-1 justify-center items-center h-full min-h-[500px]">
            <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading pins...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col flex-1 justify-center items-center h-full min-h-[500px]">
            <ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Something went wrong!</p>
          </div>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div className="flex flex-col flex-1 justify-center items-center h-full min-h-[500px] text-zinc-500 dark:text-zinc-400 text-sm text-center px-4">
            No pinned messages in this {type === "channel" ? "channel" : "conversation"} yet.
          </div>
        )}

        {!isLoading && !error && messages.length > 0 && (
          <div className="flex flex-col-reverse mt-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                onClick={() => scrollToMessage(message.id)}
                className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition rounded-md"
              >
                <ChatItem
                  id={message.id}
                  currentMember={currentMember}
                  member={message.member}
                  content={message.content}
                  fileUrl={message.fileUrl}
                  deleted={message.deleted}
                  timestamp={format(new Date(message.createdAt), DATE_FORMAT)}
                  isUpdated={message.updatedAt !== message.createdAt}
                  socketUrl={socketUrl}
                  socketQuery={socketQuery}
                  isPinned={message.isPinned}
                  reactions={message.reactions || []}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
