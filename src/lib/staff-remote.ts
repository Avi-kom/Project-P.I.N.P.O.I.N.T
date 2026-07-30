import { supabase } from "./supabase";

// Staff registry access (see supabase/staff.sql). An email becomes staff by
// signing in with the admin PIN as the password; afterwards is_staff() lets
// them reach the admin panel with their own password too.

export async function isStaff(email: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("is_staff", { p_email: email });
  return !error && Boolean(data);
}

// Registers the email as staff. The PIN/code is verified server-side, so this
// only succeeds when the correct code is passed. Returns true on success.
export async function registerStaff(email: string, code: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("register_staff", {
    p_email: email,
    p_code: code,
  });
  return !error && Boolean(data);
}
