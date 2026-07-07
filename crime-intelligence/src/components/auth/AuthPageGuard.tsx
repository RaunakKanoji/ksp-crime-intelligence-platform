"use client";

import { ReactNode, useEffect } from "react";
import { getCurrentCatalystUser, getSafeRedirectPath } from "@/lib/catalyst/client";

export function AuthPageGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        await getCurrentCatalystUser();

        if (cancelled) {
          return;
        }

        window.location.replace(getSafeRedirectPath("/dashboard"));
      } catch (error) {
        return;
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
