import { useEffect, useState } from "react";

export const useOrigin = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

  if (!mounted) {
    return "";
  }

  return origin;
}
