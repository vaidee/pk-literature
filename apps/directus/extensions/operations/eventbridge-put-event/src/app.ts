import { defineOperationApp } from '@directus/extensions-sdk';

export default defineOperationApp({
	id: 'eventbridge-put-event',
	name: 'EventBridge: Put Event',
	icon: 'bolt',
	description: 'Publish an event onto the platform EventBridge bus (BookPublished, etc. — plan/contracts/events/).',
	overview: ({ detailType, eventBusName }) => [
		{ label: 'Detail Type', text: detailType },
		{ label: 'Bus', text: eventBusName },
	],
	options: [
		{
			field: 'eventBusName',
			name: 'Event Bus Name',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				note: 'From the EVENTBRIDGE_BUS_NAME environment variable in most flows — {{$env.EVENTBRIDGE_BUS_NAME}}.',
				options: { placeholder: '{{$env.EVENTBRIDGE_BUS_NAME}}' },
			},
			schema: { default_value: '{{$env.EVENTBRIDGE_BUS_NAME}}' },
		},
		{
			field: 'source',
			name: 'Source',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				options: { placeholder: 'pk-literature.directus' },
			},
			schema: { default_value: 'pk-literature.directus' },
		},
		{
			field: 'detailType',
			name: 'Detail Type',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				options: { placeholder: 'BookPublished' },
			},
		},
		{
			field: 'detail',
			name: 'Detail (JSON)',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: { language: 'json' },
				note: 'Usually {{$trigger.payload}} or {{$last}} from the preceding operation.',
			},
		},
	],
});
