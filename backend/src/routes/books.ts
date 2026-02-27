import type { Request, Response } from "express";
import { Router } from "express";
import { checkDbReady, getPrisma } from "../db/prisma";
import { asyncHandler } from "../http/asyncHandler";

type SortBy = "title" | "author" | "publishedYear" | "createdAt";
type SortDir = "asc" | "desc";

function parseIntParam(value: unknown, fallback: number): number {
  if (typeof value !== "string") return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseSortBy(value: unknown): SortBy {
  if (value === "title" || value === "author" || value === "publishedYear" || value === "createdAt") return value;
  return "createdAt";
}

function parseSortDir(value: unknown): SortDir {
  return value === "asc" ? "asc" : "desc";
}

export function createBooksRouter(): Router {
  const router = Router();

  router.get(
    "/books",
    asyncHandler(async (req: Request, res: Response) => {
      const dbOk = await checkDbReady();
      if (!dbOk) {
        return res.status(503).json({ error: "db_unavailable" });
      }

      const page = clamp(parseIntParam(req.query.page, 1), 1, 10_000);
      const pageSize = clamp(parseIntParam(req.query.pageSize, 10), 1, 50);
      const sortBy = parseSortBy(req.query.sortBy);
      const sortDir = parseSortDir(req.query.sortDir);

      const skip = (page - 1) * pageSize;
      const prisma = getPrisma();

      const [total, items] = await Promise.all([
        prisma.book.count(),
        prisma.book.findMany({
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            publishedYear: true,
            copiesTotal: true,
            copiesAvailable: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { [sortBy]: sortDir },
          skip,
          take: pageSize
        })
      ]);

      return res.status(200).json({
        page,
        pageSize,
        total,
        sortBy,
        sortDir,
        items
      });
    })
  );

  return router;
}