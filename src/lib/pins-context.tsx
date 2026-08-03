"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { initialPins } from "./mock-data";
import type { Pin, PinStatus } from "./types";
import { useOnlineStatus } from "./use-online-status";
import { isSupabaseConfigured } from "./supabase";
import { fetchRemotePins, insertRemotePin, updateRemotePinStatus } from "./pins-remote";
import { ADMIN_PIN } from "./admin-auth";

const STORAGE_KEY = "pinpoint_pins_v1";
const FAKE_UPLOAD_DELAY_MS = 1500;

interface PinsContextValue {
  pins: Pin[];
  addPin: (pin: Pin) => void;
  setPinStatus: (id: string, status: PinStatus) => void;
  removePin: (id: string) => void;
  isOnline: boolean;
  pendingSyncCount: number;
}

const PinsContext = createContext<PinsContextValue | null>(null);

function loadLocalPins(): Pin[] {
  if (typeof window === "undefined") return initialPins;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialPins;
    const parsed = JSON.parse(raw) as Pin[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialPins;
  } catch {
    return initialPins;
  }
}

export function PinsProvider({ children }: { children: ReactNode }) {
  const [pins, setPins] = useState<Pin[]>(initialPins);
  const [hydrated, setHydrated] = useState(false);
  const isOnline = useOnlineStatus();
  const syncingIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const local = loadLocalPins();
      if (!cancelled) {
        setPins(local);
      }

      if (isSupabaseConfigured && navigator.onLine) {
        const remote = await fetchRemotePins();
        if (remote && !cancelled) {
          // Merge: remote is the source of truth, but keep any local pins
          // that haven't synced yet (created while offline) on top.
          const unsynced = local.filter((p) => !p.synced);
          const merged = [...remote, ...unsynced.filter((p) => !remote.some((r) => r.id === p.id))];
          setPins(merged);
        }
      }

      if (!cancelled) setHydrated(true);
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  }, [pins, hydrated]);

  const markSynced = useCallback((id: string) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, synced: true } : p)));
  }, []);

  const uploadPin = useCallback(
    (pin: Pin) => {
      if (syncingIds.current.has(pin.id)) return;
      syncingIds.current.add(pin.id);

      async function run() {
        if (isSupabaseConfigured) {
          const ok = await insertRemotePin(pin);
          syncingIds.current.delete(pin.id);
          if (ok) markSynced(pin.id);
        } else {
          setTimeout(() => {
            syncingIds.current.delete(pin.id);
            markSynced(pin.id);
          }, FAKE_UPLOAD_DELAY_MS);
        }
      }
      run();
    },
    [markSynced]
  );

  const addPin = useCallback(
    (pin: Pin) => {
      const newPin: Pin = { ...pin, synced: false };
      setPins((prev) => [...prev, newPin]);
      if (isOnline) uploadPin(newPin);
    },
    [isOnline, uploadPin]
  );

  const setPinStatus = useCallback((id: string, status: PinStatus) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    if (isSupabaseConfigured) updateRemotePinStatus(id, status);
  }, []);

  const removePin = useCallback((id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured) {
      // Delete from the cloud via the PIN-guarded server route (best-effort).
      fetch("/api/pins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pin: ADMIN_PIN }),
      }).catch(() => {});
    }
  }, []);

  // When connectivity comes back, flush anything still unsynced.
  useEffect(() => {
    if (!hydrated || !isOnline) return;
    for (const pin of pins) {
      if (!pin.synced) uploadPin(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, hydrated]);

  const pendingSyncCount = useMemo(() => pins.filter((p) => !p.synced).length, [pins]);

  const value = useMemo(
    () => ({ pins, addPin, setPinStatus, removePin, isOnline, pendingSyncCount }),
    [pins, addPin, setPinStatus, removePin, isOnline, pendingSyncCount]
  );

  return <PinsContext.Provider value={value}>{children}</PinsContext.Provider>;
}

export function usePins() {
  const ctx = useContext(PinsContext);
  if (!ctx) throw new Error("usePins must be used within a PinsProvider");
  return ctx;
}
