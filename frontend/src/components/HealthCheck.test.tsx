import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HealthCheck } from "./HealthCheck";

describe("HealthCheck", () => {
  it("renders and performs health fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: "ok" })
      })) as unknown as typeof fetch
    );

    render(<HealthCheck />);

    expect(screen.getByRole("heading", { name: /health/i })).toBeInTheDocument();
    expect(await screen.findByText(/Status:/i)).toBeInTheDocument();
  });
});