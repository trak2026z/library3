"use client";

import { useEffect, useState } from "react";

type Health = { status: string };

function getApiBaseUrl(): string {
  // Jeśli nie ustawione — użyj proxy /api w Next (same-origin)
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

function formatApiLabel(baseUrl: string): string {
  return baseUrl ? baseUrl : "same-origin (/api -> proxy)";
}

export function HealthCheck() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState("loading");
      try {
        const baseUrl = getApiBaseUrl();
        const url = `${baseUrl}/api/health`;

        const res = await fetch(url, { cache: "no-store" });
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

  const baseUrl = getApiBaseUrl();

  return (
    <section aria-label="healthcheck">
      <h2>Health</h2>
      <p>
        API: <code>{formatApiLabel(baseUrl)}</code>
      </p>
      <p>
        Status: <strong>{state}</strong> {value ? `(value: ${value})` : null}
      </p>
    </section>
  );
}