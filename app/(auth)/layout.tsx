import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-actions";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#313338] relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 bg-cover bg-center opacity-10" />
      <div className="relative z-10 w-full max-w-md p-4">
        {children}
      </div>
    </div>
  );
}