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

// The map is rendered from the real blueprint images with translucent colour
// washes + tap-areas over them. This file was written by the visual editor at
// /admin/editor. The two images sit side by side, scaled to a common height:
// BUILDING on the left, PARKING on the right.
export interface CampusImage {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
}

export const MAP_BACKGROUND = "#d8c09a";

// The parking image is dropped down this many % of the canvas height so its top
// wall lines up with the building's gate (instead of sitting near the very top).
export const PARKING_TOP_PERCENT = 17;

export const BUILDING_IMAGE: CampusImage = {
  src: "/map/building.png",
  naturalWidth: 1536,
  naturalHeight: 1024,
};

export const PARKING_IMAGE: CampusImage = {
  src: "/map/parking.png",
  naturalWidth: 620,
  naturalHeight: 563,
};

const buildingUnit = BUILDING_IMAGE.naturalWidth / BUILDING_IMAGE.naturalHeight;
const parkingUnit = PARKING_IMAGE.naturalWidth / PARKING_IMAGE.naturalHeight;
const totalUnit = buildingUnit + parkingUnit;

export const BUILDING_WIDTH_PERCENT = (buildingUnit / totalUnit) * 100;
export const PARKING_WIDTH_PERCENT = (parkingUnit / totalUnit) * 100;
export const CAMPUS_ASPECT = totalUnit;

// Tap-areas over the blueprint (combined-canvas percentages). Specific rooms
// come before the big containers; "shs-bldg" stays last as the fallback.
export const CAMPUS_ZONES: CampusZone[] = [
  {
    id: "shs-stairs-l",
    label: "Stairs",
    xPercent: 1.7,
    yPercent: 20,
    widthPercent: 4,
    heightPercent: 22,
    color: "bg-amber-400/35",
    labelColor: "text-slate-900",
  },
  {
    id: "shs-cr-l",
    label: "CR",
    xPercent: 5.7,
    yPercent: 20,
    widthPercent: 2.8,
    heightPercent: 7.8,
    color: "bg-cyan-500/35",
    labelColor: "text-slate-900",
  },
  {
    id: "classroom-1",
    label: "Classroom 1",
    xPercent: 9.4,
    yPercent: 19.5,
    widthPercent: 5.8,
    heightPercent: 19.1,
    color: "bg-emerald-500/30",
    labelColor: "text-slate-900",
  },
  {
    id: "classroom-2",
    label: "Classroom 2",
    xPercent: 15.2,
    yPercent: 19.5,
    widthPercent: 6.2,
    heightPercent: 19.1,
    color: "bg-emerald-500/30",
    labelColor: "text-slate-900",
  },
  {
    id: "classroom-3",
    label: "Classroom 3",
    xPercent: 21.4,
    yPercent: 19.5,
    widthPercent: 6.2,
    heightPercent: 19.1,
    color: "bg-emerald-500/30",
    labelColor: "text-slate-900",
  },
  {
    id: "classroom-4",
    label: "Classroom 4",
    xPercent: 27.6,
    yPercent: 19.5,
    widthPercent: 6.2,
    heightPercent: 19.1,
    color: "bg-emerald-500/30",
    labelColor: "text-slate-900",
  },
  {
    id: "classroom-5",
    label: "Classroom 5",
    xPercent: 33.8,
    yPercent: 19.5,
    widthPercent: 6.7,
    heightPercent: 19.1,
    color: "bg-emerald-500/30",
    labelColor: "text-slate-900",
  },
  {
    id: "classroom-6",
    label: "Classroom 6",
    xPercent: 41.1,
    yPercent: 19.5,
    widthPercent: 5.8,
    heightPercent: 19.1,
    color: "bg-emerald-500/30",
    labelColor: "text-slate-900",
  },
  {
    id: "shs-cr-r",
    label: "CR",
    xPercent: 47.1,
    yPercent: 20,
    widthPercent: 2.4,
    heightPercent: 7.8,
    color: "bg-cyan-500/35",
    labelColor: "text-slate-900",
  },
  {
    id: "shs-stairs-r",
    label: "Stairs",
    xPercent: 49.5,
    yPercent: 20,
    widthPercent: 2.5,
    heightPercent: 22,
    color: "bg-amber-400/35",
    labelColor: "text-slate-900",
  },
  {
    id: "shs-laundry",
    label: "Laundry",
    xPercent: 48.7,
    yPercent: 30,
    widthPercent: 1.7,
    heightPercent: 12,
    color: "bg-violet-400/30",
    labelColor: "text-slate-900",
  },
  {
    id: "guard-house-b",
    label: "Guard House",
    xPercent: 52,
    yPercent: 20,
    widthPercent: 3.2,
    heightPercent: 7.8,
    color: "bg-indigo-500/30",
    labelColor: "text-white",
  },
  {
    id: "gate-b",
    label: "Gate",
    xPercent: 55.2,
    yPercent: 20,
    widthPercent: 1.5,
    heightPercent: 5.4,
    color: "bg-rose-500/35",
    labelColor: "text-white",
  },
  {
    id: "shs-hallway",
    label: "Hallway",
    xPercent: 9.2,
    yPercent: 39,
    widthPercent: 37.7,
    heightPercent: 5,
    color: "bg-stone-400/25",
    labelColor: "text-slate-900",
  },
  {
    id: "canteen",
    label: "Canteen",
    xPercent: 1.7,
    yPercent: 46.7,
    widthPercent: 10.3,
    heightPercent: 22,
    color: "bg-orange-500/30",
    labelColor: "text-slate-900",
  },
  {
    id: "tables-benches",
    label: "Tables & Benches",
    xPercent: 57.8,
    yPercent: 51.6,
    widthPercent: 6.3,
    heightPercent: 5.8,
    color: "bg-yellow-500/30",
    labelColor: "text-slate-900",
  },
  {
    id: "parking",
    label: "Parking",
    xPercent: 57.7,
    yPercent: 17,
    widthPercent: 35.1,
    heightPercent: 82,
    color: "bg-sky-500/15",
    labelColor: "text-slate-900",
  },
  {
    id: "shs-bldg",
    label: "Senior High School Bldg.",
    xPercent: 1.5,
    yPercent: 18.5,
    widthPercent: 50.7,
    heightPercent: 25.5,
    color: "bg-yellow-400/10",
    labelColor: "text-slate-900",
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

const SHS_ZONE_ID = "shs-bldg";
const shsZoneForLabels = CAMPUS_ZONES.find((z) => z.id === SHS_ZONE_ID);

function isWithinZone(inner: CampusZone, outer: CampusZone) {
  return (
    inner.xPercent >= outer.xPercent &&
    inner.xPercent + inner.widthPercent <= outer.xPercent + outer.widthPercent &&
    inner.yPercent >= outer.yPercent &&
    inner.yPercent + inner.heightPercent <= outer.yPercent + outer.heightPercent
  );
}

export const SHS_BUILDING_LABELS = new Set(
  shsZoneForLabels
    ? CAMPUS_ZONES.filter(
        (z) => z.id === shsZoneForLabels!.id || isWithinZone(z, shsZoneForLabels!)
      ).map((z) => z.label)
    : []
);

export function isShsBuildingLabel(label: string): boolean {
  return SHS_BUILDING_LABELS.has(label);
}
