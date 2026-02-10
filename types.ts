import { Server, Member, User } from "@/generated/prisma";
import { Server as SocketIoServer } from "socket.io";
import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";


export type ServerWithMembersWithUsers = Server & {
  members: (Member & {
    user: User;
  })[];
}

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIoServer;
    }
  }
}