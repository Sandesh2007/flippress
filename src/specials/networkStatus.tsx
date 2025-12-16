"use client";

import { useEffect, useRef } from "react";
import { toastify } from "@/components/common/toastify";

export function NetworkStatus() {
  const offlineToastIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      // Dismiss the offline toast if it's still visible
      if (offlineToastIdRef.current) {
        toastify.dismiss(offlineToastIdRef.current);
        offlineToastIdRef.current = null;
      }

      // Show online restored toast
      toastify.success("Your internet connection was restored", {
        duration: 3000,
        position: "bottom-left",
        message: "Your internet connection was restored"
      });
    };

    const handleOffline = () => {
      const toastId = toastify.error("You are currently offline", {
        duration: Infinity,
        position: "bottom-left",
        message: "You are currently offline"
      });
      offlineToastIdRef.current = toastId;
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Show initial status if offline
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
