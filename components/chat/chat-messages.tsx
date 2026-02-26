"use client";

import { Fragment, useRef, ElementRef, useEffect } from "react";
import { format } from "date-fns";
import { Member, Message, User, Reaction } from "@/generated/prisma";
import { Loader2, ServerCrash, ChevronsDown } from "lucide-react";

import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useChatTyping } from "@/hooks/use-chat-typing";
import { useScrollToMessage } from "@/hooks/use-scroll-to-message";

import { ChatWelcome } from "./chat-welcome";
import { ChatItem } from "./chat-item";

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

interface ChatMessagesProps {
  name: string;
  member: Member;
  chatId: string;
  apiUrl: string;
  socketUrl: string;
  socketQuery: Record<string, string>;
  paramKey: "channelId" | "conversationId";
  paramValue: string;
  type: "channel" | "conversation";
}

export const ChatMessages = ({
  name,
  member,
  chatId,
  apiUrl,
  socketUrl,
  socketQuery,
  paramKey,
  paramValue,
  type,
}: ChatMessagesProps) => {
  const queryKey = `chat:${chatId}`;
  const addKey = `chat:${chatId}:messages`;
  const updateKey = `chat:${chatId}:messages:update`;

  const chatRef = useRef<ElementRef<"div">>(null);
  const bottomRef = useRef<ElementRef<"div">>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useChatQuery({
    queryKey,
    apiUrl,
    paramKey,
    paramValue,
  });

  const { isTyping } = useChatTyping({
    socketUrl,
    socketQuery,
  });

  useChatSocket({ queryKey, addKey, updateKey });

  const lastMessageIsFromCurrentUser = data?.pages?.[0]?.items?.[0]?.member?.id === member.id;

  const { hasNewMessages, scrollToBottom, isAtBottom } = useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
    lastMessageIsFromCurrentUser,
  });

  // Scroll to a specific message when triggered from pinned messages sidebar
  const { targetMessageId, clearTarget } = useScrollToMessage();

  useEffect(() => {
    if (!targetMessageId || !chatRef.current) return;

    const highlightAndScroll = (el: HTMLElement) => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-yellow-200/30", "dark:bg-yellow-500/10");
      setTimeout(() => {
        el.classList.remove("bg-yellow-200/30", "dark:bg-yellow-500/10");
      }, 2000);
      clearTarget();
    };

    const el = chatRef.current.querySelector(
      `[data-message-id="${targetMessageId}"]`
    ) as HTMLElement | null;

    if (el) {
      highlightAndScroll(el);
      return;
    }

    // Message not in DOM yet — load more pages until found
    if (!hasNextPage || isFetchingNextPage) return;

    fetchNextPage();

    // Watch for the element to appear after new pages load
    const observer = new MutationObserver(() => {
      if (!chatRef.current) return;
      const found = chatRef.current.querySelector(
        `[data-message-id="${targetMessageId}"]`
      ) as HTMLElement | null;
      if (found) {
        observer.disconnect();
        // Small delay to let layout settle
        setTimeout(() => highlightAndScroll(found), 100);
      }
    });

    observer.observe(chatRef.current, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [targetMessageId, clearTarget, data, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Loading messages...
        </p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Something went wrong!
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 relative flex flex-col min-h-0">
      <div ref={chatRef} className="flex-1 flex flex-col py-4 overflow-y-auto">
        {!hasNextPage && <div className="flex-1" />}
        {!hasNextPage && (
          <ChatWelcome
            type={type}
            name={name}
          />
        )}
        {hasNextPage && (
          <div className="flex justify-center">
            {isFetchingNextPage ? (
              <Loader2 className="h-6 w-6 text-zinc-500 animate-spin my-4" />
            ) : (
              <button
                onClick={() => fetchNextPage()}
                className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 text-xs my-4 dark:hover:text-zinc-300 transition"
              >
                Load previous messages
              </button>
            )}
          </div>
        )}
        <div className="flex flex-col-reverse mt-auto">
          {data?.pages?.map((group, i) => (
            <Fragment key={i}>
              {group.items.map((message: MessageWithMemberWithProfile) => (
                <ChatItem
                  key={message.id}
                  id={message.id}
                  currentMember={member}
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
              ))}
            </Fragment>
          ))}
        </div>
        {isTyping && (
          <div className="flex items-center px-4 py-2">
            <Loader2 className="h-4 w-4 text-zinc-500 animate-spin mr-2" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Bot is thinking...
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 right-6 h-10 w-10 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full flex items-center justify-center shadow-md border dark:border-zinc-700 transition z-10"
        >
          <ChevronsDown className="h-6 w-6" />
          {hasNewMessages && (
            <span
              className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-800"
              style={{ backgroundColor: "rgb(169, 90, 230)" }}
            />
          )}
        </button>
      )}
    </div>
  )
}
