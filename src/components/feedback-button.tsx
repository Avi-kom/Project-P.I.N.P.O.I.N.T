"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackModal } from "@/components/feedback-modal";
import { cn } from "@/lib/utils";

interface FeedbackButtonProps {
  role: "student" | "admin";
  className?: string;
  label?: string;
}

export function FeedbackButton({ role, className, label = "Feedback" }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn("flex items-center gap-2", className)}
      >
        <MessageSquarePlus className="h-4 w-4" />
        {label}
      </button>
      <FeedbackModal open={open} onOpenChange={setOpen} role={role} />
    </>
  );
}
