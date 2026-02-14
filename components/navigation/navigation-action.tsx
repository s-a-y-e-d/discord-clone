"use client";

import { Plus } from "lucide-react";

import { ActionTooltip } from "@/components/action-tooltip";
import { useModal } from "@/hooks/use-modal-store";

export const NavigationAction = () => {
  const { onOpen } = useModal();

  return (
    <div>
      <ActionTooltip side="right" align="center" label="Add a server">
        <button
          className="group flex items-center"
          onClick={() => { onOpen('createServer') }}
        >
          <div className="flex mx-3 h-12 w-12 rounded-[24px] group-hover:rounded-3xl transition-all overflow-hidden items-center justify-center bg-zinc-200 dark:bg-zinc-700 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500 duration-300">
            <Plus
              className="group-hover:text-white transition-colors text-emerald-500 duration-300"
              size={25}
            />
          </div>
        </button>
      </ActionTooltip>
    </div>
  );
};
