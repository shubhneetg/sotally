FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
RUN npm ci --workspace=@sotally/api --workspace=@sotally/shared

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules 2>/dev/null || true
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api
COPY package.json package-lock.json tsconfig.json ./
# Build shared first, then API
RUN npm run build -w @sotally/shared 2>/dev/null || true
# For API we use tsx in production too (simpler than compiling)

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY package.json ./
COPY tools ./tools
EXPOSE 4000
CMD ["npx", "tsx", "packages/api/src/index.ts"]
