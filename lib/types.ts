import { Server, Member, User } from "@/generated/prisma";

export type ServerWithMembersWithProfiles = Server & {
  members: (Member & { user: User })[];
};
