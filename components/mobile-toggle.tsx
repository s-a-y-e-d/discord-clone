"use client";

import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";


export const MobileToggle = ({
  navigationSidebar,
  serverSidebar,
}: {
  navigationSidebar: React.ReactNode;
  serverSidebar: React.ReactNode;
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 flex gap-0">
        <div className="w-[72px]">
          {navigationSidebar}
        </div>
        {serverSidebar}
      </SheetContent>
    </Sheet>
  )
}
