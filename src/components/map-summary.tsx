"use client";

import { useState } from "react";
import { BarChart3, ChevronDown } from "lucide-react";
import type { Pin } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MapSummaryProps {
  pins: Pin[];
}

export function MapSummary({ pins }: MapSummaryProps) {
  const [open, setOpen] = useState(false);

  const approved = pins.filter((p) => p.status === "Approved");
  const counts = {
    3: approved.filter((p) => p.level === 3).length,
    2: approved.filter((p) => p.level === 2).length,
    1: approved.filter((p) => p.level === 1).length,
    Fixed: approved.filter((p) => p.level === "Fixed").length,
  };
  const pendingSync = pins.filter((p) => !p.synced).length;

  const rows = [
    { label: "Urgent", value: counts[3], dot: "bg-red-500" },
    { label: "Moderate", value: counts[2], dot: "bg-orange-500" },
    { label: "Low Risk", value: counts[1], dot: "bg-blue-500" },
    { label: "Fixed", value: counts.Fixed, dot: "bg-green-500" },
  ];

  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-20 w-56 max-w-[calc(100%-1.5rem)]">
      {open && (
        <div className="mb-2 space-y-1.5 rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 shadow-lg backdrop-blur">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between rounded-md bg-slate-800/60 px-2.5 py-1.5"
            >
              <span className="flex items-center gap-2 text-sm text-slate-200">
                <span className={cn("h-2.5 w-2.5 rounded-full", r.dot)} />
                {r.label}
              </span>
              <span className="text-sm font-bold text-white tabular-nums">{r.value}</span>
            </div>
          ))}
          {pendingSync > 0 && (
            <p className="px-1 pt-1 text-xs text-amber-400">
              {pendingSync} pending upload
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur"
      >
        <span className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-amber-400" />
          Report Summary
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "" : "rotate-180")} />
      </button>
    </div>
  );
}
