"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, User, Users, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAdminEmail, isValidEmail, setStudentProfile } from "@/lib/auth";

interface EntryGateProps {
  onComplete: () => void;
}

export function EntryGate({ onComplete }: EntryGateProps) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "details">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [error, setError] = useState("");

  function handleEmailSubmit(e: React.FormEvent) {
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
    setStep("details");
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !section.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setStudentProfile({ email: email.trim(), name: name.trim(), section: section.trim() });
    onComplete();
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

        {step === "email" ? (
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
                  className="border-slate-700 bg-slate-800 pl-9 text-white placeholder:text-slate-500"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        ) : (
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
                  className="border-slate-700 bg-slate-800 pl-9 text-white placeholder:text-slate-500"
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
                  className="border-slate-700 bg-slate-800 pl-9 text-white placeholder:text-slate-500"
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
