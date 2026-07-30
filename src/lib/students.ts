import { supabase } from "./supabase";

// Prototype student password layer. Passwords are hashed with bcrypt inside
// Supabase (see supabase/students.sql) and verified via SECURITY DEFINER RPCs,
// so hashes never reach the browser. When Supabase isn't configured these
// return an "unavailable" result and the caller falls back to the old
// password-less flow (local dev).

export type ExistsResult =
  | { ok: true; exists: boolean }
  | { ok: false };

export async function studentExists(email: string): Promise<ExistsResult> {
  if (!supabase) return { ok: false };
  const { data, error } = await supabase.rpc("student_exists", { p_email: email });
  if (error) return { ok: false };
  return { ok: true, exists: Boolean(data) };
}

export type RegisterResult =
  | { ok: true }
  | { ok: false; reason: "exists" | "error" };

export async function registerStudent(
  email: string,
  name: string,
  section: string,
  password: string
): Promise<RegisterResult> {
  if (!supabase) return { ok: false, reason: "error" };
  const { data, error } = await supabase.rpc("register_student", {
    p_email: email,
    p_name: name,
    p_section: section,
    p_password: password,
  });
  if (error) return { ok: false, reason: "error" };
  if (data === "exists") return { ok: false, reason: "exists" };
  return { ok: true };
}

export type VerifyResult =
  | { ok: true; name: string; section: string }
  | { ok: false; reason: "wrong" | "error" };

export async function verifyStudent(
  email: string,
  password: string
): Promise<VerifyResult> {
  if (!supabase) return { ok: false, reason: "error" };
  const { data, error } = await supabase.rpc("verify_student", {
    p_email: email,
    p_password: password,
  });
  if (error) return { ok: false, reason: "error" };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, reason: "wrong" };
  return { ok: true, name: row.name, section: row.section };
}
