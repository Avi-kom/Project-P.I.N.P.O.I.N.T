// Prototype-only access gate — not real authentication. The PIN is
// checked entirely client-side, so treat this as a UX affordance, not
// a security boundary.
export const ADMIN_PIN = "0713";
const SESSION_KEY = "pinpoint_admin_authed";

export function isAdminAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SESSION_KEY) === "true";
}

export function setAdminAuthed(authed: boolean) {
  if (authed) {
    window.sessionStorage.setItem(SESSION_KEY, "true");
  } else {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}
