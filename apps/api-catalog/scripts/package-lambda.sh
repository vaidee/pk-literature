#!/usr/bin/env bash
# Produces apps/api-catalog/dist-lambda.zip — the artifact
# terraform/environments/<env>/api-catalog.tf's aws_lambda_function
# references directly via `filename`/`source_code_hash`.
#
# Why not a raw `tar czf dist node_modules`: pnpm's node_modules is a
# content-addressable store with symlinks (e.g.
# node_modules/@pk-literature/contracts -> ../../packages/contracts) —
# Lambda's runtime needs real files, not symlinks pointing outside the
# zip. `pnpm deploy` is pnpm's own answer to exactly this: it resolves
# every workspace:* dependency into a real, self-contained copy.
#
# Must be run (or run again) after any change to this app or the
# packages it depends on — there's no Terraform-triggered auto-rebuild
# (a null_resource local-exec was considered and rejected: it couples
# Terraform's apply cycle to a Node build, which is worse to debug than
# just running this script explicitly before `terraform plan/apply`,
# matching how deploy.md already describes the pipeline: build, then
# deploy, as separate steps).
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "$APP_DIR/../.." && pwd)"
# Deliberately OUTSIDE apps/api-catalog: `pnpm deploy`'s target-path
# resolution doubles the package's own relative path (apps/api-catalog/
# apps/api-catalog/...) when the target lives inside the source
# package's own directory tree — observed directly, not a hypothetical.
STAGING_DIR="$ROOT_DIR/.lambda-package/api-catalog"
ZIP_PATH="$APP_DIR/dist-lambda.zip"

echo "==> Building workspace packages (domain-types, contracts, api-catalog)"
(cd "$ROOT_DIR" && pnpm --filter @pk-literature/domain-types --filter @pk-literature/contracts --filter api-catalog run build)

echo "==> Resolving a self-contained package (pnpm deploy --prod)"
rm -rf "$STAGING_DIR"
(cd "$ROOT_DIR" && pnpm --filter api-catalog deploy --prod "$STAGING_DIR")

echo "==> Zipping"
rm -f "$ZIP_PATH"
# -y: store symlinks as symlinks, do NOT dereference them. pnpm's
# node_modules is full of symlinks into its .pnpm store reached from
# many different paths; without -y, zip stores each symlink's target
# content independently every time it's followed, ballooning a 73MB
# tree into a 108MB archive (measured directly). With -y the archive
# preserves the symlinks themselves (~15MB), and Lambda's extraction —
# a normal filesystem unzip — resolves them correctly at cold start
# since every symlink target lives inside the same archive.
(cd "$STAGING_DIR" && zip -rqy "$ZIP_PATH" . -x "*.git*")

echo "==> Done: $ZIP_PATH ($(du -h "$ZIP_PATH" | cut -f1))"
