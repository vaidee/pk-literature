// SPEC-04 §23 / state-machines/publisher-import.md's retry table:
// Network error -> retry x3, Timeout -> retry, Invalid HTML -> fail (no
// retry), Missing ISBN -> warning only (handled entirely by
// @pk-literature/adapter-sdk's validateBookFields, never reaches here).
export class InvalidHtmlError extends Error {}

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 200;

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? BASE_DELAY_MS;
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Invalid HTML is a parsing/structural problem, not a transient
      // one — retrying won't fix a page the adapter can't understand.
      if (error instanceof InvalidHtmlError) {
        throw error;
      }
      if (attempt < maxAttempts) {
        await sleep(baseDelayMs * attempt);
      }
    }
  }
  throw lastError;
}
