# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY tsconfig.json eslint.config.js vitest.config.ts ./
COPY src ./src
RUN npm run build

FROM deps AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY tsconfig.json eslint.config.js vitest.config.ts ./
COPY src ./src
COPY --from=build /app/dist ./dist
RUN chown -R node:node /app
USER node
EXPOSE 4000
HEALTHCHECK --interval=5s --timeout=3s --retries=20 CMD wget -qO- http://localhost:4000/api/health | grep -q ok
CMD ["node", "dist/server.js"]

# (opcjonalnie na później) minimalny prod:
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./
COPY --from=build /app/dist ./dist
RUN chown -R node:node /app
USER node
EXPOSE 4000
HEALTHCHECK --interval=5s --timeout=3s --retries=20 CMD wget -qO- http://localhost:4000/api/health | grep -q ok
CMD ["node", "dist/server.js"]