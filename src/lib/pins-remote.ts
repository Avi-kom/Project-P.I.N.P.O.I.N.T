import { supabase } from "./supabase";
import type { Pin, RiskLevel } from "./types";

interface PinRow {
  id: string;
  floor_id: number;
  x_coord: number;
  y_coord: number;
  level: string;
  description: string;
  photo_url: string;
  status: string;
  building: string;
  reporter_name: string;
  reporter_section: string;
  reporter_email: string;
  exact_location?: string | null;
  device_id?: string | null;
  created_at?: string;
}

function rowToPin(row: PinRow): Pin {
  return {
    id: row.id,
    floorId: row.floor_id as Pin["floorId"],
    xCoord: row.x_coord,
    yCoord: row.y_coord,
    level: (row.level === "Fixed" ? "Fixed" : Number(row.level)) as RiskLevel,
    description: row.description,
    photoUrl: row.photo_url,
    status: row.status as Pin["status"],
    building: row.building,
    reporterName: row.reporter_name,
    reporterSection: row.reporter_section,
    reporterEmail: row.reporter_email,
    exactLocation: row.exact_location ?? undefined,
    deviceId: row.device_id ?? undefined,
    createdAt: row.created_at,
    synced: true,
  };
}

function pinToRow(pin: Pin): PinRow {
  return {
    id: pin.id,
    floor_id: pin.floorId,
    x_coord: pin.xCoord,
    y_coord: pin.yCoord,
    level: String(pin.level),
    description: pin.description,
    photo_url: pin.photoUrl,
    status: pin.status,
    building: pin.building,
    reporter_name: pin.reporterName,
    reporter_section: pin.reporterSection,
    reporter_email: pin.reporterEmail,
    exact_location: pin.exactLocation ?? null,
    device_id: pin.deviceId ?? null,
  };
}

export async function fetchRemotePins(): Promise<Pin[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pins")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data) return null;
  return (data as PinRow[]).map(rowToPin);
}

export async function insertRemotePin(pin: Pin): Promise<boolean> {
  if (!supabase) return false;
  const row = pinToRow(pin);
  let { error } = await supabase.from("pins").insert(row);
  if (error) {
    // Optional columns (exact_location / device_id) may not exist yet in the
    // deployed schema — retry without them so the report still syncs.
    const { exact_location, device_id, ...base } = row;
    void exact_location;
    void device_id;
    ({ error } = await supabase.from("pins").insert(base));
  }
  return !error;
}

export async function updateRemotePinStatus(
  id: string,
  status: Pin["status"]
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("pins").update({ status }).eq("id", id);
  return !error;
}
