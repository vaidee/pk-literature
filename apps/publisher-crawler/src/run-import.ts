import type { PublisherAdapter } from "@pk-literature/adapter-sdk";
import { withRetry } from "./retry";
import type { StagingIngestClient } from "./staging-ingest-client";

export interface RunImportOptions {
  publisherId: string;
  trigger: "scheduled" | "manual" | "retry";
  adapter: PublisherAdapter;
  client: StagingIngestClient;
  logger?: Pick<Console, "log" | "warn" | "error">;
}

export interface RunImportSummary {
  runId: string;
  status: "completed" | "failed" | "partially_failed";
  booksProcessed: number;
  booksFailed: number;
}

// The external half of ADR-009's split pipeline: everything here runs
// on a GitHub Actions runner, no AWS access beyond the
// StagingIngestClient's SigV4-signed calls to the one staging-ingest
// API (infrastructure/iam.md's gha-publisher-import-<env> role).
//
// Incremental cursor caveat: this reads/writes
// catalog.publishers.last_import_cursor per SPEC-04 §21's interface
// contract, but the reference Kalachuvadu adapter's discover() doesn't
// actually use the cursor to skip already-seen pages — a generic HTML
// catalog listing has no "modified since" capability to filter on, so
// every run re-crawls from page 1. Correctness under repeated full
// crawls relies on staging_books' UNIQUE(publisher_id, source_ref)
// upsert (ADR-009's own stated mitigation), not on the cursor. A
// publisher whose adapter's discover() can accept a real incremental
// filter (a REST/GraphQL/JSON-feed adapter with a "since" parameter,
// SPEC-04 §7) would use the cursor for real; this is disclosed here
// rather than left implicit.
export async function runImport(options: RunImportOptions): Promise<RunImportSummary> {
  const logger = options.logger ?? console;
  const { publisherId, trigger, adapter, client } = options;

  const { cursor } = await client.getCursor(publisherId);
  const { runId } = await client.startImportRun(publisherId, trigger);
  logger.log(`Started import run ${runId} for publisher ${publisherId} (trigger=${trigger}, cursor=${cursor})`);

  let booksProcessed = 0;
  let booksFailed = 0;
  let pageCursor = cursor;
  let sawAnyFailure = false;

  try {
    do {
      const discovery = await withRetry(() => adapter.discover(pageCursor));

      for (const ref of discovery.refs) {
        try {
          const raw = await withRetry(() => adapter.fetchBook(ref));
          const book = adapter.normalize(raw);
          const inventory = await withRetry(() => adapter.fetchInventory(ref));
          book.stock = inventory.stock;

          // Cheap fail-fast client-side (ADR-009) — the authoritative
          // check (plus duplicate detection) still happens server-side
          // regardless of this result; this only avoids paying for a
          // cover download on a book that's obviously incomplete.
          const preCheck = adapter.validate(book);
          if (preCheck.hasErrors) {
            logger.warn(`${ref.sourceRef}: failing pre-check, submitting anyway for the authoritative record`, preCheck.issues);
          }

          let cover: { sourceUrl: string; contentType: string; bytesBase64: string } | null = null;
          if (book.coverSourceUrl) {
            const downloaded = await withRetry(() => adapter.downloadCover(book.coverSourceUrl!));
            cover = {
              sourceUrl: downloaded.sourceUrl,
              contentType: downloaded.contentType,
              bytesBase64: downloaded.bytes.toString("base64"),
            };
          }

          const result = await client.submitBook(runId, book, cover);
          booksProcessed++;
          if (result.status === "rejected") {
            booksFailed++;
          }
          logger.log(`${ref.sourceRef}: ${result.status}`);
        } catch (error) {
          booksFailed++;
          sawAnyFailure = true;
          logger.error(`${ref.sourceRef}: failed after retries`, error);
        }
      }

      pageCursor = discovery.nextPageCursor;
    } while (pageCursor !== null);
  } catch (error) {
    // discover() itself failed (after retries) — nothing recoverable
    // left to do this run.
    logger.error("discover() failed after retries — ending run early", error);
    await client.completeImportRun(runId, "failed", null, error instanceof Error ? error.message : String(error));
    return { runId, status: "failed", booksProcessed, booksFailed };
  }

  const status = sawAnyFailure && booksProcessed > 0 ? "partially_failed" : sawAnyFailure ? "failed" : "completed";
  // ADR-009: only advance the watermark on a run that reached the end
  // successfully — see the module-level caveat above about what this
  // cursor value currently means for the reference adapter.
  const nextCursor = status !== "failed" ? new Date().toISOString() : null;
  await client.completeImportRun(runId, status, nextCursor, null);

  return { runId, status, booksProcessed, booksFailed };
}
