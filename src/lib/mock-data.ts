import type { Pin } from "./types";

// No seeded indicators — the map starts empty. Real reports come from Supabase
// (or local device storage when offline) as students submit and staff approve.
export const initialPins: Pin[] = [];
