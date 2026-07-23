import { Injectable, Logger } from "@nestjs/common";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

// Same shape as apps/api-publisher-import/src/common/eventbridge.service.ts
// — see that file for the "never fail the request over a best-effort
// event publish" reasoning, which applies just as much here (the order/
// payment row is the record of truth; an undelivered OrderCreated/
// OrderPaid event affects downstream consumers, not correctness of the
// transaction itself).
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
            Source: "pk-literature.api-commerce",
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
