"use client";

import { useState } from "react";
import { CampusMap } from "@/components/campus-map";
import { ReportIssueModal } from "@/components/report-issue-modal";
import { MapSummary } from "@/components/map-summary";
import { usePins } from "@/lib/pins-context";
import type { FloorId } from "@/lib/types";

export default function AdminMapPage() {
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
      <MapSummary pins={pins} />

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
