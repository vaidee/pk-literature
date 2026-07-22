import type { CanonicalBook, ValidationIssue } from "@pk-literature/adapter-sdk";

export interface CoverUpload {
  sourceUrl: string;
  contentType: string;
  bytesBase64: string;
}

export interface SubmitBookResult {
  stagingBookId: string;
  status: string;
  issues: ValidationIssue[];
}

// The subset of apps/api-publisher-import's HTTP surface this crawler
// calls. Kept as an interface so run-import.ts can be unit-tested
// against a fake implementation instead of real SigV4-signed HTTP —
// SigV4HttpStagingIngestClient (below) is the only implementation that
// actually needs AWS credentials/network access.
export interface StagingIngestClient {
  getCursor(publisherId: string): Promise<{ cursor: string | null; lastImportAt: string | null }>;
  startImportRun(publisherId: string, trigger: "scheduled" | "manual" | "retry"): Promise<{ runId: string }>;
  submitBook(runId: string, book: CanonicalBook, cover: CoverUpload | null): Promise<SubmitBookResult>;
  completeImportRun(
    runId: string,
    status: "completed" | "failed" | "partially_failed",
    cursor: string | null,
    errorSummary: string | null,
  ): Promise<void>;
}
