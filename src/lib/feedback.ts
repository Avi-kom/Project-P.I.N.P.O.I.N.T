import { supabase } from "./supabase";

export interface Feedback {
  id: string;
  message: string;
  role: "student" | "admin";
  name: string;
  email: string;
  device_id?: string;
  created_at?: string;
}

const QUEUE_KEY = "pinpoint_feedback_queue";

function queueLocally(entry: Feedback) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const list = raw ? (JSON.parse(raw) as Feedback[]) : [];
    list.push(entry);
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/**
 * Submit feedback. Sends to Supabase when configured/online; otherwise saves
 * it locally so nothing is lost. Returns whether it reached the cloud.
 */
export async function submitFeedback(entry: Feedback): Promise<boolean> {
  if (!supabase || (typeof navigator !== "undefined" && !navigator.onLine)) {
    queueLocally(entry);
    return false;
  }
  const base = {
    id: entry.id,
    message: entry.message,
    role: entry.role,
    name: entry.name,
    email: entry.email,
  };
  let { error } = await supabase.from("feedback").insert({ ...base, device_id: entry.device_id });
  // If the device_id column hasn't been added yet, fall back to the base insert
  // so feedback is never lost.
  if (error) {
    ({ error } = await supabase.from("feedback").insert(base));
  }
  if (error) {
    queueLocally(entry);
    return false;
  }
  return true;
}

export async function fetchFeedback(): Promise<Feedback[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return null;
  return data as Feedback[];
}

// Deletes a feedback entry via the PIN-guarded server route. Returns true on
// success.
export async function deleteFeedback(id: string, pin: string): Promise<boolean> {
  try {
    const res = await fetch("/api/feedback", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pin }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
