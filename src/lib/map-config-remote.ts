import { supabase } from "./supabase";
import type { CampusZone } from "./campus-layout";
import type { MapStroke } from "./map-annotations";

const CONFIG_ID = "default";

export interface MapConfig {
  zones: CampusZone[];
  annotations: MapStroke[];
}

// Loads the saved layout (tap-areas + line edits) from Supabase, or null if it
// isn't configured / no row exists yet (callers fall back to the static file).
export async function fetchMapConfig(): Promise<MapConfig | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("map_config")
    .select("zones, annotations")
    .eq("id", CONFIG_ID)
    .maybeSingle();
  if (error || !data || !Array.isArray(data.zones)) return null;
  return {
    zones: data.zones as CampusZone[],
    annotations: Array.isArray(data.annotations) ? (data.annotations as MapStroke[]) : [],
  };
}

// Persists the layout to Supabase so the Map Editor's Save works on the
// deployed site. Returns false if Supabase isn't configured or the write fails.
export async function saveMapConfig(
  zones: CampusZone[],
  annotations: MapStroke[]
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("map_config").upsert({
    id: CONFIG_ID,
    zones,
    annotations,
    updated_at: new Date().toISOString(),
  });
  return !error;
}
