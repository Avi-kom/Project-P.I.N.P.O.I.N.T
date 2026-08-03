"use client";

import { useEffect, useState } from "react";
import { MessageSquare, User, ShieldCheck, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackButton } from "@/components/feedback-button";
import { fetchFeedback, deleteFeedback, type Feedback } from "@/lib/feedback";
import { ADMIN_PIN } from "@/lib/admin-auth";

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFeedback().then((data) => {
      if (!cancelled) {
        setItems(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this feedback? This can't be undone.")) return;
    setDeletingId(id);
    const ok = await deleteFeedback(id, ADMIN_PIN);
    setDeletingId(null);
    if (ok) {
      setItems((prev) => (prev ? prev.filter((f) => f.id !== id) : prev));
    } else {
      window.alert("Couldn't delete that feedback. Try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Feedback</h1>
          <p className="text-sm text-slate-400">
            Improvement suggestions from students and staff.
          </p>
        </div>
        <FeedbackButton
          role="admin"
          label="Send Feedback"
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : items === null ? (
        <p className="rounded-md border border-dashed border-slate-700 bg-[#0d152f] p-8 text-center text-sm text-slate-400">
          Feedback storage isn&apos;t connected yet. Run <code>supabase/feedback.sql</code> in
          your Supabase project to enable it.
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-700 bg-[#0d152f] p-8 text-center text-sm text-slate-400">
          No feedback yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((f) => (
            <Card key={f.id} className="border-slate-800 bg-[#0d152f]">
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={
                      f.role === "admin"
                        ? "border-amber-700/50 bg-amber-950/60 text-amber-300"
                        : "border-blue-700/50 bg-blue-950/60 text-blue-300"
                    }
                  >
                    {f.role === "admin" ? (
                      <ShieldCheck className="mr-1 h-3 w-3" />
                    ) : (
                      <User className="mr-1 h-3 w-3" />
                    )}
                    {f.role === "admin" ? "Staff" : "Student"}
                  </Badge>
                  {f.created_at && (
                    <span className="text-xs text-slate-500">
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="flex gap-2 text-sm text-slate-200">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  {f.message}
                </p>
                <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-2">
                  <p className="min-w-0 truncate text-xs text-slate-500">
                    {f.name}
                    {f.email && f.email !== "unknown" ? ` · ${f.email}` : ""}
                  </p>
                  <button
                    onClick={() => handleDelete(f.id)}
                    disabled={deletingId === f.id}
                    aria-label="Delete feedback"
                    className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === f.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
