"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ListChecks, LogOut, Map } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { isAdminAuthed, setAdminAuthed } from "@/lib/admin-auth";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/verify", label: "Verify Reports", icon: ListChecks },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- gate render on sessionStorage auth check, unavailable during SSR
      setChecked(true);
      return;
    }
    if (!isAdminAuthed()) {
      router.replace("/admin/login");
      return;
    }
    setChecked(true);
  }, [isLoginPage, router, pathname]);

  if (isLoginPage) return <>{children}</>;
  if (!checked) return null;

  function handleSignOut() {
    setAdminAuthed(false);
    router.push("/admin/login");
  }

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-3 border-b border-amber-500/20 bg-[#0a1128] p-3 text-white lg:w-60 lg:gap-0 lg:border-r lg:border-b-0 lg:p-4">
        <div className="flex items-center gap-2 px-2 lg:mb-8">
          <Logo size="sm" iconOnly />
          <span className="text-sm font-bold tracking-wide text-amber-400">ADMIN</span>
        </div>
        <nav className="flex flex-wrap gap-1 lg:flex-1 lg:flex-col lg:space-y-1 lg:gap-0">
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
        <div className="flex flex-wrap gap-1 border-t-0 pt-0 lg:space-y-1 lg:border-t lg:border-amber-500/20 lg:pt-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <Map className="h-4 w-4" />
            Campus Map
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white lg:w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-[#0d152f] p-4 sm:p-8">{children}</main>
    </div>
  );
}
