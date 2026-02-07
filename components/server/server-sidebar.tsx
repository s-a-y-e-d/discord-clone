import { ChannelType, MemberRole } from "@/generated/prisma";
import { redirect } from "next/navigation";
import { Hash, Mic, ShieldAlert, ShieldCheck, Video } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/db";

import { ServerHeader } from "./server-header";

interface ServerSidebarProps {
  serverId: string;
}

export const ServerSidebar = async ({
  serverId
}: ServerSidebarProps) => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/");
  }

  const server = await prisma.server.findUnique({
    where: {
      id: serverId,
    },
    include: {
      channels: {
        orderBy: {
          createdAt: "asc",
        },
      },
      members: {
        include: {
          user: true,
        },
        orderBy: {
          role: "asc",
        }
      }
    }
  });

  if (!server) {
    return redirect("/");
  }

  const textChannels = server.channels.filter((channel) => channel.type === ChannelType.TEXT)
  const audioChannels = server.channels.filter((channel) => channel.type === ChannelType.AUDIO)
  const videoChannels = server.channels.filter((channel) => channel.type === ChannelType.VIDEO)
  const members = server.members.filter((member) => member.userId !== profile.id)

  const role = server.members.find((member) => member.userId === profile.id)?.role;

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]">
      <ServerHeader
        server={server}
        role={role}
      />
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          {/* Search Placeholder */}
        </div>
        <Separator className="bg-zinc-200 dark:bg-zinc-700 rounded-md my-2" />
        {!!textChannels?.length && (
          <div className="mb-2">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
              Text Channels
            </div>
            <div className="space-y-[2px]">
              {textChannels.map((channel) => (
                <div key={channel.id} className="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1">
                  <Hash className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <p className="line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition">
                    {channel.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {!!audioChannels?.length && (
          <div className="mb-2">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
              Audio Channels
            </div>
            <div className="space-y-[2px]">
              {audioChannels.map((channel) => (
                <div key={channel.id} className="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1">
                  <Mic className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <p className="line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition">
                    {channel.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {!!videoChannels?.length && (
          <div className="mb-2">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
              Video Channels
            </div>
            <div className="space-y-[2px]">
              {videoChannels.map((channel) => (
                <div key={channel.id} className="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1">
                  <Video className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <p className="line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition">
                    {channel.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {!!members?.length && (
          <div className="mb-2">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
              Members
            </div>
            <div className="space-y-[2px]">
              {members.map((member) => (
                <div key={member.id} className="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1">
                  {member.role === "GUEST" && null}
                  {member.role === "MODERATOR" && <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />}
                  {member.role === "ADMIN" && <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />}
                  <p className="line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition">
                    {member.user.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
