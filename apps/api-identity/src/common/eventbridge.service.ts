import { Injectable, Logger } from "@nestjs/common";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

// Same shape as apps/api-commerce/src/common/eventbridge.service.ts —
// see that file for the "never fail the request over a best-effort
// event publish" reasoning. Here: the user row is the record of truth;
// an undelivered UserRegistered event means the anonymous cart/likes
// merge doesn't happen, which is a real but recoverable gap, not a
// reason to fail registration itself.
const client = new EventBridgeClient({});

@Injectable()
export class EventBridgeService {
  private readonly logger = new Logger(EventBridgeService.name);
  private readonly busName = process.env.EVENTBRIDGE_BUS_NAME;

  async publish<T extends object>(detailType: string, detail: T): Promise<void> {
    if (!this.busName) {
      this.logger.warn(`EVENTBRIDGE_BUS_NAME not set — skipping publish of ${detailType}`);
      return;
    }

    const result = await client.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: this.busName,
            Source: "pk-literature.api-identity",
            DetailType: detailType,
            Detail: JSON.stringify(detail),
          },
        ],
      }),
    );

    const entry = result.Entries?.[0];
    if (entry?.ErrorCode) {
      this.logger.error(`EventBridge PutEvents failed for ${detailType}: ${entry.ErrorCode} — ${entry.ErrorMessage}`);
    }
  }
}
