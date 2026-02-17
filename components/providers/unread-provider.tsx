"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { useParams } from "next/navigation";

type UnreadCounts = {
  channels: Record<string, number>;
  members: Record<string, number>;
};

type UnreadContextType = {
  unreadCounts: UnreadCounts;
  markChannelAsRead: (channelId: string) => void;
  markConversationAsRead: (memberId: string, conversationId?: string) => void;
};

const UnreadContext = createContext<UnreadContextType>({
  unreadCounts: { channels: {}, members: {} },
  markChannelAsRead: () => { },
  markConversationAsRead: () => { },
});

export const useUnreadCounts = () => useContext(UnreadContext);

export const UnreadProvider = ({
  children,
  serverId,
  currentMemberId,
  initialCounts,
}: {
  children: React.ReactNode;
  serverId: string;
  currentMemberId: string;
  initialCounts: UnreadCounts;
}) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>(initialCounts);
  const { socket } = useSocket();
  const params = useParams();
  const activeChannelId = params?.channelId as string | undefined;
  const activeMemberId = params?.memberId as string | undefined;
  // Keep refs for active IDs to avoid stale closures in socket listeners
  const activeChannelIdRef = useRef(activeChannelId);
  const activeMemberIdRef = useRef(activeMemberId);

  useEffect(() => {
    activeChannelIdRef.current = activeChannelId;
  }, [activeChannelId]);

  useEffect(() => {
    activeMemberIdRef.current = activeMemberId;
  }, [activeMemberId]);

  // Listen for new activity events from socket
  useEffect(() => {
    if (!socket) return;

    const activityKey = `server:${serverId}:new-activity`;

    const handleNewActivity = (data: {
      channelId?: string;
      senderMemberId?: string;
      memberId?: string;
      otherMemberId?: string;
      conversationId?: string;
    }) => {
      // Channel message activity
      if (data.channelId) {
        // Ignore own messages
        if (data.senderMemberId === currentMemberId) return;
        // Don't increment if user is currently viewing this channel
        if (activeChannelIdRef.current === data.channelId) return;

        setUnreadCounts((prev) => ({
          ...prev,
          channels: {
            ...prev.channels,
            [data.channelId!]: (prev.channels[data.channelId!] || 0) + 1,
          },
        }));
      }

      // DM activity
      if (data.conversationId && data.memberId && data.otherMemberId) {
        // Only show badge if WE are the recipient (otherMemberId)
        if (data.otherMemberId !== currentMemberId) return;
        // The sender's memberId is data.memberId — show badge on their entry
        const senderMemberId = data.memberId;
        // Don't increment if actively viewing conversation with this member
        if (activeMemberIdRef.current === senderMemberId) return;

        setUnreadCounts((prev) => ({
          ...prev,
          members: {
            ...prev.members,
            [senderMemberId]: (prev.members[senderMemberId] || 0) + 1,
          },
        }));
      }
    };

    socket.on(activityKey, handleNewActivity);

    return () => {
      socket.off(activityKey, handleNewActivity);
    };
  }, [socket, serverId, currentMemberId]);

  const markChannelAsRead = useCallback(
    (channelId: string) => {
      setUnreadCounts((prev) => {
        if (!prev.channels[channelId]) return prev;
        const newChannels = { ...prev.channels };
        delete newChannels[channelId];
        return { ...prev, channels: newChannels };
      });

      // Fire and forget - update server
      fetch("/api/read-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      }).catch(console.error);
    },
    []
  );

  const markConversationAsRead = useCallback(
    (memberId: string, conversationId?: string) => {
      setUnreadCounts((prev) => {
        if (!prev.members[memberId]) return prev;
        const newMembers = { ...prev.members };
        delete newMembers[memberId];
        return { ...prev, members: newMembers };
      });

      if (conversationId) {
        fetch("/api/read-status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        }).catch(console.error);
      }
    },
    []
  );

  return (
    <UnreadContext.Provider
      value={{ unreadCounts, markChannelAsRead, markConversationAsRead }}
    >
      {children}
    </UnreadContext.Provider>
  );
};
