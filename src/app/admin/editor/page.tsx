"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Save, Check } from "lucide-react";
import { CAMPUS_ZONES, type CampusZone } from "@/lib/campus-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapDecorations } from "@/components/map-decorations";
import { cn } from "@/lib/utils";

const COLOR_PRESETS: { bg: string; text: string; swatch: string }[] = [
  { bg: "bg-green-700/85", text: "text-white", swatch: "bg-green-700" },
  { bg: "bg-green-600/70", text: "text-white", swatch: "bg-green-600" },
  { bg: "bg-green-800/80", text: "text-white", swatch: "bg-green-800" },
  { bg: "bg-blue-900/80", text: "text-white", swatch: "bg-blue-900" },
  { bg: "bg-rose-900/85", text: "text-white", swatch: "bg-rose-900" },
  { bg: "bg-amber-600", text: "text-white", swatch: "bg-amber-600" },
  { bg: "bg-yellow-500", text: "text-slate-900", swatch: "bg-yellow-500" },
  { bg: "bg-slate-600", text: "text-white", swatch: "bg-slate-600" },
];

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

export default function EditorPage() {
  const [zones, setZones] = useState<CampusZone[]>(CAMPUS_ZONES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const selectedZone = zones.find((z) => z.id === selectedId) ?? null;

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
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
      dragStateRef.current = null;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  function startDrag(zone: CampusZone, mode: DragMode, e: React.MouseEvent) {
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
    const newZone: CampusZone = {
      id,
      label: "New Zone",
      xPercent: 40,
      yPercent: 40,
      widthPercent: 16,
      heightPercent: 12,
      color: "bg-slate-600",
      labelColor: "text-white",
    };
    setZones((prev) => [...prev, newZone]);
    setSelectedId(id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    setZones((prev) => prev.filter((z) => z.id !== selectedId));
    setSelectedId(null);
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      const res = await fetch("/api/campus-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zones }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Map Layout Editor</h1>
        <p className="text-sm text-slate-400">
          Drag a zone to move it, drag its corner handle to resize. Click Save to write
          campus-layout.ts.
        </p>
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row lg:flex-nowrap">
        <div
          ref={canvasRef}
          onMouseDown={() => setSelectedId(null)}
          className="relative aspect-[1040/400] w-full min-w-0 flex-1 overflow-hidden rounded-lg border border-stone-400 bg-[#b8b2a1]"
        >
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
                "absolute flex cursor-move items-center justify-center overflow-hidden border p-1 text-center text-sm leading-tight font-semibold shadow-md select-none sm:text-base",
                zone.color,
                zone.labelColor,
                selectedId === zone.id
                  ? "z-20 border-2 border-dashed border-slate-900 ring-2 ring-slate-900/40"
                  : "border-black/30"
              )}
            >
              {zone.label}
              <div
                onMouseDown={(e) => startDrag(zone, "resize", e)}
                className="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize rounded-tl bg-slate-900/70"
              />
            </div>
          ))}

          <MapDecorations zones={zones} />
        </div>

        <div className="w-full shrink-0 space-y-4 rounded-lg border border-slate-700 bg-slate-900 p-4 lg:w-72">
          <div className="flex gap-2">
            <Button variant="outline" onClick={addZone} className="flex-1">
              <Plus className="mr-1 h-4 w-4" />
              Add Zone
            </Button>
            <Button
              variant="destructive"
              onClick={deleteSelected}
              disabled={!selectedZone}
            >
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
                <NumberField
                  label="X %"
                  value={selectedZone.xPercent}
                  onChange={(v) => updateSelected({ xPercent: v })}
                />
                <NumberField
                  label="Y %"
                  value={selectedZone.yPercent}
                  onChange={(v) => updateSelected({ yPercent: v })}
                />
                <NumberField
                  label="Width %"
                  value={selectedZone.widthPercent}
                  onChange={(v) => updateSelected({ widthPercent: v })}
                />
                <NumberField
                  label="Height %"
                  value={selectedZone.heightPercent}
                  onChange={(v) => updateSelected({ heightPercent: v })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.bg}
                      onClick={() =>
                        updateSelected({ color: preset.bg, labelColor: preset.text })
                      }
                      className={cn(
                        "h-7 w-7 rounded-full border-2",
                        preset.swatch,
                        selectedZone.color === preset.bg
                          ? "border-slate-900"
                          : "border-transparent"
                      )}
                      aria-label={preset.bg}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Click a zone on the map to edit it, or add a new one.
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
          {saveState === "error" && (
            <p className="text-xs text-red-400">Could not save. Try again.</p>
          )}
        </div>
      </div>
    </div>
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
