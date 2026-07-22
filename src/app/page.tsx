"use client";

import { useEffect, useState } from "react";
import { CampusView } from "@/components/campus-view";
import { EntryGate } from "@/components/entry-gate";
import { getStudentProfile } from "@/lib/auth";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gate render on localStorage profile check, unavailable during SSR
    setHasProfile(getStudentProfile() !== null);
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!hasProfile) {
    return <EntryGate onComplete={() => setHasProfile(true)} />;
  }

  return <CampusView />;
}
