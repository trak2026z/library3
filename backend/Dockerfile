# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY tsconfig.json eslint.config.js vitest.config.ts ./
COPY prisma ./prisma
COPY src ./src
RUN npm run build

FROM deps AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY tsconfig.json eslint.config.js vitest.config.ts ./
COPY prisma ./prisma
COPY src ./src
COPY --from=build /app/dist ./dist
RUN chown -R node:node /app
USER node
EXPOSE 4000
HEALTHCHECK --interval=5s --timeout=3s --retries=20 CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]

FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY --from=build /app/dist ./dist
RUN chown -R node:node /app
USER node
EXPOSE 4000
HEALTHCHECK --interval=5s --timeout=3s --retries=20 CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]