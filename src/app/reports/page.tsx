"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { usePins } from "@/lib/pins-context";
import { riskLabel, riskBadgeClass } from "@/lib/risk";
import { isShsBuildingLabel } from "@/lib/campus-layout";
import { cn } from "@/lib/utils";

const LEVELS = [1, 2, 3, "Fixed"] as const;

export default function ReportsOverviewPage() {
  const { pins } = usePins();
  const [activeLevel, setActiveLevel] = useState<(typeof LEVELS)[number] | null>(null);

  const approved = pins.filter((p) => p.status === "Approved");
  const visible = activeLevel ? approved.filter((p) => p.level === activeLevel) : approved;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 p-4 sm:p-8">
      <SiteHeader activeHref="/reports" />

      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Reports Overview</h1>
        <p className="text-sm text-slate-400">
          Every verified report on campus. Reporter details are kept private.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveLevel(null)}
          className={cn(
            "rounded-md border px-4 py-1.5 text-sm font-medium transition-colors",
            activeLevel === null
              ? "border-white bg-white text-slate-950"
              : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500"
          )}
        >
          All
        </button>
        {LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className={cn(
              "rounded-md border px-4 py-1.5 text-sm font-medium transition-colors",
              activeLevel === level
                ? "border-white bg-white text-slate-950"
                : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500"
            )}
          >
            {riskLabel[level]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          No reports here yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((pin) => (
            <Card key={pin.id} className="overflow-hidden border-slate-800 bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element -- source may be a data: URL */}
              <img
                src={pin.photoUrl}
                alt="Issue"
                className="h-40 w-full object-cover"
              />
              <CardContent className="space-y-2 pt-4">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
