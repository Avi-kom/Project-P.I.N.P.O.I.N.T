// Prototype-only identity layer — no real backend, no OAuth, no password.
// "Admin" is just an email allowlist checked client-side; "login" for
// students is just an email/name/section form remembered on this device.
// Do not treat any of this as a real security boundary.

export interface StudentProfile {
  email: string;
  name: string;
  section: string;
}

const PROFILE_KEY = "pinpoint_student_profile";

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getStudentProfile(): StudentProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as StudentProfile) : null;
  } catch {
    return null;
  }
}

export function setStudentProfile(profile: StudentProfile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearStudentProfile() {
  window.localStorage.removeItem(PROFILE_KEY);
}
