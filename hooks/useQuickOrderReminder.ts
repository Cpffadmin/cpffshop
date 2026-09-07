"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/providers/user/UserContext";

const PULSE_DURATION = 10_000;

// Badge count for saved quick-order lists, plus a timed highlight so a returning
// customer notices the shortcut. Fires on the homepage only — the landing page is
// where the reminder is useful, and limiting it there keeps it out of the way
// once the customer is already browsing or checking out.
export function useQuickOrderReminder() {
  const { userData } = useUser();
  const pathname = usePathname();
  const [pulse, setPulse] = useState(false);

  const savedListCount = userData?.orderTemplates?.length ?? 0;

  useEffect(() => {
    if (savedListCount === 0 || pathname !== "/") {
      setPulse(false);
      return;
    }

    setPulse(true);
    const timeout = window.setTimeout(() => setPulse(false), PULSE_DURATION);
    return () => window.clearTimeout(timeout);
  }, [savedListCount, pathname]);

  return { savedListCount, pulse };
}
