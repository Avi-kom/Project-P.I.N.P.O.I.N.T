"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePins } from "@/lib/pins-context";
import { riskLabel, riskBadgeClass } from "@/lib/risk";
import { isShsBuildingLabel } from "@/lib/campus-layout";

const LEVELS = [1, 2, 3] as const;

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default function AdminOverviewPage() {
  const { pins, removePin } = usePins();
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3 | null>(null);

  function handleDelete(id: string) {
    if (window.confirm("Delete this report? This can't be undone.")) removePin(id);
  }

  const pending = pins.filter((p) => p.status === "Pending").length;
  const approved = pins.filter((p) => p.status === "Approved").length;
  const rejected = pins.filter((p) => p.status === "Rejected").length;
  const urgent = pins.filter((p) => p.status === "Approved" && p.level === 3).length;

  const stats = [
    { label: "Total Reports", value: pins.length, className: "text-white" },
    { label: "Pending Review", value: pending, className: "text-orange-400" },
    { label: "Approved", value: approved, className: "text-green-400" },
    { label: "Urgent (Level 3)", value: urgent, className: "text-red-400" },
    { label: "Rejected", value: rejected, className: "text-slate-400" },
  ];

  const levelReports = activeLevel ? pins.filter((p) => p.level === activeLevel) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-sm text-slate-400">Campus-wide facility report summary.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-800 bg-[#0d152f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${stat.className}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {pending > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm text-amber-300">
              {pending} report{pending === 1 ? "" : "s"} waiting for review.
            </p>
            <a
              href="/admin/verify"
              className="text-sm font-medium text-amber-400 underline underline-offset-2"
            >
              Review now
            </a>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-white">Browse by Risk Level</h2>
          <p className="text-sm text-slate-400">
            Tap a level to see every report at that risk, with reporter details.
          </p>
        </div>
        <div className="flex gap-2">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(activeLevel === level ? null : level)}
              className={cn(
                "rounded-md border px-4 py-1.5 text-sm font-medium transition-colors",
                activeLevel === level
                  ? "border-amber-500 bg-amber-500 text-slate-950"
                  : "border-slate-700 bg-[#0d152f] text-slate-200 hover:border-amber-500/50"
              )}
            >
              {riskLabel[level]}
            </button>
          ))}
        </div>

        {activeLevel && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levelReports.length === 0 ? (
              <p className="col-span-full rounded-md border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                No reports at {riskLabel[activeLevel]}.
              </p>
            ) : (
              levelReports.map((pin) => (
                <Card key={pin.id} className="overflow-hidden border-slate-800 bg-[#0d152f]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- source may be a data: URL */}
                  <img
                    src={pin.photoUrl}
                    alt="Issue"
                    className="h-40 w-full object-cover"
                  />
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={riskBadgeClass[pin.level]}>
                        {pin.status}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {pin.building}
                        {isShsBuildingLabel(pin.building) ? ` — Floor ${pin.floorId}` : ""}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200">{pin.description}</p>
                    {pin.exactLocation && (
                      <p className="text-xs text-slate-400">
                        <span className="text-slate-500">Exact spot: </span>
                        {pin.exactLocation}
                      </p>
                    )}
                    <div className="border-t border-slate-800 pt-2 text-xs text-slate-400">
                      <p className="font-medium text-slate-300">{pin.reporterName}</p>
                      <p>{pin.reporterSection}</p>
                      <p className="truncate">{pin.reporterEmail}</p>
                      {formatDate(pin.createdAt) && (
                        <p className="mt-1 text-slate-500">
                          Submitted {formatDate(pin.createdAt)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(pin.id)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
