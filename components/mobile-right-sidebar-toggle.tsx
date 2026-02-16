"use client";

import { PanelRight } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const MobileRightSidebarToggle = ({
  rightSidebar,
}: {
  rightSidebar: React.ReactNode;
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <PanelRight className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-80">
        <VisuallyHidden>
          <SheetTitle>Sidebar</SheetTitle>
        </VisuallyHidden>
        {rightSidebar}
      </SheetContent>
    </Sheet>
  );
};
