"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ClipboardList, LayoutGrid, BarChart3 } from "lucide-react";
import { Logo } from "@/components/logo";
import { FeedbackButton } from "@/components/feedback-button";
import { getStudentProfile } from "@/lib/auth";
import type { Pin } from "@/lib/types";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/my-reports", label: "My Reports", icon: ClipboardList },
  { href: "/reports", label: "All Reports", icon: LayoutGrid },
];

// Left-side collapsible panel for the student map. A hamburger (top-left) opens
// a drawer that slides over the map; it holds the nav links, the Feedback
// button, the report summary, and Staff Login. Close via the X, the backdrop,
// or a nav link.
export function MapPanel({ pins }: { pins: Pin[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read localStorage after mount (unavailable during SSR)
    setName(getStudentProfile()?.name ?? null);
  }, []);

  const approved = pins.filter((p) => p.status === "Approved");
  const rows = [
    { label: "Urgent", value: approved.filter((p) => p.level === 3).length, dot: "bg-red-500" },
    { label: "Moderate", value: approved.filter((p) => p.level === 2).length, dot: "bg-orange-500" },
    { label: "Low Risk", value: approved.filter((p) => p.level === 1).length, dot: "bg-blue-500" },
    { label: "Fixed", value: approved.filter((p) => p.level === "Fixed").length, dot: "bg-green-500" },
  ];
  const pendingSync = pins.filter((p) => !p.synced).length;

  return (
    <>
      {/* Top-left bar: menu toggle + logo (always visible) */}
      <div className="pointer-events-auto absolute top-3 left-3 z-30 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/95 px-2 py-1.5 shadow-lg backdrop-blur">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-1.5 text-slate-200 hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo size="sm" className="[&_span]:text-white" />
      </div>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="pointer-events-auto absolute inset-0 z-30 bg-black/40"
          aria-hidden="true"
        />
      )}

      {/* Sliding drawer */}
      <div
        className={cn(
          "pointer-events-auto absolute inset-y-0 left-0 z-40 flex w-72 max-w-[85%] flex-col border-r border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <Logo size="sm" className="[&_span]:text-white" />
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          {name && (
            <div className="rounded-md bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
              Signed in as <span className="text-slate-200">{name}</span>
            </div>
          )}

          <nav className="space-y-1">
            {LINKS.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
            <div onClick={() => setOpen(false)}>
              <FeedbackButton
                role="student"
                className="w-full rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              />
            </div>
          </nav>

          <div>
            <p className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <BarChart3 className="h-4 w-4 text-amber-400" />
              Report Summary
            </p>
            <div className="space-y-1.5">
              {rows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between rounded-md bg-slate-800/60 px-3 py-1.5"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-200">
                    <span className={cn("h-2.5 w-2.5 rounded-full", r.dot)} />
                    {r.label}
                  </span>
                  <span className="text-sm font-bold text-white tabular-nums">{r.value}</span>
                </div>
              ))}
              {pendingSync > 0 && (
                <p className="px-1 pt-1 text-xs text-amber-400">{pendingSync} pending upload</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
