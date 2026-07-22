import { Global, Module, type Provider } from "@nestjs/common";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "./database.types";

export const KYSELY = Symbol("KYSELY");

// Connects via RDS Proxy using IAM database auth in deployed
// environments (infrastructure/secrets.md) — locally, a plain
// connection string against docker-compose's Postgres. The IAM-token
// vs password decision is made by how DATABASE_URL/PG* env vars are
// populated at deploy time, not by anything in this file; Lambda's
// deploy wiring (added when this service is actually wired into
// Terraform) is responsible for minting a fresh auth token per cold
// start, since IAM tokens expire.
const kyselyProvider: Provider = {
  provide: KYSELY,
  useFactory: () => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // RDS Proxy requires TLS; rejectUnauthorized left default (true)
      // in every environment except explicit local dev.
      ssl:
        process.env.PGSSL === "disable"
          ? undefined
          : { rejectUnauthorized: process.env.NODE_ENV === "production" },
      max: 5, // small per-invocation pool — RDS Proxy does the real pooling
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
