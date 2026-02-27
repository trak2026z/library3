"use client";

import { useEffect, useState } from "react";

type Health = { status: string };

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export function HealthCheck() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState("loading");
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/health`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Health;

        if (!cancelled) {
          setValue(data.status);
          setState(data.status === "ok" ? "ok" : "error");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-label="healthcheck">
      <h2>Health</h2>
      <p>
        API: <code>{getApiBaseUrl()}</code>
      </p>
      <p>
        Status: <strong>{state}</strong> {value ? `(value: ${value})` : null}
      </p>
    </section>
  );
}