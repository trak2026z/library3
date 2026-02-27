import type { Request, Response } from "express";
import { Router } from "express";
import { checkDbReady } from "../db/prisma";
import { asyncHandler } from "../http/asyncHandler";

export function createHealthRouter(): Router {
  const router = Router();

  router.get(
    "/health",
    asyncHandler(async (_req: Request, res: Response) => {
      const dbOk = await checkDbReady();

      if (!dbOk) {
        return res.status(503).json({ status: "degraded", db: "error" });
      }

      return res.status(200).json({ status: "ok", db: "ok" });
    })
  );

  return router;
}