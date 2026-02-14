import { redirect } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { currentProfile } from "@/lib/current-profile";
import prisma from "@/lib/db";

import { NavigationAction } from "./navigation-action";
import { NavigationItem } from "./navigation-item";
import { UserButton } from "@/components/user-button";

export const NavigationSidebar = async () => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/sign-in");
  }

  const servers = await prisma.server.findMany({
    where: {
      members: {
        some: {
          userId: profile.id,
        },
      },
    },
  });

  return (
    <div className="space-y-4 flex flex-col items-center h-full text-primary w-full bg-[#E3E5E8] dark:bg-[rgb(23,24,28)] py-3">
      <NavigationAction />
      <Separator className="h-0.5 bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto" />
      <ScrollArea className="flex-1 w-full">
        {servers.map((server) => (
          <div key={server.id} className="mb-4">
            <NavigationItem
              id={server.id}
              name={server.name}
              imageUrl={server.imageUrl}
            />
          </div>
        ))}
      </ScrollArea>
      <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
        <ModeToggle />
        <UserButton
          imageUrl={profile.imageUrl || undefined}
          name={profile.name}
        />
      </div>
    </div>
  );
};
