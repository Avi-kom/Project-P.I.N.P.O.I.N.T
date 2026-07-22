export interface CampusZone {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  color: string;
  labelColor: string;
}

// Edit this list to match your real campus layout, or use the visual
// editor at /editor — it writes this file for you.
// x/y/width/height are percentages of the map canvas (0-100),
// measured from the top-left corner.
export const CAMPUS_ZONES: CampusZone[] = [
  {
    id: "field",
    label: "Open field of S.H",
    xPercent: 0.2,
    yPercent: 30.9,
    widthPercent: 55.9,
    heightPercent: 59.7,
    color: "bg-green-600/80",
    labelColor: "text-white",
  },
  {
    id: "shs-bldg",
    label: "Senior High School Bldg.",
    xPercent: 56.1,
    yPercent: 30.8,
    widthPercent: 40.8,
    heightPercent: 60.5,
    color: "bg-yellow-500",
    labelColor: "text-slate-900",
  },
  {
    id: "zone-1784720600340-4",
    label: "Guard House",
    xPercent: 53.2,
    yPercent: 87,
    widthPercent: 9,
    heightPercent: 13,
    color: "bg-slate-600",
    labelColor: "text-white",
  },
  {
    id: "zone-1784720684112-5",
    label: "Gate",
    xPercent: 46.4,
    yPercent: 97.4,
    widthPercent: 7,
    heightPercent: 0,
    color: "bg-green-600/70",
    labelColor: "text-white",
  },
  {
    id: "zone-1784720686303-6",
    label: "Flagpole",
    xPercent: 74.4,
    yPercent: 28,
    widthPercent: 1,
    heightPercent: 1,
    color: "bg-amber-600",
    labelColor: "text-white",
  },
  {
    id: "zone-1784720965102-1",
    label: "Canteen",
    xPercent: 80.4,
    yPercent: 0,
    widthPercent: 16,
    heightPercent: 7,
    color: "bg-rose-900/85",
    labelColor: "text-white",
  },
  {
    id: "zone-1784721233740-1",
    label: "Open Field Near J.H",
    xPercent: 13.9,
    yPercent: 1.2,
    widthPercent: 68.2,
    heightPercent: 29.7,
    color: "bg-slate-600",
    labelColor: "text-white",
  }
];

export const UNMARKED_ZONE_LABEL = "Unmarked Area";

export function findZoneForPoint(
  xPercent: number,
  yPercent: number
): CampusZone | undefined {
  return CAMPUS_ZONES.find(
    (zone) =>
      xPercent >= zone.xPercent &&
      xPercent <= zone.xPercent + zone.widthPercent &&
      yPercent >= zone.yPercent &&
      yPercent <= zone.yPercent + zone.heightPercent
  );
}
