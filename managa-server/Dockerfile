# Build context is the repository root so the image can include the bundled
# Taska app alongside the managa server.
#
# Alpine 3.22 is pinned because the rolling `node:22-alpine` tag can move to a
# new Alpine release before its package mirrors are healthy on every architecture
# (notably 32-bit ARM and some Raspberry Pi setups). The apk install is retried
# so a transient mirror/DNS failure does not break the build.
FROM node:22-alpine3.22 AS base
WORKDIR /app
RUN set -eux; \
    for attempt in 1 2 3 4 5; do \
      if apk add --no-cache --timeout 120 build-base git python3 curl; then \
        break; \
      fi; \
      if [ "$attempt" = "5" ]; then \
        exit 1; \
      fi; \
      echo "apk add failed (attempt $attempt); retrying in 5s..." >&2; \
      sleep 5; \
    done

FROM base AS deps
WORKDIR /app/managa-server
COPY managa-server/package*.json ./
RUN npm ci --no-audit --no-fund

FROM base AS build
WORKDIR /app/managa-server
COPY --from=deps /app/managa-server/node_modules ./node_modules
COPY managa-server ./
RUN npm run build

FROM base
WORKDIR /app
COPY --from=build /app/managa-server ./managa-server
COPY taska.app.json ./taska.app.json
COPY client/taska-client ./client/taska-client
COPY server/taska-server ./server/taska-server
RUN mkdir -p /app/data
ENV NODE_ENV=production \
    PORT=5100 \
    MANAGA_ROOT_DIR=/app \
    MANAGA_DATA_DIR=/app/data
# Managed apps bind their ports on the host network; only the API is fixed.
EXPOSE 5100
VOLUME ["/app/data"]
WORKDIR /app/managa-server
CMD ["npm", "run", "start:prod"]
