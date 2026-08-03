"use client";

import { useState } from "react";
import { MessageSquarePlus, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/feedback";
import { getStudentProfile } from "@/lib/auth";
import { getDeviceId } from "@/lib/device";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: "student" | "admin";
}

export function FeedbackModal({ open, onOpenChange, role }: FeedbackModalProps) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  function reset() {
    setMessage("");
    setState("idle");
  }

  async function handleSubmit() {
    if (!message.trim()) return;
    setState("sending");
    const profile = role === "student" ? getStudentProfile() : null;
    await submitFeedback({
      id: `fb-${Date.now()}`,
      message: message.trim(),
      role,
      name: profile?.name ?? (role === "admin" ? "Staff" : "Anonymous"),
      email: profile?.email ?? "unknown",
      device_id: getDeviceId(),
    });
    setState("done");
    setTimeout(() => {
      reset();
      onOpenChange(false);
    }, 1400);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-amber-500" />
            Send Feedback
          </DialogTitle>
        </DialogHeader>

        {state === "done" ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium">Thanks for your feedback!</p>
            <p className="text-xs text-muted-foreground">
              Your suggestion helps improve P.I.N.P.O.I.N.T.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Found a bug or have an idea to make the site better? Let us know.
              </p>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your feedback or suggestion..."
                rows={5}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!message.trim() || state === "sending"}>
                {state === "sending" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
