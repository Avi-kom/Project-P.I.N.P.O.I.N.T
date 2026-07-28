import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import type { MapStroke } from "@/lib/map-annotations";

const FILE_PATH = path.join(process.cwd(), "src", "lib", "map-annotations.ts");

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function generateFileContents(strokes: MapStroke[]): string {
  const body = strokes
    .map(
      (s) =>
        `  { id: ${JSON.stringify(s.id)}, mode: ${JSON.stringify(s.mode)}, width: ${round(
          s.width
        )}, points: [${s.points
          .map((p) => `{ x: ${round(p.x)}, y: ${round(p.y)} }`)
          .join(", ")}] }`
    )
    .join(",\n");

  return `// Freehand line edits drawn over the blueprint in the Map Editor. Each stroke
// is a polyline in combined-canvas percentages (0–100). "draw" strokes add dark
// ink lines; "erase" strokes paint the soil background colour to hide blueprint
// lines underneath. Written by /api/map-annotations from the editor.
export interface MapStroke {
  id: string;
  mode: "draw" | "erase";
  width: number; // screen px (constant regardless of zoom)
  points: { x: number; y: number }[];
}

export const MAP_ANNOTATIONS: MapStroke[] = [
${body}
];
`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const strokes = body?.strokes as MapStroke[] | undefined;

  if (!Array.isArray(strokes)) {
    return NextResponse.json({ ok: false, error: "Invalid strokes payload" }, { status: 400 });
  }

  for (const s of strokes) {
    if (
      typeof s.id !== "string" ||
      (s.mode !== "draw" && s.mode !== "erase") ||
      typeof s.width !== "number" ||
      !Array.isArray(s.points) ||
      s.points.some((p) => typeof p?.x !== "number" || typeof p?.y !== "number")
    ) {
      return NextResponse.json({ ok: false, error: "Malformed stroke" }, { status: 400 });
    }
  }

  await writeFile(FILE_PATH, generateFileContents(strokes), "utf-8");

  return NextResponse.json({ ok: true });
}
