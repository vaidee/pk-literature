import { Global, Module, type Provider } from "@nestjs/common";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import type { Database } from "./database.types";

export const KYSELY = Symbol("KYSELY");

// DB_AUTH_MODE=iam (deployed environments, via RDS Proxy) mints a fresh
// IAM auth token per physical connection instead of using a stored
// password — infrastructure/secrets.md's preferred path for the
// highest-traffic services. DB_AUTH_MODE=password (local dev, via
// docker-compose) uses PGPASSWORD directly. `pg`'s Pool accepts a
// password callback specifically so each new connection (not just the
// first) gets a fresh, unexpired token — RDS IAM tokens are valid 15
// minutes, and a long-lived Lambda execution environment can easily
// outlive that between cold starts.
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
      // RDS Proxy requires TLS; local dev (docker-compose) disables it.
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
