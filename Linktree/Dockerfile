# syntax=docker/dockerfile:1

# ---------- Build: compile the app into a plain Node server ----------
FROM oven/bun:1 AS build
WORKDIR /app

# Install from the lockfile first so this layer is reused when only code changes.
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .

# Node server output (.output/server/index.mjs) instead of the Cloudflare default.
ENV NITRO_PRESET=node-server

# The browser-facing values are already committed in .env. Pass --build-arg only
# when pointing the site at a different backend; empty args are removed so the
# .env values still win.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
RUN set -e; \
    [ -n "$VITE_SUPABASE_URL" ] || unset VITE_SUPABASE_URL; \
    [ -n "$VITE_SUPABASE_PUBLISHABLE_KEY" ] || unset VITE_SUPABASE_PUBLISHABLE_KEY; \
    bun run build

# ---------- Run: minimal Node 22 image containing only the built server ----------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

COPY --from=build /app/.output ./.output

EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
