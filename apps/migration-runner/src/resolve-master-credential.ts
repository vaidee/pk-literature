import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

interface MasterCredential {
  username: string;
  password: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// terraform/modules/secrets-manager's rds_master secret_string is
// jsonencode({ username, password }) — mirrors
// apps/api-commerce/src/common/resolve-secret-env-vars.ts's rule that
// nothing but the ARN itself is ever a plain env var.
export async function resolveMasterCredential(): Promise<MasterCredential> {
  const client = new SecretsManagerClient({});
  const result = await client.send(
    new GetSecretValueCommand({ SecretId: requireEnv("RDS_MASTER_SECRET_ARN") }),
  );
  if (!result.SecretString) {
    throw new Error("RDS master credential secret has no SecretString");
  }
  return JSON.parse(result.SecretString) as MasterCredential;
}
