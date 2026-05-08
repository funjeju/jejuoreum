"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline  = () => setOffline(false);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online",  onOnline);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online",  onOnline);
    };
  }, []);

  return (
    <div className={cn(
      "fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2",
      "bg-destructive text-white text-xs font-medium py-2 px-4 transition-transform duration-300",
      offline ? "translate-y-0" : "-translate-y-full"
    )}>
      <WifiOff size={13} />
      오프라인 상태입니다. 일부 기능이 제한될 수 있어요.
    </div>
  );
}
