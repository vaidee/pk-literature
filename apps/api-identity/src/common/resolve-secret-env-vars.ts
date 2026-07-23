import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

/**
 * secrets.md: "Nothing is ever passed as a plain Lambda/ECS environment
 * variable — environment variables hold the Secrets Manager ARN, the
 * runtime resolves it at cold start." Same pattern as
 * apps/api-commerce/src/common/resolve-secret-env-vars.ts — see that
 * file's comment for the full rationale. Here it resolves
 * JWT_SIGNING_SECRET_ARN into the plain JWT_SIGNING_SECRET env var
 * auth/jwt.service.ts reads.
 *
 * A no-op locally / in tests, where the ARN var is unset and
 * .env.example's plain JWT_SIGNING_SECRET is used directly.
 */
const SECRET_ARN_ENV_VARS: Record<string, string> = {
  JWT_SIGNING_SECRET: "JWT_SIGNING_SECRET_ARN",
};

export async function resolveSecretEnvVars(): Promise<void> {
  const arnEntries = Object.entries(SECRET_ARN_ENV_VARS).filter(([, arnVar]) => process.env[arnVar]);
  if (arnEntries.length === 0) return;

  const client = new SecretsManagerClient({});
  await Promise.all(
    arnEntries.map(async ([targetVar, arnVar]) => {
      const secretId = process.env[arnVar]!;
      const result = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
      if (result.SecretString) {
        process.env[targetVar] = result.SecretString;
      }
    }),
  );
}
