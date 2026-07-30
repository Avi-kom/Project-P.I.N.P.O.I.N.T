"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, User, Users, ShieldCheck, Lock } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAdminEmail, isValidEmail, setStudentProfile } from "@/lib/auth";
import { studentExists, registerStudent, verifyStudent } from "@/lib/students";

interface EntryGateProps {
  onComplete: () => void;
}

// "email"    → enter email
// "login"    → returning student, password only
// "register" → new student, name + section + password
// "details"  → legacy no-password fallback (used only when Supabase is off)
type Step = "email" | "login" | "register" | "details";

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

  function finish(profile: { email: string; name: string; section: string }) {
    setStudentProfile(profile);
    onComplete();
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    if (isAdminEmail(email)) {
      router.push("/admin/login");
      return;
    }
    setBusy(true);
    const res = await studentExists(email);
    setBusy(false);
    if (!res.ok) {
      // Supabase not configured (local dev) — keep the old password-less flow.
      setStep("details");
      return;
    }
    setStep(res.exists ? "login" : "register");
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setError("");
    setBusy(true);
    const res = await verifyStudent(email, password);
    setBusy(false);
    if (res.ok) {
      finish({ email: email.trim(), name: res.name, section: res.section });
      return;
    }
    setError(res.reason === "wrong" ? "Incorrect password." : "Couldn't reach the server. Try again.");
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
      finish({ email: email.trim(), name: name.trim(), section: section.trim() });
      return;
    }
    if (res.reason === "exists") {
      setStep("login");
      setPassword("");
      setError("That email is already registered — enter your password.");
      return;
    }
    setError("Couldn't create your account. Try again.");
  }

  // Legacy fallback when Supabase isn't configured (no password).
  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !section.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    finish({ email: email.trim(), name: name.trim(), section: section.trim() });
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
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Checking…" : "Continue"}
            </Button>
          </form>
        )}

        {step === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <p className="text-sm text-slate-400">
              Welcome back — <span className="text-slate-200">{email}</span>
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
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setPassword("");
                setError("");
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300"
            >
              Use a different email
            </button>
          </form>
        )}

        {step === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <p className="text-sm text-slate-400">
              New here — <span className="text-slate-200">{email}</span>. Create your account.
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
              onClick={() => {
                setStep("email");
                setPassword("");
                setConfirm("");
                setError("");
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300"
            >
              Use a different email
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

        <div className="border-t border-slate-800 pt-4 text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
}
