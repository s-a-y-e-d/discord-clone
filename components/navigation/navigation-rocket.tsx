"use client";

import { Rocket } from "lucide-react";

import { ActionTooltip } from "@/components/action-tooltip";

export const NavigationRocket = () => {
  return (
    <div>
      <ActionTooltip side="right" align="center" label="Discover">
        <button
          className="group flex items-center"
        >
          <div className="flex mx-3 h-12 w-12 rounded-[24px] group-hover:rounded-3xl transition-all overflow-hidden items-center justify-center bg-zinc-200 dark:bg-zinc-700 group-hover:bg-[#a95ae6] dark:group-hover:bg-[#a95ae6] group-hover:shadow-[0_0_15px_#a95ae6] duration-300">
            <Rocket
              className="group-hover:text-white transition-colors text-[#a95ae6] duration-300"
              size={25}
            />
          </div>
        </button>
      </ActionTooltip>
    </div>
  );
};
