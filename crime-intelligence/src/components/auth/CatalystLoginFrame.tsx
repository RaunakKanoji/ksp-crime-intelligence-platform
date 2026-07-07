"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { mountCatalystSignIn } from "@/lib/catalyst/client";

export function CatalystLoginFrame() {
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    mountCatalystSignIn("catalyst-login-frame").catch((err) => {
      console.error(err);
      if (!cancelled) {
        setError(
          "Unable to load Catalyst authentication. Check the Catalyst authorized domains and local rewrites.",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="auth-card auth-card-login">
      <div
        id="catalyst-login-frame"
        className="auth-iframe auth-frame-slot"
        aria-label="Zoho Catalyst sign in"
      />
      {error ? <p className="auth-error">{error}</p> : null}
      <p className="auth-bottom-link">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-black underline"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
