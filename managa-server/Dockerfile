# Build context is the repository root so the image can include the bundled
# Taska app alongside the managa server.
FROM node:22-alpine AS deps
WORKDIR /app/managa-server
RUN apk add --no-cache python3 make g++
COPY managa-server/package*.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app/managa-server
COPY --from=deps /app/managa-server/node_modules ./node_modules
COPY managa-server ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache git python3 make g++ curl
COPY --from=build /app/managa-server ./managa-server
COPY taska.app.json ./taska.app.json
COPY client/taska-client ./client/taska-client
COPY server/taska-server ./server/taska-server
RUN mkdir -p /app/data
ENV NODE_ENV=production \
    PORT=5100 \
    MANAGA_ROOT_DIR=/app \
    MANAGA_DATA_DIR=/app/data
EXPOSE 5100 3100-4199
VOLUME ["/app/data"]
WORKDIR /app/managa-server
CMD ["npm", "run", "start:prod"]
