import { NextApiRequest } from "next";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

export const currentProfilePages = async (req: NextApiRequest) => {
  const session = await auth.api.getSession({
    headers: req.headers as HeadersInit,
  });

  if (!session?.user?.id) {
    return null;
  }

  const profile = await db.user.findUnique({
    where: {
      id: session.user.id,
    }
  });

  return profile;
}
