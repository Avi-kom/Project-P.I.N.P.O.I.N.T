"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2, MapPin, Loader2, CloudOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getDeviceId } from "@/lib/device";
import { uploadReportPhoto } from "@/lib/photo-upload";

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
  const [exactLocation, setExactLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    setUploading(true);
    try {
      const result = await uploadReportPhoto(file);
      setPhotoUrl(result.url);
      setPhotoUploaded(result.uploaded);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Could not attach photo.");
    } finally {
      setUploading(false);
      // allow re-selecting the same file
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function resetForm() {
    setLevel("1");
    setDescription("");
    setExactLocation("");
    setPhotoUrl(null);
    setPhotoUploaded(false);
    setUploading(false);
    setPhotoError("");
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
      photoUrl: photoUrl ?? "https://placehold.co/400x300?text=No+Photo",
      status: "Pending",
      synced: false,
      reporterName: profile?.name ?? "Unknown",
      reporterSection: profile?.section ?? "Unknown",
      reporterEmail: profile?.email ?? "unknown",
      exactLocation: exactLocation.trim() || undefined,
      createdAt: new Date().toISOString(),
      deviceId: getDeviceId(),
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Issue</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Location: <span className="font-medium">{building}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Risk Level</label>
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
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Exact location <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              value={exactLocation}
              onChange={(e) => setExactLocation(e.target.value)}
              placeholder="e.g. near the back window, 3rd from the left"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  {photoUrl ? "Change Photo" : "Take / Choose Photo"}
                </>
              )}
            </Button>

            {photoError && <p className="text-xs text-red-500">{photoError}</p>}

            {photoUrl && !uploading && (
              <div
                className={
                  photoUploaded
                    ? "flex items-center gap-2 pt-1 text-sm text-green-500"
                    : "flex items-center gap-2 pt-1 text-sm text-amber-500"
                }
              >
                {photoUploaded ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Photo uploaded
                  </>
                ) : (
                  <>
                    <CloudOff className="h-4 w-4" />
                    Saved on device — will upload when online
                  </>
                )}
              </div>
            )}

            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- source may be a data: URL
              <img
                src={photoUrl}
                alt="Attached issue"
                className="mt-1 max-h-56 w-full rounded-md border border-border object-cover"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!description.trim() || uploading}>
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
