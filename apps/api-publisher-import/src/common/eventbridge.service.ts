import { Injectable, Logger } from "@nestjs/common";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

// One client per Lambda execution environment, reused across warm
// invocations — same reasoning as the Kysely/pg Pool in
// database.module.ts.
const client = new EventBridgeClient({});

@Injectable()
export class EventBridgeService {
  private readonly logger = new Logger(EventBridgeService.name);
  private readonly busName = process.env.EVENTBRIDGE_BUS_NAME;

  async publish<T extends object>(detailType: string, detail: T): Promise<void> {
    if (!this.busName) {
      // Local dev without AWS credentials configured — log instead of
      // throwing, so the rest of a request can still be exercised.
      this.logger.warn(`EVENTBRIDGE_BUS_NAME not set — skipping publish of ${detailType}`);
      return;
    }

    const result = await client.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: this.busName,
            Source: "pk-literature.api-publisher-import",
            DetailType: detailType,
            Detail: JSON.stringify(detail),
          },
        ],
      }),
    );

    const entry = result.Entries?.[0];
    if (entry?.ErrorCode) {
      // Never fail the request over a best-effort event publish — the
      // staging write already succeeded, which is the record of truth
      // (SPEC-04's staging tables); an undelivered ImportCompleted/
      // BookImported event affects downstream consumers (search/feed
      // refresh), not correctness of the import itself.
      this.logger.error(`EventBridge PutEvents failed for ${detailType}: ${entry.ErrorCode} — ${entry.ErrorMessage}`);
    }
  }
}
