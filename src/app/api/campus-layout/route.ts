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

// Edit this list to match your real campus layout, or use the visual
// editor at /editor — it writes this file for you.
// x/y/width/height are percentages of the map canvas (0-100),
// measured from the top-left corner.
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
