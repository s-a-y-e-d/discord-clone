import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";

type ChatTypingProps = {
  socketUrl: string;
  socketQuery: Record<string, string>;
}

export const useChatTyping = ({
  socketQuery
}: ChatTypingProps) => {
  const { socket } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const [typingMemberId, setTypingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const channelId = socketQuery.channelId;
    const typingKey = `chat:${channelId}:typing`;

    console.log("[DEBUG] useChatTyping mounted", { channelId, typingKey, socketConnected: socket.connected });

    // Debug all events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyListener = (event: string, ...args: any[]) => {
      console.log(`[DEBUG] Socket Event Received: ${event}`, args);
    };
    socket.onAny(anyListener);

    socket.on(typingKey, (data: { memberId: string; isTyping: boolean }) => {
      console.log("[DEBUG] Received typing event SPECIFIC:", typingKey, data);
      setTypingMemberId(data.memberId);
      setIsTyping(data.isTyping);
    });

    return () => {
      socket.offAny(anyListener);
      socket.off(typingKey);
    }
  }, [socket, socketQuery]);

  return { isTyping, typingMemberId };
}
