"use client";

import { useEffect } from "react";

export const AutoRefreshProvider = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
