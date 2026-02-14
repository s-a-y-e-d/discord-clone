"use client";

import { useSocket } from "@/components/providers/socket-provider";
import { Badge } from "@/components/ui/badge";

export const SocketIndicator = () => {
  const { isConnected } = useSocket();

  if (!isConnected) {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-600 text-white border-none pointer-events-none fixed top-5 left-1/2 -translate-x-1/2 z-[50]"
      >
        Fallback: Polling every 1s
      </Badge>
    )
  }

  return null;
}
