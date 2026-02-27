import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const { fakePrisma, mockCheckDbReady } = vi.hoisted(() => {
  const book = {
    count: vi.fn(),
    findMany: vi.fn()
  };

  return {
    fakePrisma: { book },
    mockCheckDbReady: vi.fn()
  };
});

vi.mock("./db/prisma", () => ({
  getPrisma: () => fakePrisma,
  checkDbReady: mockCheckDbReady
}));

import { createApp } from "./app";

describe("GET /api/health", () => {
  it("returns ok when db is ready", async () => {
    mockCheckDbReady.mockResolvedValueOnce(true);

    const app = createApp();
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "ok" });
  });

  it("returns 503 when db is not ready", async () => {
    mockCheckDbReady.mockResolvedValueOnce(false);

    const app = createApp();
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded", db: "error" });
  });
});

describe("GET /api/books", () => {
  it("returns paginated items (defaults)", async () => {
    fakePrisma.book.count.mockResolvedValueOnce(2);
    fakePrisma.book.findMany.mockResolvedValueOnce([
      { id: "1", title: "A", author: "X", isbn: "i1", publishedYear: 2020, copiesTotal: 1, copiesAvailable: 1 },
      { id: "2", title: "B", author: "Y", isbn: "i2", publishedYear: 2021, copiesTotal: 2, copiesAvailable: 2 }
    ]);

    const app = createApp();
    const res = await request(app).get("/api/books");

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.total).toBe(2);
    expect(res.body.items).toHaveLength(2);

    expect(fakePrisma.book.count).toHaveBeenCalledTimes(1);
    expect(fakePrisma.book.findMany).toHaveBeenCalledTimes(1);
  });

  it("applies pagination and sorting", async () => {
    fakePrisma.book.count.mockResolvedValueOnce(100);
    fakePrisma.book.findMany.mockResolvedValueOnce([{ id: "x" }]);

    const app = createApp();
    const res = await request(app).get("/api/books?page=2&pageSize=5&sortBy=title&sortDir=asc");

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.pageSize).toBe(5);

    expect(fakePrisma.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        orderBy: { title: "asc" }
      })
    );
  });
});