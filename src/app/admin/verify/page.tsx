"use client";

import { Check, X, Trash2 } from "lucide-react";
import { usePins } from "@/lib/pins-context";
import { riskLabel, riskBadgeClass } from "@/lib/risk";
import { isShsBuildingLabel } from "@/lib/campus-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pin } from "@/lib/types";

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default function VerifyReportsPage() {
  const { pins, setPinStatus, removePin } = usePins();
  const pendingPins = pins.filter((p) => p.status === "Pending");

  function handleDelete(id: string) {
    if (window.confirm("Delete this report? This can't be undone.")) removePin(id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Verify Reports</h1>
        <p className="text-sm text-slate-400">
          Review and approve student-submitted reports.
        </p>
      </div>

      {pendingPins.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-700 bg-[#0d152f] p-8 text-center text-sm text-slate-400">
          No pending reports. All caught up.
        </p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="grid gap-3 md:hidden">
            {pendingPins.map((pin) => (
              <VerifyCard
                key={pin.id}
                pin={pin}
                setPinStatus={setPinStatus}
                onDelete={() => handleDelete(pin.id)}
              />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden rounded-lg border border-slate-800 bg-[#0d152f] p-4 md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="w-32">Photo</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-44">Reporter</TableHead>
                    <TableHead className="w-44">Location</TableHead>
                    <TableHead className="w-40">Risk Level</TableHead>
                    <TableHead className="w-24">Floor</TableHead>
                    <TableHead className="w-40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPins.map((pin) => (
                    <TableRow key={pin.id} className="border-slate-800">
                      <TableCell>
                        {/* eslint-disable-next-line @next/next/no-img-element -- source may be a data: URL */}
                        <img
                          src={pin.photoUrl}
                          alt="Issue"
                          className="h-[72px] w-24 rounded-md border border-slate-700 object-cover"
                        />
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-slate-200">
                        {pin.description}
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">
                        <p className="font-medium">{pin.reporterName}</p>
                        <p className="text-xs text-slate-500">{pin.reporterSection}</p>
                        <p className="text-xs text-slate-500">{pin.reporterEmail}</p>
                        {pin.deviceId && (
                          <p className="font-mono text-[11px] text-slate-500">
                            Device {pin.deviceId.slice(0, 8)}
                          </p>
                        )}
                        {formatDate(pin.createdAt) && (
                          <p className="mt-1 text-xs text-slate-500">
                            Submitted {formatDate(pin.createdAt)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">
                        {pin.building}
                        {pin.exactLocation && (
                          <p className="text-xs text-slate-500">{pin.exactLocation}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={riskBadgeClass[pin.level]}>
                          {riskLabel[pin.level]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {isShsBuildingLabel(pin.building) ? `Floor ${pin.floorId}` : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" onClick={() => setPinStatus(pin.id, "Approved")}>
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setPinStatus(pin.id, "Rejected")}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(pin.id)}
                            aria-label="Delete report"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VerifyCard({
  pin,
  setPinStatus,
  onDelete,
}: {
  pin: Pin;
  setPinStatus: (id: string, status: Pin["status"]) => void;
  onDelete: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#0d152f]">
      {/* eslint-disable-next-line @next/next/no-img-element -- source may be a data: URL */}
      <img
        src={pin.photoUrl}
        alt="Issue"
        className="h-40 w-full object-cover"
      />
      <div className="space-y-2 p-4">
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
        {pin.exactLocation && (
          <p className="text-xs text-slate-400">
            <span className="text-slate-500">Exact spot: </span>
            {pin.exactLocation}
          </p>
        )}
        <div className="border-t border-slate-800 pt-2 text-xs text-slate-400">
          <p className="font-medium text-slate-300">{pin.reporterName}</p>
          <p>{pin.reporterSection}</p>
          <p>{pin.reporterEmail}</p>
          {pin.deviceId && (
            <p className="font-mono text-[11px] text-slate-500">
              Device {pin.deviceId.slice(0, 8)}
            </p>
          )}
          {formatDate(pin.createdAt) && (
            <p className="mt-1 text-slate-500">Submitted {formatDate(pin.createdAt)}</p>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => setPinStatus(pin.id, "Approved")}
          >
            <Check className="mr-1 h-4 w-4" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => setPinStatus(pin.id, "Rejected")}
          >
            <X className="mr-1 h-4 w-4" />
            Reject
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete} aria-label="Delete report">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
