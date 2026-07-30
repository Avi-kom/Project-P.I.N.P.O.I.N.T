"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, User, Users, Lock } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEmail, setStudentProfile } from "@/lib/auth";
import { registerStudent, verifyStudent } from "@/lib/students";
import { isStaff, registerStaff } from "@/lib/staff-remote";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ADMIN_PIN, setAdminAuthed } from "@/lib/admin-auth";

interface EntryGateProps {
  onComplete: () => void;
}

// One sign-in for everyone. Enter email, then a password:
//  • the admin PIN → admin panel (and the email is saved as staff)
//  • a staff email's own password → admin panel
//  • a student's own password → the map
// "register" creates a new student; "details" is the no-Supabase fallback.
type Step = "email" | "password" | "register" | "details";

const MIN_PASSWORD = 4;

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

  const inputClass =
    "border-slate-700 bg-slate-800 pl-9 text-white placeholder:text-slate-500";

  function finishStudent(profile: { email: string; name: string; section: string }) {
    setStudentProfile(profile);
    onComplete();
  }

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
      goAdmin();
      return;
    }

    // Without Supabase (local dev) fall back to a password-less student profile.
    if (!isSupabaseConfigured) {
      setStep("details");
      return;
    }

    setBusy(true);
    const res = await verifyStudent(email, password);
    if (res.ok) {
      const staff = await isStaff(email);
      setBusy(false);
      if (staff) {
        goAdmin();
      } else {
        finishStudent({ email: email.trim(), name: res.name, section: res.section });
      }
      return;
    }
    setBusy(false);
    setError(
      res.reason === "wrong"
        ? "Incorrect password. New here? Create an account below."
        : "Couldn't reach the server. Try again."
    );
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
    const res = await registerStudent(email.trim(), name.trim(), section.trim(), password);
    setBusy(false);
    if (res.ok) {
      finishStudent({ email: email.trim(), name: name.trim(), section: section.trim() });
      return;
    }
    if (res.reason === "exists") {
      setStep("password");
      setPassword("");
      setError("That email is already registered — enter your password.");
      return;
    }
    setError("Couldn't create your account. Try again.");
  }

  // No-Supabase fallback (local dev): name + section, no password.
  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !section.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    finishStudent({ email: email.trim(), name: name.trim(), section: section.trim() });
  }

  function backToEmail() {
    setStep("email");
    setPassword("");
    setConfirm("");
    setError("");
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
              <button
                type="button"
                onClick={backToEmail}
                className="text-slate-500 hover:text-slate-300"
              >
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
                  placeholder="Create a password"
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
              {busy ? "Creating…" : "Create account & enter"}
            </Button>
            <button
              type="button"
              onClick={backToEmail}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300"
            >
              Change email
            </button>
          </form>
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
