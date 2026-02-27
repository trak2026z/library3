"use client";

import { useEffect, useMemo, useState } from "react";

type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publishedYear?: number | null;
  copiesTotal: number;
  copiesAvailable: number;
};

type BooksResponse = {
  page: number;
  pageSize: number;
  total: number;
  sortBy: string;
  sortDir: string;
  items: Book[];
};

function buildUrl(page: number, pageSize: number): string {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy: "title",
    sortDir: "asc"
  });

  return `/api/books?${params.toString()}`;
}

export function BooksList() {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [data, setData] = useState<BooksResponse | null>(null);

  const totalPages = useMemo(() => {
    const total = data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [data?.total]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState("loading");
      try {
        const res = await fetch(buildUrl(page, pageSize), { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as BooksResponse;

        if (!cancelled) {
          setData(json);
          setState("ok");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <section aria-label="books">
      <h2>Books</h2>

      {state === "loading" ? <p>Loading…</p> : null}
      {state === "error" ? <p role="alert">Failed to load books.</p> : null}

      {state === "ok" && data ? (
        <>
          <p>
            Page <strong>{data.page}</strong> / <strong>{totalPages}</strong> • Total:{" "}
            <strong>{data.total}</strong>
          </p>

          <table>
            <thead>
              <tr>
                <th align="left">Title</th>
                <th align="left">Author</th>
                <th align="left">ISBN</th>
                <th align="right">Available</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b.id}>
                  <td>{b.title}</td>
                  <td>{b.author}</td>
                  <td>
                    <code>{b.isbn}</code>
                  </td>
                  <td align="right">
                    {b.copiesAvailable}/{b.copiesTotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}