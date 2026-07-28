import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import type { CampusZone } from "@/lib/campus-layout";

const FILE_PATH = path.join(process.cwd(), "src", "lib", "campus-layout.ts");

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function generateFileContents(zones: CampusZone[]): string {
  const zoneEntries = zones
    .map(
      (zone) => `  {
    id: ${JSON.stringify(zone.id)},
    label: ${JSON.stringify(zone.label)},
    xPercent: ${round(zone.xPercent)},
    yPercent: ${round(zone.yPercent)},
    widthPercent: ${round(zone.widthPercent)},
    heightPercent: ${round(zone.heightPercent)},
    color: ${JSON.stringify(zone.color)},
    labelColor: ${JSON.stringify(zone.labelColor)},
  }`
    )
    .join(",\n");

  return `export interface CampusZone {
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
${zoneEntries}
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
`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const zones = body?.zones as CampusZone[] | undefined;

  if (!Array.isArray(zones)) {
    return NextResponse.json({ ok: false, error: "Invalid zones payload" }, { status: 400 });
  }

  for (const zone of zones) {
    if (
      typeof zone.id !== "string" ||
      typeof zone.label !== "string" ||
      typeof zone.xPercent !== "number" ||
      typeof zone.yPercent !== "number" ||
      typeof zone.widthPercent !== "number" ||
      typeof zone.heightPercent !== "number" ||
      typeof zone.color !== "string" ||
      typeof zone.labelColor !== "string"
    ) {
      return NextResponse.json({ ok: false, error: "Malformed zone entry" }, { status: 400 });
    }
  }

  await writeFile(FILE_PATH, generateFileContents(zones), "utf-8");

  return NextResponse.json({ ok: true });
}
