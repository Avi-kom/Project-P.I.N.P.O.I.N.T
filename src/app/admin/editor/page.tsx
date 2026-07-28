"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Save, Check, Pen, Eraser, MousePointer2, Undo2 } from "lucide-react";
import {
  CAMPUS_ZONES,
  type CampusZone,
  BUILDING_IMAGE,
  PARKING_IMAGE,
  BUILDING_WIDTH_PERCENT,
  CAMPUS_ASPECT,
  MAP_BACKGROUND,
  PARKING_TOP_PERCENT,
} from "@/lib/campus-layout";
import { MAP_ANNOTATIONS, type MapStroke } from "@/lib/map-annotations";
import { MapAnnotations } from "@/components/map-annotations";
import { fetchMapConfig, saveMapConfig } from "@/lib/map-config-remote";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Translucent washes (the blueprint shows through) to match the live map.
const COLOR_PRESETS: { bg: string; text: string; swatch: string }[] = [
  { bg: "bg-emerald-500/30", text: "text-slate-900", swatch: "bg-emerald-500" },
  { bg: "bg-cyan-500/35", text: "text-slate-900", swatch: "bg-cyan-500" },
  { bg: "bg-amber-400/35", text: "text-slate-900", swatch: "bg-amber-400" },
  { bg: "bg-stone-400/25", text: "text-slate-900", swatch: "bg-stone-400" },
  { bg: "bg-orange-500/30", text: "text-slate-900", swatch: "bg-orange-500" },
  { bg: "bg-rose-500/35", text: "text-white", swatch: "bg-rose-500" },
  { bg: "bg-indigo-500/30", text: "text-white", swatch: "bg-indigo-500" },
  { bg: "bg-sky-500/15", text: "text-slate-900", swatch: "bg-sky-500" },
];

const DRAW_WIDTH = 2;
const ERASE_WIDTH = 16;

type Tool = "areas" | "draw" | "erase";
type DragMode = "move" | "resize";

interface DragState {
  id: string;
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  startXPercent: number;
  startYPercent: number;
  startWidthPercent: number;
  startHeightPercent: number;
}

let nextZoneCounter = 1;
let strokeCounter = 1;

export default function EditorPage() {
  const [zones, setZones] = useState<CampusZone[]>(CAMPUS_ZONES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [tool, setTool] = useState<Tool>("areas");
  const [strokes, setStrokes] = useState<MapStroke[]>(MAP_ANNOTATIONS);
  const [currentStroke, setCurrentStroke] = useState<MapStroke | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const drawingRef = useRef(false);
  const currentRef = useRef<MapStroke | null>(null);

  const selectedZone = zones.find((z) => z.id === selectedId) ?? null;

  // Load any saved layout from Supabase (overrides the static file defaults).
  useEffect(() => {
    let cancelled = false;
    fetchMapConfig().then((cfg) => {
      if (cancelled || !cfg) return;
      setZones(cfg.zones);
      setStrokes(cfg.annotations);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function pointFromEvent(e: MouseEvent | React.MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      // Drawing / erasing
      if (drawingRef.current) {
        const p = pointFromEvent(e);
        const s = currentRef.current;
        if (!p || !s) return;
        s.points.push(p);
        setCurrentStroke({ ...s, points: [...s.points] });
        return;
      }

      // Moving / resizing a tap-area
      const drag = dragStateRef.current;
      const canvas = canvasRef.current;
      if (!drag || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - drag.startClientX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - drag.startClientY) / rect.height) * 100;

      setZones((prev) =>
        prev.map((zone) => {
          if (zone.id !== drag.id) return zone;
          if (drag.mode === "move") {
            const maxX = 100 - zone.widthPercent;
            const maxY = 100 - zone.heightPercent;
            return {
              ...zone,
              xPercent: clamp(drag.startXPercent + deltaXPercent, 0, maxX),
              yPercent: clamp(drag.startYPercent + deltaYPercent, 0, maxY),
            };
          }
          const maxWidth = 100 - zone.xPercent;
          const maxHeight = 100 - zone.yPercent;
          return {
            ...zone,
            widthPercent: clamp(drag.startWidthPercent + deltaXPercent, 3, maxWidth),
            heightPercent: clamp(drag.startHeightPercent + deltaYPercent, 3, maxHeight),
          };
        })
      );
    }

    function handleMouseUp() {
      if (drawingRef.current) {
        drawingRef.current = false;
        const s = currentRef.current;
        currentRef.current = null;
        setCurrentStroke(null);
        if (s && s.points.length > 0) setStrokes((prev) => [...prev, s]);
      }
      dragStateRef.current = null;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (tool === "draw" || tool === "erase") {
      const p = pointFromEvent(e);
      if (!p) return;
      drawingRef.current = true;
      setCurrentStroke({
        id: `stroke-${Date.now()}-${strokeCounter++}`,
        mode: tool === "erase" ? "erase" : "draw",
        width: tool === "erase" ? ERASE_WIDTH : DRAW_WIDTH,
        points: [p],
      });
      return;
    }
    setSelectedId(null);
  }

  function startDrag(zone: CampusZone, mode: DragMode, e: React.MouseEvent) {
    if (tool !== "areas") return;
    e.stopPropagation();
    setSelectedId(zone.id);
    dragStateRef.current = {
      id: zone.id,
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXPercent: zone.xPercent,
      startYPercent: zone.yPercent,
      startWidthPercent: zone.widthPercent,
      startHeightPercent: zone.heightPercent,
    };
  }

  function updateSelected(patch: Partial<CampusZone>) {
    if (!selectedId) return;
    setZones((prev) => prev.map((z) => (z.id === selectedId ? { ...z, ...patch } : z)));
  }

  function addZone() {
    const id = `zone-${Date.now()}-${nextZoneCounter++}`;
    setZones((prev) => [
      ...prev,
      {
        id,
        label: "New Zone",
        xPercent: 40,
        yPercent: 40,
        widthPercent: 12,
        heightPercent: 10,
        color: "bg-sky-500/30",
        labelColor: "text-slate-900",
      },
    ]);
    setSelectedId(id);
    setTool("areas");
  }

  function deleteSelected() {
    if (!selectedId) return;
    setZones((prev) => prev.filter((z) => z.id !== selectedId));
    setSelectedId(null);
  }

  function undoStroke() {
    setStrokes((prev) => prev.slice(0, -1));
  }

  function clearStrokes() {
    setStrokes([]);
  }

  async function handleSave() {
    setSaveState("saving");

    // Primary store: Supabase (works on the deployed site).
    const remoteOk = isSupabaseConfigured ? await saveMapConfig(zones, strokes) : false;

    // Best-effort: also write the source files so local dev stays in sync.
    // This fails silently on read-only hosts (e.g. Vercel) — that's expected.
    let fileOk = false;
    try {
      const [a, b] = await Promise.all([
        fetch("/api/campus-layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zones }),
        }),
        fetch("/api/map-annotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ strokes }),
        }),
      ]);
      fileOk = a.ok && b.ok;
    } catch {
      fileOk = false;
    }

    if (remoteOk || fileOk) {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } else {
      setSaveState("error");
    }
  }

  const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;
  const drawing = tool === "draw" || tool === "erase";

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Map Layout Editor</h1>
        <p className="text-sm text-slate-400">
          <b className="text-slate-200">Move areas</b> to drag the invisible tap-zones over the
          blueprint. <b className="text-slate-200">Draw line</b> adds ink; <b className="text-slate-200">Erase</b>{" "}
          paints over blueprint lines with the background. Click Save to write your changes.
        </p>
      </div>

      {/* Tool switch */}
      <div className="flex flex-wrap gap-2">
        <ToolButton active={tool === "areas"} onClick={() => setTool("areas")} icon={<MousePointer2 className="h-4 w-4" />}>
          Move areas
        </ToolButton>
        <ToolButton active={tool === "draw"} onClick={() => setTool("draw")} icon={<Pen className="h-4 w-4" />}>
          Draw line
        </ToolButton>
        <ToolButton active={tool === "erase"} onClick={() => setTool("erase")} icon={<Eraser className="h-4 w-4" />}>
          Erase
        </ToolButton>
        <div className="mx-1 w-px self-stretch bg-slate-700" />
        <Button variant="outline" size="sm" onClick={undoStroke} disabled={!strokes.length}>
          <Undo2 className="mr-1 h-4 w-4" /> Undo line
        </Button>
        <Button variant="outline" size="sm" onClick={clearStrokes} disabled={!strokes.length}>
          <Trash2 className="mr-1 h-4 w-4" /> Clear lines
        </Button>
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row lg:flex-nowrap">
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          style={{ aspectRatio: String(CAMPUS_ASPECT), backgroundColor: MAP_BACKGROUND }}
          className={cn(
            "relative flex w-full min-w-0 flex-1 overflow-hidden rounded-lg border border-stone-500",
            drawing && (tool === "erase" ? "cursor-cell" : "cursor-crosshair")
          )}
        >
          {/* Blueprint backdrop — building left, parking right */}
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-ratio static asset */}
          <img
            src={BUILDING_IMAGE.src}
            alt=""
            draggable={false}
            style={{ width: `${BUILDING_WIDTH_PERCENT}%` }}
            className="pointer-events-none h-full select-none object-fill"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-ratio static asset */}
          <img
            src={PARKING_IMAGE.src}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: `${BUILDING_WIDTH_PERCENT}%`,
              top: `${PARKING_TOP_PERCENT}%`,
              height: `${100 - PARKING_TOP_PERCENT}%`,
              width: "auto",
            }}
            className="pointer-events-none select-none"
          />

          {/* Colour washes */}
          {zones
            .filter((z) => z.id !== "shs-bldg")
            .map((zone) => (
              <div
                key={`wash-${zone.id}`}
                aria-hidden="true"
                style={{
                  left: `${zone.xPercent}%`,
                  top: `${zone.yPercent}%`,
                  width: `${zone.widthPercent}%`,
                  height: `${zone.heightPercent}%`,
                }}
                className={cn("pointer-events-none absolute mix-blend-multiply", zone.color)}
              />
            ))}

          {/* Committed + in-progress freehand strokes */}
          <MapAnnotations strokes={allStrokes} />

          {/* Draggable tap-areas (hidden from pointer while drawing) */}
          {zones.map((zone) => (
            <div
              key={zone.id}
              onMouseDown={(e) => startDrag(zone, "move", e)}
              style={{
                left: `${zone.xPercent}%`,
                top: `${zone.yPercent}%`,
                width: `${zone.widthPercent}%`,
                height: `${zone.heightPercent}%`,
              }}
              className={cn(
                "absolute flex cursor-move items-center justify-center overflow-hidden border p-1 text-center text-[10px] leading-tight font-semibold shadow-sm select-none sm:text-xs",
                drawing && "pointer-events-none",
                selectedId === zone.id
                  ? "z-20 border-2 border-dashed border-slate-900 bg-slate-900/5 ring-2 ring-slate-900/40"
                  : "border-slate-900/30"
              )}
            >
              <span className="rounded bg-white/70 px-1 text-slate-900">{zone.label}</span>
              {tool === "areas" && (
                <div
                  onMouseDown={(e) => startDrag(zone, "resize", e)}
                  className="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize rounded-tl bg-slate-900/70"
                />
              )}
            </div>
          ))}
        </div>

        <div className="w-full shrink-0 space-y-4 rounded-lg border border-slate-700 bg-slate-900 p-4 lg:w-72">
          <div className="flex gap-2">
            <Button variant="outline" onClick={addZone} className="flex-1">
              <Plus className="mr-1 h-4 w-4" />
              Add Zone
            </Button>
            <Button variant="destructive" onClick={deleteSelected} disabled={!selectedZone}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {selectedZone ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Label</label>
                <Input
                  value={selectedZone.label}
                  onChange={(e) => updateSelected({ label: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <NumberField label="X %" value={selectedZone.xPercent} onChange={(v) => updateSelected({ xPercent: v })} />
                <NumberField label="Y %" value={selectedZone.yPercent} onChange={(v) => updateSelected({ yPercent: v })} />
                <NumberField label="Width %" value={selectedZone.widthPercent} onChange={(v) => updateSelected({ widthPercent: v })} />
                <NumberField label="Height %" value={selectedZone.heightPercent} onChange={(v) => updateSelected({ heightPercent: v })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.bg}
                      onClick={() => updateSelected({ color: preset.bg, labelColor: preset.text })}
                      className={cn(
                        "h-7 w-7 rounded-full border-2",
                        preset.swatch,
                        selectedZone.color === preset.bg ? "border-white" : "border-transparent"
                      )}
                      aria-label={preset.bg}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              {drawing
                ? "Drag on the map to draw or erase lines."
                : "Click a tap-area on the map to edit it, or add a new one."}
            </p>
          )}

          <Button className="w-full" onClick={handleSave} disabled={saveState === "saving"}>
            {saveState === "saved" ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {saveState === "saving" ? "Saving..." : "Save Layout"}
              </>
            )}
          </Button>
          {saveState === "error" && <p className="text-xs text-red-400">Could not save. Try again.</p>}
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium",
        active
          ? "border-amber-500 bg-amber-500 text-slate-950"
          : "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <Input
        type="number"
        value={Math.round(value * 10) / 10}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
