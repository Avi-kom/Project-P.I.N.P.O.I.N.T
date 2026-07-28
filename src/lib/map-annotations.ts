// Freehand line edits drawn over the blueprint in the Map Editor. Each stroke
// is a polyline in combined-canvas percentages (0–100). "draw" strokes add dark
// ink lines; "erase" strokes paint the soil background colour to hide blueprint
// lines underneath. Written by /api/map-annotations from the editor.
export interface MapStroke {
  id: string;
  mode: "draw" | "erase";
  width: number; // screen px (constant regardless of zoom)
  points: { x: number; y: number }[];
}

export const MAP_ANNOTATIONS: MapStroke[] = [];
