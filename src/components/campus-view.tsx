"use client";

import { useState } from "react";
import { CampusMap } from "@/components/campus-map";
import { ReportIssueModal } from "@/components/report-issue-modal";
import { ReportSummary } from "@/components/report-summary";
import { SiteHeader } from "@/components/site-header";
import { usePins } from "@/lib/pins-context";
import type { FloorId } from "@/lib/types";

export function CampusView() {
  const { pins, addPin } = usePins();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState({ x: 0, y: 0 });
  const [pendingBuilding, setPendingBuilding] = useState("");
  const [pendingFloor, setPendingFloor] = useState<FloorId>(1);

  function handleMapClick(x: number, y: number, building: string, floorId: FloorId) {
    setPendingCoords({ x, y });
    setPendingBuilding(building);
    setPendingFloor(floorId);
    setModalOpen(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 p-4 sm:p-8">
      <SiteHeader />

      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Campus Live View</h1>
        <p className="text-sm text-slate-400">
          Tap a spot on the map to report a facility issue.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-6 lg:flex-nowrap lg:overflow-x-auto">
        <CampusMap pins={pins} onMapClick={handleMapClick} />
        <ReportSummary pins={pins} />
      </div>

      <ReportIssueModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        floorId={pendingFloor}
        xCoord={pendingCoords.x}
        yCoord={pendingCoords.y}
        building={pendingBuilding}
        onSubmit={addPin}
      />
    </div>
  );
}
