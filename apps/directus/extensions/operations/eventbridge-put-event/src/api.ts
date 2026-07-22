import { defineOperationApi } from '@directus/extensions-sdk';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

type Options = {
	eventBusName: string;
	source: string;
	detailType: string;
	detail: Record<string, unknown> | string;
};

// One client per container lifetime — EventBridgeClient pools
// connections internally, so there's no reason to build a fresh one
// per flow run. Region/credentials come from the ECS task's own
// environment (AWS_REGION + the task role's injected credentials),
// exactly like every other AWS SDK client in this repo — no explicit
// config needed here.
const client = new EventBridgeClient({});

export default defineOperationApi<Options>({
	id: 'eventbridge-put-event',

	handler: async ({ eventBusName, source, detailType, detail }) => {
		const detailPayload = typeof detail === 'string' ? detail : JSON.stringify(detail ?? {});

		const result = await client.send(
			new PutEventsCommand({
				Entries: [
					{
						EventBusName: eventBusName,
						Source: source,
						DetailType: detailType,
						Detail: detailPayload,
					},
				],
			}),
		);

		const entry = result.Entries?.[0];
		if (entry?.ErrorCode) {
			throw new Error(`EventBridge PutEvents failed: ${entry.ErrorCode} — ${entry.ErrorMessage ?? 'no message'}`);
		}

		return { eventId: entry?.EventId ?? null };
	},
});
