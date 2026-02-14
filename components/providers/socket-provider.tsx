"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import { io as ClientIO } from "socket.io-client";

type SocketContextType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket: any | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const [socket, setSocket] = useState(() => {
    return ClientIO(process.env.NEXT_PUBLIC_SITE_URL!, {
      path: "/api/socket/io",
      addTrailingSlash: false,
    });
  });

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}
