import { createApp } from "./create-app";

// Local dev entry point only — apps/api-catalog runs as a Lambda in
// every deployed environment (src/lambda.ts). `pnpm start:dev` here
// against docker-compose's Postgres.
async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`api-catalog listening on :${port}`);
}

void bootstrap();
