"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearStudentProfile, getStudentProfile } from "@/lib/auth";

interface SiteHeaderProps {
  activeHref?: string;
}

const NAV_LINKS = [
  { href: "/my-reports", label: "My Reports" },
  { href: "/reports", label: "Reports Overview" },
  { href: "/editor", label: "Map Layout Editor" },
];

export function SiteHeader({ activeHref }: SiteHeaderProps) {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync profile display name from localStorage, unavailable during SSR
    setName(getStudentProfile()?.name ?? null);
  }, []);

  function handleSwitchAccount() {
    clearStudentProfile();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Logo className="[&_span]:text-white" />
        <span className="hidden text-sm text-slate-400 sm:inline">
          See it. Pin it. Solve it.
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex flex-wrap gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: activeHref === link.href ? "default" : "outline" }),
                "border-slate-700 bg-transparent text-sm text-slate-200 hover:bg-slate-800",
                activeHref === link.href && "bg-white text-slate-900 hover:bg-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {name && (
          <button
            onClick={handleSwitchAccount}
            className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-200"
          >
            Signed in as {name} · Switch account
          </button>
        )}
      </div>
    </header>
  );
}
