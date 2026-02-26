"use client";

import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Member, MemberRole, User, Reaction } from "@/generated/prisma";
import { Edit, FileIcon, ShieldAlert, ShieldCheck, Trash, SmilePlus, Reply, Pin, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import UserAvatar from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { EmojiPicker } from "@/components/emoji-picker";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { useReplyStore } from "@/hooks/use-reply-store";

interface ChatItemProps {
  id: string;
  content: string;
  member: Member & {
    user: User;
  };
  timestamp: string;
  fileUrl: string | null;
  deleted: boolean;
  currentMember: Member;
  isUpdated: boolean;
  socketUrl: string;
  socketQuery: Record<string, string>;
  isPinned: boolean;
  reactions?: (Reaction & {
    member: Member & {
      user: User
    }
  })[];
};

const roleIconMap = {
  "GUEST": null,
  "MODERATOR": <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  "ADMIN": <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
}

const formSchema = z.object({
  content: z.string().min(1),
});

export const ChatItem = ({
  id,
  content,
  member,
  timestamp,
  fileUrl,
  deleted,
  currentMember,
  isUpdated,
  socketUrl,
  socketQuery,
  isPinned,
  reactions = [],
}: ChatItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const { onOpen } = useModal();
  const setReplyingTo = useReplyStore((state) => state.setReplyingTo);
  const params = useParams();
  const router = useRouter();

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  const onClickMessage = (e: React.MouseEvent) => {
    if (window.innerWidth <= 768) {
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
    }
  };

  const onCopyText = () => {
    navigator.clipboard.writeText(content);
    setMenuOpen(false);
  };

  const onMemberClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (member.id === currentMember.id) {
      return;
    }

    router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.keyCode === 27) {
        setIsEditing(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  let isReply = false;
  let replyName = "";
  let replyContent = "";
  let rawReplyContent = "";
  let mainContent = content;

  // Pattern: matches our chat-input template `> **Name**: Content\n\nActualMessage`
  const replyMatch = content.match(/^> \*\*([^*<]+)\*\*: ([\s\S]*?)\n\n([\s\S]*)$/);
  if (replyMatch) {
    isReply = true;
    replyName = replyMatch[1];
    rawReplyContent = replyMatch[2];
    replyContent = rawReplyContent.replace(/\n> ?/g, '\n');
    mainContent = replyMatch[3];
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: mainContent,
    }
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });

      const finalContent = isReply
        ? `> **${replyName}**: ${rawReplyContent}\n\n${values.content}`
        : values.content;

      await axios.patch(url, { content: finalContent });

      form.reset();
      setIsEditing(false);
    } catch (error) {
      console.log(error);
    }
  }

  const onPinToggle = async () => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });

      await axios.patch(url, { isPinned: !isPinned });
      setMenuOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  const onReactionToggle = async (emoji: string) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });

      await axios.patch(url, { emoji });
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    form.reset({
      content: mainContent,
    })
  }, [mainContent, form]);

  const fileType = fileUrl?.split(".").pop()?.toLowerCase();
  const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];

  const isAdmin = currentMember.role === MemberRole.ADMIN;
  const isModerator = currentMember.role === MemberRole.MODERATOR;
  const isOwner = currentMember.id === member.id;
  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
  const canEditMessage = !deleted && isOwner && !fileUrl;
  const isPDF = fileUrl && (fileType === "pdf" || content?.toLowerCase().endsWith(".pdf"));
  const isKnownImage = fileUrl && !isPDF && (imageExtensions.includes(fileType || "") || imageExtensions.some(ext => content?.toLowerCase().endsWith(`.${ext}`)));

  // For unknown file types (no extension), attempt to render as image with fallback
  const [imgFailed, setImgFailed] = useState(false);
  const shouldTryAsImage = fileUrl && !isPDF && !isKnownImage && !imgFailed;
  const showAsImage = isKnownImage || shouldTryAsImage;
  const showAsFile = fileUrl && !isPDF && !showAsImage;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof reactions>);

  return (
    <div
      data-message-id={id}
      onContextMenu={onContextMenu}
      onClick={onClickMessage}
      className="relative group flex flex-col items-start hover:bg-black/5 p-4 transition w-full min-w-0"
    >
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <div className="fixed" style={{ left: menuPos.x, top: menuPos.y, width: 0, height: 0 }} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="bg-transparent border-none shadow-none p-0 overflow-visible min-w-0 w-auto"
          sideOffset={8}
        >
          <div className="flex flex-col items-center">
            <div className="flex items-center px-1.5 py-1.5 mb-2 bg-white/70 dark:bg-[rgb(40,40,45)] backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 shadow-md rounded-full w-max">
              {["❤️", "👍", "😆", "😢", "🔥", "😲"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReactionToggle(emoji);
                    setMenuOpen(false);
                  }}
                  className="hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 w-9 h-9 rounded-full transition text-lg flex items-center justify-center shrink-0 leading-none cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
              <div className="h-6 w-[1px] bg-zinc-300 dark:bg-zinc-700 mx-1.5 shrink-0" />
              <EmojiPicker onChange={(emoji) => {
                onReactionToggle(emoji);
                setMenuOpen(false);
              }}>
                <button type="button" className="hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 w-9 h-9 rounded-full transition flex items-center justify-center shrink-0 cursor-pointer">
                  <SmilePlus className="w-5 h-5 text-zinc-500" />
                </button>
              </EmojiPicker>
            </div>
            <div className="bg-[rgb(40,40,45)] border shadow-md rounded-md p-1 flex flex-col w-56 text-white">
              <DropdownMenuItem onClick={() => { setReplyingTo({ name: member.user.name, content }); setMenuOpen(false); }} className="cursor-pointer font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700">
                <Reply className="w-4 h-4 mr-2" />
                Reply
              </DropdownMenuItem>
              {canEditMessage && (
                <DropdownMenuItem
                  onClick={() => {
                    setIsEditing(true);
                    setMenuOpen(false);
                  }}
                  className="cursor-pointer font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDeleteMessage && (
                <DropdownMenuItem onClick={onPinToggle} className="cursor-pointer font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700">
                  <Pin className="w-4 h-4 mr-2" />
                  {isPinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onCopyText} className="cursor-pointer font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700">
                <Copy className="w-4 h-4 mr-2" />
                Copy Text
              </DropdownMenuItem>
              {canDeleteMessage && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-700" />
                  <DropdownMenuItem
                    onClick={() => {
                      onOpen("deleteMessage", {
                        apiUrl: `${socketUrl}/${id}`,
                        query: socketQuery,
                      });
                      setMenuOpen(false);
                    }}
                    className="text-rose-500 focus:text-rose-500 cursor-pointer font-medium hover:bg-rose-500/10 dark:hover:bg-rose-500/10"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {isReply && (
        <div className="flex items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1 relative w-full pl-[48px] pr-4">
          <div className="absolute left-[18px] top-[calc(50%-1px)] w-[26px] h-[24px] border-l-2 border-t-2 border-zinc-400 dark:border-zinc-500 rounded-tl-md" />
          <span className="font-semibold text-zinc-600 dark:text-zinc-300 hover:underline cursor-pointer flex-shrink-0">
            @{replyName}
          </span>
          <span className="truncate min-w-0">
            {replyContent}
          </span>
        </div>
      )}
      <div className="group flex gap-x-2 items-start w-full min-w-0">
        <div onClick={onMemberClick} className="cursor-pointer hover:drop-shadow-md transition">
          <UserAvatar
            src={member.user.imageUrl || member.user.image || undefined}
            name={member.user.name}
          />
        </div>
        <div className="flex flex-col w-full min-w-0">
          <div className="flex items-center gap-x-2">
            <div className="flex items-center">
              <p onClick={onMemberClick} className="font-semibold text-sm hover:underline cursor-pointer">
                {member.user.name}
              </p>
              <ActionTooltip label={member.role}>
                {roleIconMap[member.role]}
              </ActionTooltip>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timestamp}
            </span>
            {isPinned && (
              <ActionTooltip label="Pinned">
                <Pin className="h-4 w-4 ml-2 fill-zinc-500 text-zinc-500" />
              </ActionTooltip>
            )}
          </div>
          {showAsImage && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-md mt-2 overflow-hidden border border-primary flex items-center bg-secondary h-48 w-48"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={content}
                onError={() => setImgFailed(true)}
                className="object-cover w-full h-full"
              />
            </a>
          )}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-primary/10 max-w-full overflow-hidden">
              <FileIcon className="h-10 w-10 fill-primary/20 stroke-primary flex-shrink-0" />
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-primary hover:underline break-all min-w-0"
              >
                PDF File
              </a>
            </div>
          )}
          {showAsFile && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-primary/10 max-w-full overflow-hidden">
              <FileIcon className="h-10 w-10 fill-primary/20 stroke-primary flex-shrink-0" />
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-primary hover:underline break-all min-w-0"
              >
                {content || "Attached File"}
              </a>
            </div>
          )}
          {!fileUrl && !isEditing && (
            <div className={cn(
              "text-sm text-zinc-600 dark:text-zinc-300",
              deleted && "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1"
            )}>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ node: _node, ...props }) => <p className="mb-1" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                  a: ({ node: _node, ...props }) => <a className="text-indigo-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                  code: ({ node: _node, ...props }) => <code className="bg-zinc-200 dark:bg-zinc-700 rounded px-1" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                  // Add more custom components as needed for styling
                }}
              >
                {mainContent}
              </ReactMarkdown>
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                  (edited)
                </span>
              )}
            </div>
          )}
          {!fileUrl && isEditing && (
            <Form {...form}>
              <form
                className="flex items-center w-full gap-x-2 pt-2"
                onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            disabled={isLoading}
                            className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                            placeholder="Edited message"
                            {...field}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button disabled={isLoading} size="sm" variant="default">
                  Save
                </Button>
              </form>
              <span className="text-[10px] mt-1 text-zinc-400">
                Press escape to cancel, enter to save
              </span>
            </Form>
          )}

          {Object.keys(groupedReactions).length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {Object.entries(groupedReactions).map(([emoji, rList]) => {
                const hasReacted = rList.some(r => r.memberId === currentMember.id);
                return (
                  <button
                    key={emoji}
                    onClick={() => onReactionToggle(emoji)}
                    className={cn(
                      "flex items-center gap-x-1 px-1.5 py-0.5 rounded-md text-xs border bg-secondary/50 hover:bg-secondary/80 transition",
                      hasReacted ? "border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20" : "border-zinc-300 dark:border-zinc-700"
                    )}
                  >
                    <span>{emoji}</span>
                    <span className={cn("font-medium", hasReacted ? "text-indigo-500" : "text-zinc-500")}>
                      {rList.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

