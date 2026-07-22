"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_PIN, setAdminAuthed } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setAdminAuthed(true);
      router.push("/admin");
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#0a1128] p-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-xl border border-amber-500/20 bg-[#0d152f] p-8 shadow-lg"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size="lg" iconOnly />
          <div>
            <h1 className="text-lg font-bold text-amber-400">Admin Panel</h1>
            <p className="text-sm text-slate-400">Enter the staff PIN to continue.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-200">PIN</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="Enter PIN"
              className="border-slate-700 bg-slate-900 pl-9 text-white placeholder:text-slate-500"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-400">Incorrect PIN. Try again.</p>}
        </div>

        <Button
          type="submit"
          className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400"
        >
          Sign In
        </Button>

        <p className="text-center text-xs text-slate-500">Prototype access code: 1234</p>
      </form>
    </div>
  );
}
