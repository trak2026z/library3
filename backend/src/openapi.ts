import type { OpenApiDocument } from "./types/openapi";

export const openApiSpec: OpenApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Library API",
    version: "0.0.0"
  },
  paths: {
    "/api/health": {
      get: {
        summary: "Healthcheck (with DB readiness)",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    db: { type: "string", example: "ok" }
                  },
                  required: ["status", "db"]
                }
              }
            }
          },
          "503": {
            description: "DB not ready",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "degraded" },
                    db: { type: "string", example: "error" }
                  },
                  required: ["status", "db"]
                }
              }
            }
          }
        }
      }
    },
    "/api/books": {
      get: {
        summary: "List books",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
          {
            name: "sortBy",
            in: "query",
            schema: { type: "string", enum: ["title", "author", "publishedYear", "createdAt"], default: "createdAt" }
          },
          { name: "sortDir", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } }
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object" }
              }
            }
          }
        }
      }
    }
  }
};