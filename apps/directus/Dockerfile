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
#
# DIRECTUS_VERSION must be declared here, before the first FROM — an
# ARG used in a FROM's image reference has to be declared before *any*
# FROM in the file, or it's scoped only to whichever stage it's inside
# and never reaches a later FROM at all (confirmed by a real `docker
# build --build-arg DIRECTUS_VERSION=...` silently resolving to an
# empty base image name when this was declared between the two
# stages instead).
ARG DIRECTUS_VERSION=11.17.4

FROM node:20-bookworm-slim AS extension-build
WORKDIR /build
COPY extensions/operations/eventbridge-put-event/package.json ./
RUN npm install
COPY extensions/operations/eventbridge-put-event/ ./
RUN npm run build

FROM directus/directus:${DIRECTUS_VERSION}
COPY --from=extension-build /build/dist /directus/extensions/operations/eventbridge-put-event/dist
COPY --from=extension-build /build/package.json /directus/extensions/operations/eventbridge-put-event/package.json
