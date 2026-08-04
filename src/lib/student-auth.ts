import { supabase } from "./supabase";
import type { AuthError } from "@supabase/supabase-js";

function isRateLimit(error: AuthError): boolean {
  return (
    error.status === 429 ||
    /rate limit|too many|limit reached|over.?email.?send/i.test(error.message)
  );
}

// Real email-verified accounts via Supabase Auth. signUp sends a confirmation
// email (when "Confirm email" is enabled in the Supabase dashboard); the user
// can't sign in until they click the link. Name/section ride along in the
// auth user's metadata. Admins are handled separately (PIN) and don't use this.

export type SignUpResult =
  | { ok: true; needsConfirm: boolean }
  | { ok: false; reason: "exists" | "error"; message?: string };

export async function signUpStudent(
  email: string,
  password: string,
  name: string,
  section: string
): Promise<SignUpResult> {
  if (!supabase) return { ok: false, reason: "error" };
  const emailRedirectTo =
    typeof window !== "undefined" ? window.location.origin : undefined;
  const { data, error } = await supabase.auth.signUp({
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

export type SignInResult =
  | { ok: true; email: string; name: string; section: string }
  | { ok: false; reason: "wrong" | "unconfirmed" | "error"; message?: string };

export async function signInStudent(
  email: string,
  password: string
): Promise<SignInResult> {
  if (!supabase) return { ok: false, reason: "error" };
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    if (/not confirmed|confirm/i.test(error.message)) {
      return { ok: false, reason: "unconfirmed" };
    }
    if (/invalid/i.test(error.message)) {
      return { ok: false, reason: "wrong" };
    }
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

// Resend the confirmation email for an unconfirmed sign-up.
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
