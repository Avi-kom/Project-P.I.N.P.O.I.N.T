"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map,
  MapPinned,
  SquarePen,
  MessageSquare,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { isAdminAuthed, setAdminAuthed } from "@/lib/admin-auth";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/map", label: "Campus Map", icon: MapPinned },
  { href: "/admin/verify", label: "Verify Reports", icon: ListChecks },
  { href: "/admin/editor", label: "Map Editor", icon: SquarePen },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const isMapPage = pathname === "/admin/map";

  useEffect(() => {
    // Staff sign in through the normal entry page now (email + PIN), so an
    // unauthenticated visit to any /admin route goes back there.
    if (!isAdminAuthed()) {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gate render on sessionStorage auth check, unavailable during SSR
    setChecked(true);
  }, [router, pathname]);

  // close the mobile drawer whenever the route changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync drawer visibility to route change
    setMobileOpen(false);
  }, [pathname]);

  if (!checked) return null;

  function handleSignOut() {
    setAdminAuthed(false);
    router.push("/");
  }

  return (
    <div className="relative flex h-full">
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-1 overflow-y-auto border-r border-amber-500/20 bg-[#0a1128] p-4 text-white transition-transform duration-200",
          "lg:static lg:z-auto lg:translate-x-0 lg:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          desktopCollapsed ? "lg:hidden" : "lg:flex lg:w-60"
        )}
      >
        <div className="mb-8 flex items-center gap-2 px-2">
          <Logo size="sm" iconOnly />
          <span className="text-sm font-bold tracking-wide text-amber-400">ADMIN</span>
        </div>
        <nav className="flex flex-1 flex-col space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-amber-500/20 pt-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <Map className="h-4 w-4" />
            Student View
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-amber-500/20 bg-[#0a1128] px-3 text-white">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-slate-200 hover:bg-white/5 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => setDesktopCollapsed((c) => !c)}
            className="hidden rounded-md p-2 text-slate-200 hover:bg-white/5 lg:inline-flex"
            aria-label={desktopCollapsed ? "Open panel" : "Close panel"}
          >
            {desktopCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
          <span className="text-sm font-semibold tracking-wide text-amber-400">
            Admin Panel
          </span>
        </header>

        <div
          className={cn(
            "min-h-0 flex-1 bg-[#0d152f]",
            isMapPage ? "overflow-hidden" : "overflow-y-auto p-4 sm:p-8"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
