/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EventsRepository } from '@/models/_.js';
import { EventEntityService } from '@/core/entities/EventEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['events'],

	requireCredential: false,

	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Event',
	},

	errors: {
		noSuchEvent: {
			message: 'No such event.',
			code: 'NO_SUCH_EVENT',
			id: '70ca5530-7d76-4a06-b582-f0c3261c8562',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		eventId: { type: 'string', format: 'misskey:id' },
	},
	required: ['eventId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.eventsRepository)
		private eventsRepository: EventsRepository,

		private eventEntityService: EventEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const event = await this.eventsRepository.findOneBy({
				id: ps.eventId,
			});

			if (event == null) {
				throw new ApiError(meta.errors.noSuchEvent);
			}

			return await this.eventEntityService.pack(event, me, true);
		});
	}
}
