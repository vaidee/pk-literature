import { createApp } from "./create-app";

// Local dev entry point only — apps/api-commerce runs as a Lambda in
// every deployed environment (src/lambda.ts). `pnpm start:dev` here
// against docker-compose's Postgres.
async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = process.env.PORT ?? 3004;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`api-commerce listening on :${port}`);
}

void bootstrap();
