"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, CheckCircle2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FloorId, Pin } from "@/lib/types";
import { getStudentProfile } from "@/lib/auth";

interface ReportIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floorId: FloorId;
  xCoord: number;
  yCoord: number;
  building: string;
  onSubmit: (pin: Pin) => void;
}

export function ReportIssueModal({
  open,
  onOpenChange,
  floorId,
  xCoord,
  yCoord,
  building,
  onSubmit,
}: ReportIssueModalProps) {
  const [level, setLevel] = useState<"1" | "2" | "3">("1");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  function handleAttachPhoto() {
    const seed = Math.floor(Math.random() * 100000);
    setPhotoUrl(`https://placehold.co/400x300?text=Issue+Photo+${seed}`);
  }

  function resetForm() {
    setLevel("1");
    setDescription("");
    setPhotoUrl(null);
  }

  function handleSubmit() {
    if (!description.trim()) return;

    const profile = getStudentProfile();

    const newPin: Pin = {
      id: `pin-${Date.now()}`,
      floorId,
      xCoord,
      yCoord,
      level: Number(level) as 1 | 2 | 3,
      building,
      description: description.trim(),
      photoUrl: photoUrl ?? "https://placehold.co/400x300?text=Issue+Photo",
      status: "Pending",
      synced: false,
      reporterName: profile?.name ?? "Unknown",
      reporterSection: profile?.section ?? "Unknown",
      reporterEmail: profile?.email ?? "unknown",
    };

    onSubmit(newPin);
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Issue</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
            <MapPin className="h-4 w-4 text-slate-500" />
            Location: <span className="font-medium">{building}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Risk Level
            </label>
            <Select value={level} onValueChange={(v) => setLevel(v as "1" | "2" | "3")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Level 1 · Low Risk</SelectItem>
                <SelectItem value="2">Level 2 · Moderate</SelectItem>
                <SelectItem value="3">Level 3 · Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Photo</label>
            <Button type="button" variant="outline" onClick={handleAttachPhoto}>
              <Camera className="mr-2 h-4 w-4" />
              Attach Photo
            </Button>
            {photoUrl && (
              <div className="flex items-center gap-2 pt-1 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Photo Attached
              </div>
            )}
            {photoUrl && (
              <Image
                src={photoUrl}
                alt="Attached issue photo"
                width={400}
                height={300}
                className="mt-1 w-full rounded-md border"
                unoptimized
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!description.trim()}>
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
