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

const STORAGE_KEY = "pinpoint_pins_v1";
const FAKE_UPLOAD_DELAY_MS = 1500;

interface PinsContextValue {
  pins: Pin[];
  addPin: (pin: Pin) => void;
  setPinStatus: (id: string, status: PinStatus) => void;
  isOnline: boolean;
  pendingSyncCount: number;
}

const PinsContext = createContext<PinsContextValue | null>(null);

function loadPins(): Pin[] {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync persisted pins from localStorage, unavailable during SSR
    setPins(loadPins());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  }, [pins, hydrated]);

  const markSynced = useCallback((id: string) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, synced: true } : p)));
  }, []);

  const uploadPin = useCallback(
    (id: string) => {
      if (syncingIds.current.has(id)) return;
      syncingIds.current.add(id);
      setTimeout(() => {
        syncingIds.current.delete(id);
        markSynced(id);
      }, FAKE_UPLOAD_DELAY_MS);
    },
    [markSynced]
  );

  const addPin = useCallback(
    (pin: Pin) => {
      const newPin: Pin = { ...pin, synced: false };
      setPins((prev) => [...prev, newPin]);
      if (isOnline) uploadPin(newPin.id);
    },
    [isOnline, uploadPin]
  );

  const setPinStatus = useCallback((id: string, status: PinStatus) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  // When connectivity comes back, flush anything still unsynced.
  useEffect(() => {
    if (!hydrated || !isOnline) return;
    for (const pin of pins) {
      if (!pin.synced) uploadPin(pin.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, hydrated]);

  const pendingSyncCount = useMemo(() => pins.filter((p) => !p.synced).length, [pins]);

  const value = useMemo(
    () => ({ pins, addPin, setPinStatus, isOnline, pendingSyncCount }),
    [pins, addPin, setPinStatus, isOnline, pendingSyncCount]
  );

  return <PinsContext.Provider value={value}>{children}</PinsContext.Provider>;
}

export function usePins() {
  const ctx = useContext(PinsContext);
  if (!ctx) throw new Error("usePins must be used within a PinsProvider");
  return ctx;
}
