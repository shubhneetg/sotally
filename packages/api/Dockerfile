FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
RUN npm ci --workspace=@sotally/api --workspace=@sotally/shared

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api
COPY package.json package-lock.json tsconfig.json ./
COPY tools ./tools
EXPOSE 4000
CMD ["npx", "tsx", "packages/api/src/index.ts"]
