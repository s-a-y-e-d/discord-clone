import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { getSession } from "@/lib/auth-actions";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#313338] relative overflow-hidden dark:bg-[#313338] bg-white transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>
      {/* Abstract Background */}
      <div className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-10 opacity-5" />
      <div className="relative z-10 w-full max-w-md p-4">
        {children}
      </div>
    </div>
  );
}