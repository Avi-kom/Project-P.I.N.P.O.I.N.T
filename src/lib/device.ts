const DEVICE_KEY = "pinpoint_device_id";

// A stable random id for this browser/device, stored in localStorage. It lets
// staff spot when several submissions (even with different fake emails) come
// from the same device — a clue for tracking down a troll. It is NOT a real
// identity: it resets if the device's storage is cleared or a different
// browser/incognito is used.
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = window.localStorage.getItem(DEVICE_KEY);
    if (!id) {
      const rnd =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      id = rnd;
      window.localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}
