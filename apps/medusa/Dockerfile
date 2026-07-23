# Medusa admin surface (SPEC-06). Two stages: `medusa build` compiles
# this project (medusa-config.ts + src/subscribers) into a
# self-contained production app under .medusa/server (Medusa's own
# documented build output layout), then that output gets its own
# `npm install` in a slim runtime image — mirrors the shape of
# apps/directus/Dockerfile's multi-stage build even though the
# underlying tools differ (Directus layers a compiled extension onto
# an official pre-built image; Medusa has no such image to start from,
# so this repo builds the whole server image itself).
#
# NOT live-verified in this sandbox — see ../README.md's "Known issue"
# section, same disclosed-limitation category as apps/directus's own
# unverified boot.

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY medusa-config.ts tsconfig.json ./
COPY src ./src
RUN npx medusa build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/.medusa/server ./
RUN npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 9000
CMD ["npm", "run", "start"]
