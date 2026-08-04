"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, User, Users, Lock, MailCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEmail, setStudentProfile, getStudentProfile } from "@/lib/auth";
import { signUpStudent, signInStudent, resendConfirmation } from "@/lib/student-auth";
import { isStaff, registerStaff } from "@/lib/staff-remote";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ADMIN_PIN, setAdminAuthed } from "@/lib/admin-auth";

interface EntryGateProps {
  onComplete: () => void;
}

// One sign-in for everyone. Enter email, then a password:
//  • the admin PIN → admin panel (and the email is saved as staff)
//  • a verified student's email + password → the map
// "register" creates a new account and emails a confirmation link; "confirm"
// tells them to click it; "details" is the no-Supabase fallback.
type Step = "email" | "password" | "register" | "confirm" | "details";

const MIN_PASSWORD = 6; // Supabase Auth requires at least 6

export function EntryGate({ onComplete }: EntryGateProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  const inputClass =
    "border-slate-700 bg-slate-800 pl-9 text-white placeholder:text-slate-500";

  function goAdmin() {
    setAdminAuthed(true);
    router.push("/admin");
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setStep("password");
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setError("");

    // The PIN unlocks the admin panel from the normal sign-in.
    if (password === ADMIN_PIN) {
      setBusy(true);
      await registerStaff(email.trim(), password);
      setBusy(false);
      if (!getStudentProfile()) {
        setStudentProfile({ email: email.trim(), name: "Staff", section: "Staff" });
      }
      goAdmin();
      return;
    }

    // Without Supabase (local dev) fall back to a password-less student profile.
    if (!isSupabaseConfigured) {
      setStep("details");
      return;
    }

    setBusy(true);
    const res = await signInStudent(email, password);
    if (res.ok) {
      const staff = await isStaff(email);
      setBusy(false);
      setStudentProfile({ email: res.email, name: res.name, section: res.section });
      if (staff) goAdmin();
      else onComplete();
      return;
    }
    setBusy(false);
    if (res.reason === "unconfirmed") {
      setStep("confirm");
    } else if (res.reason === "wrong") {
      setError("Incorrect password. New here? Create an account below.");
    } else {
      setError(res.message || "Couldn't sign in. Try again.");
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !section.trim()) {
      setError("Please fill in your name and section.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setBusy(true);
    const res = await signUpStudent(email.trim(), password, name.trim(), section.trim());
    setBusy(false);
    if (res.ok) {
      if (res.needsConfirm) {
        setStep("confirm");
      } else {
        // Email confirmation is off in the project — treat as signed in.
        setStudentProfile({ email: email.trim(), name: name.trim(), section: section.trim() });
        onComplete();
      }
      return;
    }
    if (res.reason === "exists") {
      setStep("password");
      setPassword("");
      setError("That email is already registered — enter your password.");
      return;
    }
    setError(res.message || "Couldn't create your account. Try again.");
  }

  async function handleResend() {
    setBusy(true);
    const ok = await resendConfirmation(email.trim());
    setBusy(false);
    setResent(ok);
    if (!ok) setError("Couldn't resend. Try again in a bit.");
  }

  // No-Supabase fallback (local dev): name + section, no password.
  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !section.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setStudentProfile({ email: email.trim(), name: name.trim(), section: section.trim() });
    onComplete();
  }

  function backToEmail() {
    setStep("email");
    setPassword("");
    setConfirm("");
    setError("");
    setResent(false);
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-950 p-6 sm:p-8">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size="lg" iconOnly />
          <div>
            <h1 className="text-lg font-bold text-white">P.I.N.P.O.I.N.T.</h1>
            <p className="text-sm text-slate-400">See it. Pin it. Solve it.</p>
          </div>
        </div>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@gmail.com"
                  className={inputClass}
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p className="text-sm text-slate-400">
              Signed in as <span className="text-slate-200">{email}</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Your password"
                  className={inputClass}
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Enter Campus Map"}
            </Button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("register");
                  setPassword("");
                  setError("");
                }}
                className="text-amber-400 hover:text-amber-300"
              >
                New student? Create an account
              </button>
              <button type="button" onClick={backToEmail} className="text-slate-500 hover:text-slate-300">
                Change email
              </button>
            </div>
          </form>
        )}

        {step === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <p className="text-sm text-slate-400">
              Create your account — <span className="text-slate-200">{email}</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200">Full Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder="Juan Dela Cruz"
                  className={inputClass}
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200">Grade & Section</label>
              <div className="relative">
                <Users className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={section}
                  onChange={(e) => {
                    setSection(e.target.value);
                    setError("");
                  }}
                  placeholder="Grade 11 - STEM A"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="At least 6 characters"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200">Confirm Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError("");
                  }}
                  placeholder="Re-enter your password"
                  className={inputClass}
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </Button>
            <button type="button" onClick={backToEmail} className="w-full text-center text-xs text-slate-500 hover:text-slate-300">
              Change email
            </button>
          </form>
        )}

        {step === "confirm" && (
          <div className="space-y-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <MailCheck className="h-10 w-10 text-amber-400" />
              <p className="text-sm font-medium text-white">Confirm your email</p>
              <p className="text-sm text-slate-400">
                We sent a confirmation link to{" "}
                <span className="text-slate-200">{email}</span>. Open it, then come back and
                sign in.
              </p>
              {resent && <p className="text-xs text-green-400">Confirmation email re-sent.</p>}
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setStep("password");
                setError("");
              }}
            >
              I&apos;ve confirmed — sign in
            </Button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleResend}
                disabled={busy}
                className="text-amber-400 hover:text-amber-300 disabled:opacity-50"
              >
                {busy ? "Resending…" : "Resend email"}
              </button>
              <button type="button" onClick={backToEmail} className="text-slate-500 hover:text-slate-300">
                Use a different email
              </button>
            </div>
          </div>
        )}

        {step === "details" && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <p className="text-sm text-slate-400">
              Signed in as <span className="text-slate-200">{email}</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200">Full Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  placeholder="Juan Dela Cruz"
                  className={inputClass}
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200">Grade & Section</label>
              <div className="relative">
                <Users className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={section}
                  onChange={(e) => {
                    setSection(e.target.value);
                    setError("");
                  }}
                  placeholder="Grade 11 - STEM A"
                  className={inputClass}
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
            <Button type="submit" className="w-full">
              Enter Campus Map
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
