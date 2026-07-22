import { InvalidHtmlError, withRetry } from "../retry";

describe("withRetry", () => {
  it("returns the result on first success without retrying", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { sleep: async () => {} });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient errors up to maxAttempts", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce("ok");

    const result = await withRetry(fn, { sleep: async () => {} });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting maxAttempts", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("always fails"));

    await expect(withRetry(fn, { maxAttempts: 3, sleep: async () => {} })).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry InvalidHtmlError — SPEC-04 §23", async () => {
    const fn = jest.fn().mockRejectedValue(new InvalidHtmlError("malformed page"));

    await expect(withRetry(fn, { sleep: async () => {} })).rejects.toThrow(InvalidHtmlError);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
