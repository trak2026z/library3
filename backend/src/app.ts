import express, { type Express, type NextFunction, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./openapi";
import { createBooksRouter } from "./routes/books";
import { createHealthRouter } from "./routes/health";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  // API
  const apiRouter = express.Router();
  apiRouter.use(createHealthRouter());
  apiRouter.use(createBooksRouter());
  app.use("/api", apiRouter);

  // Swagger UI
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "not_found" });
  });

  // Error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "internal_server_error" });
  });

  return app;
}