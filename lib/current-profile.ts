import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

export const currentProfile = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const profile = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  return profile;
};
