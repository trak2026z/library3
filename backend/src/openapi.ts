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
        summary: "Healthcheck",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" }
                  },
                  required: ["status"]
                }
              }
            }
          }
        }
      }
    }
  }
};