import { Global, Module, type Provider } from "@nestjs/common";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import type { Database } from "./database.types";

// Identical shape to apps/api-catalog/src/database/database.module.ts —
// see that file's comments for the IAM-vs-password auth reasoning.
// Duplicated rather than shared (development/repository-layout.md: no
// shared query-layer package, each service owns its own DB module) —
// same convention already established for database.types.ts.
export const KYSELY = Symbol("KYSELY");

function resolvePassword(): string | (() => Promise<string>) {
  if (process.env.DB_AUTH_MODE !== "iam") {
    return process.env.PGPASSWORD ?? "";
  }

  const signer = new Signer({
    hostname: requireEnv("PGHOST"),
    port: Number(process.env.PGPORT ?? 5432),
    username: requireEnv("PGUSER"),
    region: requireEnv("AWS_REGION"),
  });

  return () => signer.getAuthToken();
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const kyselyProvider: Provider = {
  provide: KYSELY,
  useFactory: () => {
    const pool = new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: resolvePassword(),
      ssl:
        process.env.PGSSL === "disable"
          ? undefined
          : { rejectUnauthorized: process.env.NODE_ENV === "production" },
      max: 5,
    });

    return new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
      plugins: [new CamelCasePlugin()],
    });
  },
};

@Global()
@Module({
  providers: [kyselyProvider],
  exports: [KYSELY],
})
export class DatabaseModule {}
