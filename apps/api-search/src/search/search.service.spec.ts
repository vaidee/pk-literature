import { normalizeQuery } from "./search.service";

// The only pure, DB-independent piece of search.service.ts — see that
// file's own header comment for why the ranking/facets logic itself
// isn't unit tested (validated for real against local Postgres
// instead).
describe("normalizeQuery", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeQuery("  Ponniyin   Selvan  ")).toBe("ponniyin selvan");
  });

  it("lowercases the English portion", () => {
    expect(normalizeQuery("KALACHUVADU")).toBe("kalachuvadu");
  });

  it("leaves Tamil script untouched aside from whitespace/NFC normalization", () => {
    expect(normalizeQuery("  பொன்னியின்   செல்வன்  ")).toBe("பொன்னியின் செல்வன்");
  });
});
