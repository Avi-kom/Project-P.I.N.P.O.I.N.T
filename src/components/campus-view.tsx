"use client";

import { useState } from "react";
import { CampusMap } from "@/components/campus-map";
import { ReportIssueModal } from "@/components/report-issue-modal";
import { MapNav } from "@/components/map-nav";
import { MapSummary } from "@/components/map-summary";
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
    <div className="relative h-full w-full">
      <CampusMap pins={pins} onMapClick={handleMapClick} />
      <MapNav />
      <MapSummary pins={pins} />

      {/* hint */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 hidden -translate-x-1/2 rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 shadow backdrop-blur sm:block">
        Tap a spot on the map to report an issue · pinch or scroll to zoom
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
