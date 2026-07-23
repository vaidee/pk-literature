import { createApp } from "./create-app";

// Local dev entry point only — apps/api-identity runs as a Lambda in
// every deployed environment (src/lambda.ts). `pnpm start:dev` here
// against docker-compose's Postgres.
async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`api-identity listening on :${port}`);
}

void bootstrap();
