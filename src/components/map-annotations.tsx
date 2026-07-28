import type { MapStroke } from "@/lib/map-annotations";
import { MAP_BACKGROUND } from "@/lib/campus-layout";

const INK = "#3b2f22"; // dark sepia ink for added lines

function pointsAttr(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

// Renders freehand strokes over the map. Shared by the live Campus Map and the
// Map Editor so both look identical. Uses a 0–100 viewBox stretched to fit
// (preserveAspectRatio="none"); stroke widths stay constant on screen via
// vector-effect="non-scaling-stroke".
export function MapAnnotations({ strokes }: { strokes: MapStroke[] }) {
  if (!strokes.length) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      {strokes.map((s) =>
        s.points.length === 1 ? (
          <circle
            key={s.id}
            cx={s.points[0].x}
            cy={s.points[0].y}
            r={0.1}
            stroke={s.mode === "erase" ? MAP_BACKGROUND : INK}
            strokeWidth={s.width}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <polyline
            key={s.id}
            points={pointsAttr(s.points)}
            fill="none"
            stroke={s.mode === "erase" ? MAP_BACKGROUND : INK}
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )
      )}
    </svg>
  );
}
