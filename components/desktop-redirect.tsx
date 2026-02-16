"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client component that redirects to a URL only on desktop (md+) screens.
 * On mobile, it renders nothing and lets the parent show the sidebar.
 */
export const DesktopRedirect = ({
  url,
}: {
  url: string;
}) => {
  const router = useRouter();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    if (mediaQuery.matches) {
      router.replace(url);
    }

    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        router.replace(url);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [url, router]);

  return null;
};
