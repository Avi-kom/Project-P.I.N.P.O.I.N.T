"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, ClipboardList, LayoutGrid, ShieldCheck, User } from "lucide-react";
import { Logo } from "@/components/logo";
import { FeedbackButton } from "@/components/feedback-button";
import { getStudentProfile } from "@/lib/auth";

interface NavLink {
  href: string;
  label: string;
  icon: typeof ClipboardList;
}

const LINKS: NavLink[] = [
  { href: "/my-reports", label: "My Reports", icon: ClipboardList },
  { href: "/reports", label: "All Reports", icon: LayoutGrid },
];

export function MapNav() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync profile name from localStorage, unavailable during SSR
    setName(getStudentProfile()?.name ?? null);
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <>
      {/* Logo — top left */}
      <div className="pointer-events-auto absolute top-3 left-3 z-30 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 shadow-lg backdrop-blur">
        <Logo size="sm" className="[&_span]:text-white" />
      </div>

      {/* Menu — top right */}
      <div ref={menuRef} className="pointer-events-auto absolute top-3 right-3 z-30">
        {/* Desktop inline links */}
        <div className="hidden items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/95 p-1 shadow-lg backdrop-blur sm:flex">
          {LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                <Icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
          <FeedbackButton
            role="student"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
          />
          {name && (
            <span className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-400">
              <User className="h-4 w-4" />
              {name}
            </span>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 text-slate-200 shadow-lg backdrop-blur sm:hidden"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Mobile dropdown */}
        {open && (
          <div className="absolute top-full right-0 mt-2 w-52 overflow-hidden rounded-lg border border-slate-700 bg-slate-900/98 shadow-xl backdrop-blur sm:hidden">
            {name && (
              <div className="border-b border-slate-800 px-3 py-2 text-xs text-slate-400">
                Signed in as <span className="text-slate-200">{name}</span>
              </div>
            )}
            {LINKS.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
            <div onClick={() => setOpen(false)}>
              <FeedbackButton
                role="student"
                className="w-full px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
              />
            </div>
            <Link
              href="/admin/login"
              className="flex items-center gap-2 border-t border-slate-800 px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800"
            >
              <ShieldCheck className="h-4 w-4" />
              Staff Login
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
