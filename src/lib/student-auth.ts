import { supabase } from "./supabase";
import type { AuthError } from "@supabase/supabase-js";

// ── Email verification switch ────────────────────────────────────────────────
// false → simple password sign-in (uses the `students` table + RPCs, NO emails
//         sent, so no email-rate-limit issues).
// true  → real email verification via Supabase Auth (needs SMTP + "Confirm
//         email" enabled in the dashboard — see supabase/EMAIL-AUTH-SETUP.md).
// Flip this and nothing else to turn verification back on.
export const EMAIL_VERIFICATION_ENABLED = false;

function isRateLimit(error: AuthError): boolean {
  return (
    error.status === 429 ||
    /rate limit|too many|limit reached|over.?email.?send/i.test(error.message)
  );
}

export type SignUpResult =
  | { ok: true; needsConfirm: boolean }
  | { ok: false; reason: "exists" | "error"; message?: string };

export type SignInResult =
  | { ok: true; email: string; name: string; section: string }
  | { ok: false; reason: "wrong" | "unconfirmed" | "error"; message?: string };

// ── Public API (delegates based on the switch above) ─────────────────────────

export async function signUpStudent(
  email: string,
  password: string,
  name: string,
  section: string
): Promise<SignUpResult> {
  if (!supabase) return { ok: false, reason: "error" };
  return EMAIL_VERIFICATION_ENABLED
    ? signUpAuth(email, password, name, section)
    : signUpCustom(email, password, name, section);
}

export async function signInStudent(email: string, password: string): Promise<SignInResult> {
  if (!supabase) return { ok: false, reason: "error" };
  return EMAIL_VERIFICATION_ENABLED
    ? signInAuth(email, password)
    : signInCustom(email, password);
}

// ── Password-only flow (no emails) via the students table RPCs ───────────────

async function signUpCustom(
  email: string,
  password: string,
  name: string,
  section: string
): Promise<SignUpResult> {
  const { data, error } = await supabase!.rpc("register_student", {
    p_email: email.trim(),
    p_name: name,
    p_section: section,
    p_password: password,
  });
  if (error) return { ok: false, reason: "error", message: error.message };
  if (data === "exists") return { ok: false, reason: "exists" };
  return { ok: true, needsConfirm: false };
}

async function signInCustom(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase!.rpc("verify_student", {
    p_email: email.trim(),
    p_password: password,
  });
  if (error) return { ok: false, reason: "error", message: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, reason: "wrong" };
  return { ok: true, email: email.trim(), name: row.name, section: row.section };
}

// ── Email-verified flow via Supabase Auth ────────────────────────────────────

async function signUpAuth(
  email: string,
  password: string,
  name: string,
  section: string
): Promise<SignUpResult> {
  const emailRedirectTo =
    typeof window !== "undefined" ? window.location.origin : undefined;
  const { data, error } = await supabase!.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name, section }, emailRedirectTo },
  });
  if (error) {
    if (/already|exists|registered/i.test(error.message)) {
      return { ok: false, reason: "exists" };
    }
    if (isRateLimit(error)) {
      return {
        ok: false,
        reason: "error",
        message:
          "Too many sign-ups right now (email limit). Please wait a few minutes and try again.",
      };
    }
    return { ok: false, reason: "error", message: error.message };
  }
  // With email confirmation on, there's no session until the link is clicked.
  return { ok: true, needsConfirm: !data.session };
}

async function signInAuth(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase!.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    if (/not confirmed|confirm/i.test(error.message)) return { ok: false, reason: "unconfirmed" };
    if (/invalid/i.test(error.message)) return { ok: false, reason: "wrong" };
    return { ok: false, reason: "error", message: error.message };
  }
  const user = data.user;
  const meta = (user?.user_metadata ?? {}) as { name?: string; section?: string };
  return {
    ok: true,
    email: user?.email ?? email.trim(),
    name: meta.name ?? "Student",
    section: meta.section ?? "",
  };
}

// Resend the confirmation email (Auth flow only).
export async function resendConfirmation(email: string): Promise<boolean> {
  if (!supabase) return false;
  const emailRedirectTo =
    typeof window !== "undefined" ? window.location.origin : undefined;
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo },
  });
  return !error;
}

export async function signOutStudent(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }
}
