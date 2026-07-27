"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { MapDecorations } from "@/components/map-decorations";

const SHS_ZONE_ID = "shs-bldg";
const SHS_FLOORS: FloorId[] = [1, 2, 3, 4];
const BASE_WIDTH = 1040;
const BASE_HEIGHT = 400;
const ASPECT = BASE_WIDTH / BASE_HEIGHT;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

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
  const [size, setSize] = useState({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinchStateRef = useRef<{ startDistance: number; startZoom: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit the campus (BASE_WIDTH × BASE_HEIGHT aspect) inside the container,
  // then scale by zoom. Padding centers it when it's smaller than the
  // viewport and drops to 0 when it overflows (so panning reaches every edge).
  let fitW = size.w;
  let fitH = fitW / ASPECT;
  if (fitH > size.h) {
    fitH = size.h;
    fitW = fitH * ASPECT;
  }
  const contentW = fitW * zoom;
  const contentH = fitH * zoom;
  const padX = Math.max(0, (size.w - contentW) / 2);
  const padY = Math.max(0, (size.h - contentH) / 2);

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

  function bump(delta: number) {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100)));
  }

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-pin], [data-ui-overlay]")) return;

    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) return;
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
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#b8b2a1]">
      <div
        onClick={handleMapClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="img"
        aria-label="Campus map. Tap a location to report an issue."
        style={{ padding: `${padY}px ${padX}px` }}
        className="no-scrollbar absolute inset-0 cursor-crosshair overflow-auto touch-pan-x touch-pan-y"
      >
        <div
          ref={contentRef}
          style={{ width: `${contentW}px`, height: `${contentH}px` }}
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
                "absolute flex items-center justify-center overflow-hidden border border-black/30 p-1 text-center text-sm leading-tight font-semibold shadow-md sm:text-base",
                zone.color,
                zone.labelColor
              )}
            >
              {zone.label}
            </div>
          ))}

          <MapDecorations zones={CAMPUS_ZONES} />

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
                  "absolute z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow",
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
                  {/* eslint-disable-next-line @next/next/no-img-element -- source may be a data: URL */}
                  <img
                    src={pin.photoUrl}
                    alt="Issue"
                    className="w-full rounded-md border border-border object-cover"
                  />
                  <p className="text-sm">{pin.description}</p>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </div>

      {/* Floor tabs — appear when the SHS building is tapped */}
      {shsPanelOpen && (
        <div
          data-ui-overlay
          className="absolute top-3 left-1/2 z-20 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-lg border border-amber-500/40 bg-slate-900/95 p-1 shadow-lg backdrop-blur"
        >
          <span className="pl-2 pr-1 text-xs font-medium text-slate-400">SHS Bldg.</span>
          {SHS_FLOORS.map((floor) => (
            <button
              key={floor}
              onClick={() => setActiveShsFloor(floor)}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium",
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

      {/* Zoom controls — bottom-right, Google-Maps style */}
      <div
        data-ui-overlay
        className="absolute right-3 bottom-3 z-20 flex flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-900/95 shadow-lg backdrop-blur"
      >
        <button
          onClick={() => bump(0.5)}
          className="p-2.5 text-slate-200 hover:bg-slate-800"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <div className="h-px bg-slate-700" />
        <button
          onClick={() => bump(-0.5)}
          className="p-2.5 text-slate-200 hover:bg-slate-800"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <div className="h-px bg-slate-700" />
        <button
          onClick={() => setZoom(1)}
          className="p-2.5 text-slate-200 hover:bg-slate-800"
          aria-label="Reset zoom"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
