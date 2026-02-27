import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BooksList } from "./BooksList";

describe("BooksList", () => {
  it("renders books from /api/books", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          page: 1,
          pageSize: 5,
          total: 2,
          sortBy: "title",
          sortDir: "asc",
          items: [
            { id: "1", title: "A", author: "X", isbn: "i1", copiesTotal: 2, copiesAvailable: 1 },
            { id: "2", title: "B", author: "Y", isbn: "i2", copiesTotal: 1, copiesAvailable: 1 }
          ]
        })
      })) as unknown as typeof fetch
    );

    render(<BooksList />);

    expect(await screen.findByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();

    const section = screen.getByLabelText("books");
    // tekst jest rozbity przez <strong>, więc sprawdzamy textContent całej sekcji
    expect(section).toHaveTextContent(/Total:\s*2/i);
  });

  it("paginates on Next click", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const page = new URL(url, "http://localhost").searchParams.get("page") ?? "1";

      return {
        ok: true,
        status: 200,
        json: async () => ({
          page: Number(page),
          pageSize: 5,
          total: 6,
          sortBy: "title",
          sortDir: "asc",
          items: [
            {
              id: `p${page}`,
              title: `T${page}`,
              author: "A",
              isbn: `i${page}`,
              copiesTotal: 1,
              copiesAvailable: 1
            }
          ]
        })
      };
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const user = userEvent.setup();
    render(<BooksList />);

    expect(await screen.findByText("T1")).toBeInTheDocument();

    const section = screen.getByLabelText("books");
    const nextBtn = within(section).getByRole("button", { name: /next/i });

    await user.click(nextBtn);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(await screen.findByText("T2")).toBeInTheDocument();
  });
});