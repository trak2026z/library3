# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS dev
WORKDIR /app
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
COPY next-env.d.ts tsconfig.json next.config.mjs eslint.config.mjs vitest.config.ts ./
COPY src ./src
RUN chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --retries=20 CMD wget -qO- http://localhost:3000/ > /dev/null
CMD ["npm", "run", "dev"]

# (opcjonalnie na później) prod:
FROM deps AS build
WORKDIR /app
COPY next-env.d.ts tsconfig.json next.config.mjs eslint.config.mjs vitest.config.ts ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY next.config.mjs ./
COPY --from=build /app/.next ./.next
RUN chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --retries=20 CMD wget -qO- http://localhost:3000/ > /dev/null
CMD ["npm", "run", "start"]