import * as path from "node:path";
import runner from "node-pg-migrate";
import { resolveMasterCredential } from "./resolve-master-credential";

interface MigrationRunnerEvent {
  // "down" exists for symmetry with each service's own migrate:down
  // script — not expected to be used in normal operation.
  direction?: "up" | "down";
}

interface ServiceResult {
  service: string;
  migrationsRun: string[];
}

// Order matters: api-catalog's migrations create the catalog/staging
// schemas and roles (catalog_api_readonly, publisher_import_writer,
// ...) that api-feed/api-search/api-commerce/api-identity's own
// *_role.sql migrations grant against — see runbooks/deploy.md §4.
// The other four don't depend on each other, but running them in
// build-phase order keeps behavior deterministic and matches the
// order the runbook already documents.
const SERVICES: readonly { name: string; migrationsTable: string }[] = [
  { name: "api-catalog", migrationsTable: "pgmigrations" },
  { name: "api-feed", migrationsTable: "pgmigrations_api_feed" },
  { name: "api-search", migrationsTable: "pgmigrations_api_search" },
  { name: "api-commerce", migrationsTable: "pgmigrations_api_commerce" },
  { name: "api-identity", migrationsTable: "pgmigrations_api_identity" },
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export async function handler(event: MigrationRunnerEvent = {}): Promise<ServiceResult[]> {
  const direction = event.direction ?? "up";
  const { username, password } = await resolveMasterCredential();

  const databaseUrl = {
    host: requireEnv("PGHOST"),
    port: Number(process.env.PGPORT ?? 5432),
    database: requireEnv("PGDATABASE"),
    user: username,
    password,
    // RDS Proxy requires TLS. Unlike apps/api-catalog's
    // database.module.ts, there's no local-dev/docker-compose path
    // here to accommodate — this Lambda only ever runs against the
    // real deployed RDS Proxy, so verification is unconditional.
    ssl: { rejectUnauthorized: true },
  };

  // down runs in reverse so each service's own foreign-key/role
  // dependencies unwind in the opposite order they were created.
  const services = direction === "down" ? [...SERVICES].reverse() : SERVICES;

  const results: ServiceResult[] = [];
  for (const service of services) {
    console.log(`==> Running ${direction} migrations for ${service.name}`);
    try {
      const migrations = await runner({
        databaseUrl,
        // __dirname at runtime is dist-lambda.zip's "dist/src" (tsconfig's
        // rootDir "." preserves the src/ prefix, matching every other
        // service's "dist/src/<entry>.handler" Lambda handler string) —
        // two levels up reaches the zip root, where package-lambda.sh
        // copies each service's migrations/ directory alongside dist/.
        dir: path.join(__dirname, "..", "..", "migrations", service.name),
        migrationsTable: service.migrationsTable,
        direction,
      });
      console.log(`==> ${service.name}: ${migrations.length} migration(s) applied`);
      results.push({ service: service.name, migrationsRun: migrations.map((m) => m.name) });
    } catch (error) {
      console.error(`==> ${service.name} migration failed — stopping (remaining services not attempted)`);
      throw error;
    }
  }

  return results;
}
