"use client";

import { useEffect, useState } from "react";
import { Clock, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { usePins } from "@/lib/pins-context";
import { riskLabel, riskBadgeClass } from "@/lib/risk";
import { isShsBuildingLabel } from "@/lib/campus-layout";
import { getStudentProfile } from "@/lib/auth";
import type { PinStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  PinStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  Pending: {
    label: "Pending verification",
    className: "bg-amber-950/60 text-amber-300 border-amber-700/50",
    icon: Clock,
  },
  Approved: {
    label: "Approved",
    className: "bg-green-950/60 text-green-300 border-green-700/50",
    icon: Check,
  },
  Rejected: {
    label: "Rejected",
    className: "bg-red-950/60 text-red-300 border-red-700/50",
    icon: X,
  },
};

export default function MyReportsPage() {
  const { pins } = usePins();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync profile email from localStorage, unavailable during SSR
    setEmail(getStudentProfile()?.email ?? null);
    setReady(true);
  }, []);

  const myReports = email ? pins.filter((p) => p.reporterEmail === email) : [];
  const pendingCount = myReports.filter((p) => p.status === "Pending").length;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 p-4 sm:p-8">
      <SiteHeader activeHref="/my-reports" />

      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">My Reports</h1>
        <p className="text-sm text-slate-400">
          Every issue you&apos;ve submitted, and whether it&apos;s been verified yet.
        </p>
      </div>

      {!ready ? null : !email ? (
        <p className="rounded-md border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          Sign in to see your reports.
        </p>
      ) : myReports.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          You haven&apos;t submitted any reports yet. Tap a spot on the Campus Map to report
          an issue.
        </p>
      ) : (
        <>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-amber-700/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-300">
              <Clock className="h-4 w-4 shrink-0" />
              {pendingCount} report{pendingCount === 1 ? "" : "s"} uploaded and waiting for
              staff to verify.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myReports.map((pin) => {
              const meta = STATUS_META[pin.status];
              const StatusIcon = meta.icon;
              return (
                <Card key={pin.id} className="overflow-hidden border-slate-800 bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element -- source may be a data: URL */}
                  <img
                    src={pin.photoUrl}
                    alt="Issue"
                    className="h-40 w-full object-cover"
                  />
                  <CardContent className="space-y-2 pt-4">
                    <div
                      className={cn(
                        "flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                        meta.className
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {meta.label}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={riskBadgeClass[pin.level]}>
                        {riskLabel[pin.level]}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {pin.building}
                        {isShsBuildingLabel(pin.building) ? ` — Floor ${pin.floorId}` : ""}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200">{pin.description}</p>
                    {!pin.synced && (
                      <p className="text-xs font-medium text-amber-500">
                        Saved on this device — pending upload
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
