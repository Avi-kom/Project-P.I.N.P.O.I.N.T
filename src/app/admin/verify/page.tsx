"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";
import { usePins } from "@/lib/pins-context";
import { riskLabel, riskBadgeClass } from "@/lib/risk";
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

export default function VerifyReportsPage() {
  const { pins, setPinStatus } = usePins();
  const pendingPins = pins.filter((p) => p.status === "Pending");

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
        <div className="rounded-lg border border-slate-800 bg-[#0d152f] p-4">
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
                    <Image
                      src={pin.photoUrl}
                      alt="Issue photo"
                      width={96}
                      height={72}
                      className="rounded-md border border-slate-700"
                      unoptimized
                    />
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-slate-200">
                    {pin.description}
                  </TableCell>
                  <TableCell className="text-sm text-slate-300">
                    <p className="font-medium">{pin.reporterName}</p>
                    <p className="text-xs text-slate-500">{pin.reporterSection}</p>
                  </TableCell>
                  <TableCell className="text-sm text-slate-300">{pin.building}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={riskBadgeClass[pin.level]}>
                      {riskLabel[pin.level]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {pin.building === "Open Field" ? "—" : `Floor ${pin.floorId}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
