// Minimal fluent mock for Kysely's query builder — enough to unit-test
// services without a real Postgres. Every chainable method returns the
// same mock (`this`); the two terminal methods resolve to whatever the
// test configures. Integration tests (development/testing.md's second
// layer) exercise real SQL against a throwaway Postgres instead — this
// mock is deliberately not a substitute for that, just for testing a
// service's own logic/shaping in isolation.
export function createFluentDbMock(options: {
  executeResult?: unknown[];
  executeTakeFirstResult?: unknown;
  executeTakeFirstOrThrowResult?: unknown;
}) {
  const chain: Record<string, unknown> = {};
  const chainableMethods = [
    "selectFrom",
    "innerJoin",
    "leftJoin",
    "select",
    "selectAll",
    "where",
    "orderBy",
    "limit",
    "offset",
  ];
  for (const method of chainableMethods) {
    chain[method] = jest.fn(() => chain);
  }
  chain.execute = jest.fn().mockResolvedValue(options.executeResult ?? []);
  chain.executeTakeFirst = jest.fn().mockResolvedValue(options.executeTakeFirstResult ?? null);
  chain.executeTakeFirstOrThrow = jest
    .fn()
    .mockResolvedValue(options.executeTakeFirstOrThrowResult ?? {});
  chain.fn = { countAll: jest.fn(() => ({ as: jest.fn(() => "count") })) };
  return chain;
}
