"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import UserAvatar from "./user-avatar";

interface UserButtonProps {
  imageUrl?: string;
  name: string;
}

export const UserButton = ({ imageUrl, name }: UserButtonProps) => {
  const router = useRouter();

  const onLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <UserAvatar
          src={imageUrl}
          name={name}
          className="h-[48px] w-[48px] hover:opacity-75 transition"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="right" className="w-56">
        <DropdownMenuItem
          onClick={onLogout}
          className="text-rose-500 cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
