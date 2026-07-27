import type { CampusZone } from "@/lib/campus-layout";

// Decorative, non-interactive details (windows, interior wall, trees) drawn
// on top of the zones. Shared by the live Campus Map and the Map Editor so
// both render the campus identically.
export function MapDecorations({ zones }: { zones: CampusZone[] }) {
  const shs = zones.find((z) => z.id === "shs-bldg");

  return (
    <>
      {/* windows along the SHS building facade */}
      {shs &&
        [61, 68, 75, 82].map((x) => (
          <div
            key={`window-${x}`}
            aria-hidden="true"
            style={{ left: `${x}%`, top: "52%", width: "3%", height: "5%" }}
            className="pointer-events-none absolute rounded-[2px] border border-slate-700/60 bg-sky-100/70"
          />
        ))}

      {/* interior wall dividing the SHS building wings */}
      {shs && (
        <div
          aria-hidden="true"
          style={{
            left: "77%",
            top: `${shs.yPercent}%`,
            width: "0.4%",
            height: `${shs.heightPercent}%`,
          }}
          className="pointer-events-none absolute bg-black/25"
        />
      )}

      {/* trees along the field edge */}
      {[12, 18, 24, 30, 36].map((x) => (
        <div
          key={`tree-${x}`}
          aria-hidden="true"
          style={{ left: `${x}%`, top: "26%" }}
          className="pointer-events-none absolute h-[0.75%] min-h-2 w-[1.15%] min-w-2 -translate-x-1/2 rounded-full bg-green-900/70"
        />
      ))}
    </>
  );
}
