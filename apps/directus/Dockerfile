# Editorial Workbench (SPEC-03). Multi-stage: build the custom Flow
# operation extension (eventbridge-put-event) with its own toolchain,
# then layer its dist/ output onto the official image — Directus loads
# extensions by directory convention (extensions/operations/<name>/dist).
#
# See ../README.md's "Known issue" — this image has not been
# successfully bootstrapped end-to-end in this environment (Directus
# 11.17.4 and 12.1.1 both crash on first boot, reproducing even against
# an empty database). Pinned version below is what was tested, not a
# version known to work.

FROM node:20-bookworm-slim AS extension-build
WORKDIR /build
COPY extensions/operations/eventbridge-put-event/package.json ./
RUN npm install
COPY extensions/operations/eventbridge-put-event/ ./
RUN npm run build

ARG DIRECTUS_VERSION=11.17.4
FROM directus/directus:${DIRECTUS_VERSION}
COPY --from=extension-build /build/dist /directus/extensions/operations/eventbridge-put-event/dist
COPY --from=extension-build /build/package.json /directus/extensions/operations/eventbridge-put-event/package.json
