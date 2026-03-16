FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/
RUN npm ci --workspace=@sotally/web --workspace=@sotally/shared

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules 2>/dev/null || true
COPY packages/shared ./packages/shared
COPY packages/web ./packages/web
COPY package.json package-lock.json tsconfig.json ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @sotally/shared 2>/dev/null || true
RUN npm run build -w @sotally/web

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/packages/web/.next/standalone ./
COPY --from=builder /app/packages/web/.next/static ./packages/web/.next/static
COPY --from=builder /app/packages/web/public ./packages/web/public 2>/dev/null || true
USER nextjs
EXPOSE 3000
CMD ["node", "packages/web/server.js"]
