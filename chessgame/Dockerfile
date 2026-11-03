# Stage 1: Build Workspace
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package*.json ./
COPY core/tournament-engine/package*.json ./core/tournament-engine/
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies across all workspaces
RUN npm ci

# Copy full source
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=backend/prisma/schema.prisma

# Build all workspaces
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and built dist directories from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/core/tournament-engine/dist ./core/tournament-engine/dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health/live').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "backend/dist/index.js"]
