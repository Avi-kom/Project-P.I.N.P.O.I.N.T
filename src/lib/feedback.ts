import { supabase } from "./supabase";

export interface Feedback {
  id: string;
  message: string;
  role: "student" | "admin";
  name: string;
  email: string;
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
  const { error } = await supabase.from("feedback").insert({
    id: entry.id,
    message: entry.message,
    role: entry.role,
    name: entry.name,
    email: entry.email,
  });
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
