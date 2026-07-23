"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";
import type { FloorId, Pin } from "@/lib/types";
import { riskDotClass, riskLabel } from "@/lib/risk";
import {
  CAMPUS_ZONES,
  findZoneForPoint,
  isShsBuildingLabel,
  UNMARKED_ZONE_LABEL,
} from "@/lib/campus-layout";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SHS_ZONE_ID = "shs-bldg";
const SHS_FLOORS: FloorId[] = [1, 2, 3, 4];
const BASE_WIDTH = 1040;
const BASE_HEIGHT = 400;
const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;

const shsZone = CAMPUS_ZONES.find((z) => z.id === SHS_ZONE_ID);

function isInsideShsBounds(xPercent: number, yPercent: number) {
  if (!shsZone) return false;
  return (
    xPercent >= shsZone.xPercent &&
    xPercent <= shsZone.xPercent + shsZone.widthPercent &&
    yPercent >= shsZone.yPercent &&
    yPercent <= shsZone.yPercent + shsZone.heightPercent
  );
}

interface CampusMapProps {
  pins: Pin[];
  onMapClick: (xPercent: number, yPercent: number, building: string, floorId: FloorId) => void;
}

function touchDistance(t1: React.Touch, t2: React.Touch) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

export function CampusMap({ pins, onMapClick }: CampusMapProps) {
  const [openPinId, setOpenPinId] = useState<string | null>(null);
  const [shsPanelOpen, setShsPanelOpen] = useState(false);
  const [activeShsFloor, setActiveShsFloor] = useState<FloorId>(1);
  const [zoom, setZoom] = useState(1);
  const pinchStateRef = useRef<{ startDistance: number; startZoom: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Render largest zones first so smaller sub-zones (stairs, CR, doors)
  // paint on top instead of being covered by the building block.
  const renderZones = useMemo(
    () =>
      [...CAMPUS_ZONES].sort(
        (a, b) => b.widthPercent * b.heightPercent - a.widthPercent * a.heightPercent
      ),
    []
  );

  const visiblePins = pins.filter((pin) => {
    if (pin.status !== "Approved") return false;
    if (activeShsFloor !== 1) return pin.floorId === activeShsFloor;
    if (pin.building === "Open Field") return true;
    return pin.floorId === 1;
  });

  function exitShsContext() {
    setShsPanelOpen(false);
    setActiveShsFloor(1);
  }

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-pin], [data-ui-overlay]")) return;

    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    const zone = findZoneForPoint(xPercent, yPercent);

    if (isInsideShsBounds(xPercent, yPercent)) {
      if (!shsPanelOpen) {
        setShsPanelOpen(true);
        return;
      }
      onMapClick(xPercent, yPercent, zone?.label ?? shsZone!.label, activeShsFloor);
      return;
    }

    exitShsContext();
    onMapClick(xPercent, yPercent, zone?.label ?? UNMARKED_ZONE_LABEL, 1);
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length === 2) {
      pinchStateRef.current = {
        startDistance: touchDistance(e.touches[0], e.touches[1]),
        startZoom: zoom,
      };
    }
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    const pinch = pinchStateRef.current;
    if (e.touches.length === 2 && pinch) {
      e.preventDefault();
      const distance = touchDistance(e.touches[0], e.touches[1]);
      const scale = distance / pinch.startDistance;
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinch.startZoom * scale));
      setZoom(Math.round(nextZoom * 100) / 100);
    }
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length < 2) pinchStateRef.current = null;
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative min-w-0">
        <div
          data-ui-overlay
          className="absolute top-2 right-2 z-20 flex gap-1 rounded-md border border-slate-700 bg-slate-900/95 p-1 shadow"
        >
          <button
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - 0.25) * 100) / 100))}
            className="rounded p-1.5 text-slate-200 hover:bg-slate-800"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="rounded p-1.5 text-slate-200 hover:bg-slate-800"
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + 0.25) * 100) / 100))}
            className="rounded p-1.5 text-slate-200 hover:bg-slate-800"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {shsPanelOpen && (
          <div
            data-ui-overlay
            className="absolute top-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-md border border-amber-500/40 bg-slate-900/95 p-1 shadow-lg"
          >
            <span className="pl-2 pr-1 text-xs font-medium text-slate-400">SHS Bldg.</span>
            {SHS_FLOORS.map((floor) => (
              <button
                key={floor}
                onClick={() => setActiveShsFloor(floor)}
                className={cn(
                  "rounded px-3 py-1 text-sm font-medium",
                  activeShsFloor === floor
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-200 hover:bg-slate-800"
                )}
              >
                Floor {floor}
              </button>
            ))}
            <button
              onClick={exitShsContext}
              className="ml-1 rounded p-1.5 text-slate-400 hover:bg-slate-800"
              aria-label="Exit building view"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div
          onClick={handleMapClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="img"
          aria-label="Campus map. Tap a location to report an issue."
          className="no-scrollbar relative h-[400px] w-[1040px] max-w-full cursor-crosshair overflow-auto rounded-lg ring-1 ring-inset ring-stone-400 bg-[#b8b2a1] touch-pan-x touch-pan-y"
        >
          <div
            ref={contentRef}
            style={{ width: `${BASE_WIDTH * zoom}px`, height: `${BASE_HEIGHT * zoom}px` }}
            className="relative"
          >
            {renderZones.map((zone) => (
              <div
                key={zone.id}
                aria-hidden="true"
                style={{
                  left: `${zone.xPercent}%`,
                  top: `${zone.yPercent}%`,
                  width: `${zone.widthPercent}%`,
                  height: `${zone.heightPercent}%`,
                }}
                className={cn(
                  "absolute flex items-center justify-center overflow-hidden border border-black/30 p-1 text-center text-base leading-tight font-semibold shadow-md",
                  zone.color,
                  zone.labelColor
                )}
              >
                {zone.label}
              </div>
            ))}

            {/* decorative windows along the SHS building facade */}
            {shsZone &&
              [61, 68, 75, 82].map((x) => (
                <div
                  key={`window-${x}`}
                  aria-hidden="true"
                  style={{ left: `${x}%`, top: "52%", width: "3%", height: "5%" }}
                  className="absolute rounded-[2px] border border-slate-700/60 bg-sky-100/70"
                />
              ))}

            {/* decorative interior wall dividing the SHS building wings */}
            {shsZone && (
              <div
                aria-hidden="true"
                style={{ left: "77%", top: `${shsZone.yPercent}%`, width: "0.4%", height: `${shsZone.heightPercent}%` }}
                className="absolute bg-black/25"
              />
            )}

            {/* decorative trees along the field's edge */}
            {[12, 18, 24, 30, 36].map((x) => (
              <div
                key={x}
                aria-hidden="true"
                style={{ left: `${x}%`, top: "26%" }}
                className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-green-900/70"
              />
            ))}

            {visiblePins.map((pin) => (
              <Popover
                key={pin.id}
                open={openPinId === pin.id}
                onOpenChange={(open) => setOpenPinId(open ? pin.id : null)}
              >
                <PopoverTrigger
                  data-pin
                  onClick={(e) => e.stopPropagation()}
                  style={{ left: `${pin.xCoord}%`, top: `${pin.yCoord}%` }}
                  className={cn(
                    "absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow",
                    riskDotClass[pin.level],
                    !pin.synced && "ring-2 ring-amber-400 ring-offset-1 animate-pulse"
                  )}
                  aria-label={`${riskLabel[pin.level]} — ${pin.building}: ${pin.description}${
                    pin.synced ? "" : " (pending upload)"
                  }`}
                />
                <PopoverContent className="w-64" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {riskLabel[pin.level]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pin.building}
                        {isShsBuildingLabel(pin.building) ? ` — Floor ${pin.floorId}` : ""}
                      </p>
                      {!pin.synced && (
                        <p className="mt-1 text-xs font-medium text-amber-500">
                          Saved on this device — pending upload
                        </p>
                      )}
                    </div>
                    <Image
                      src={pin.photoUrl}
                      alt="Issue photo"
                      width={400}
                      height={300}
                      className="w-full rounded-md border"
                      unoptimized
                    />
                    <p className="text-sm">{pin.description}</p>
                  </div>
                </PopoverContent>
              </Popover>
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 h-[400px] w-8 rounded-r-lg bg-gradient-to-l from-[#8a8272]/70 to-transparent"
        />
      </div>
    </div>
  );
}
