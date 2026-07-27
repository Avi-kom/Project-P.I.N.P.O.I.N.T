import { supabase } from "./supabase";

const BUCKET = "report-photos";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export interface PhotoResult {
  url: string;
  // true when the photo was uploaded to the cloud; false when it's a local
  // data URL held on-device (offline, or Supabase Storage not reachable).
  uploaded: boolean;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a photo to Supabase Storage and returns its public URL. Falls back
 * to an inline data URL when Supabase isn't configured, the device is
 * offline, or the upload fails — so a report can always still be filed.
 */
export async function uploadReportPhoto(file: File): Promise<PhotoResult> {
  if (file.size > MAX_BYTES) {
    throw new Error("Photo is too large. Please choose an image under 8 MB.");
  }

  const dataUrl = await readAsDataUrl(file);

  if (!supabase || typeof navigator !== "undefined" && !navigator.onLine) {
    return { url: dataUrl, uploaded: false };
  }

  try {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) return { url: dataUrl, uploaded: false };

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, uploaded: true };
  } catch {
    return { url: dataUrl, uploaded: false };
  }
}
