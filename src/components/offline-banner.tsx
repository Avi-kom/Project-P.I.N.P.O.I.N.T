"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { usePins } from "@/lib/pins-context";

export function OfflineBanner() {
  const { isOnline, pendingSyncCount } = usePins();

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div
      className={
        isOnline
          ? "flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900"
          : "flex items-center justify-center gap-2 bg-slate-800 px-4 py-2 text-sm font-medium text-white"
      }
    >
      {isOnline ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Syncing {pendingSyncCount} saved report{pendingSyncCount === 1 ? "" : "s"} to the
          cloud...
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4" />
          You&apos;re offline. Reports are saved on this device and will upload automatically
          once you&apos;re back online.
          {pendingSyncCount > 0 && ` (${pendingSyncCount} pending)`}
        </>
      )}
    </div>
  );
}
