/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EventsListQueryService } from '@/core/EventsListQueryService.js';
import { EventRepository } from '@/models/repositories/event.js';
import { EventParticipantRepository } from '@/models/repositories/event-participant.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { DriveFile } from '@/models/entities/drive-file.js';

export const meta = {
	tags: ['events'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				endsAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				title: {
					type: 'string',
					optional: false, nullable: false,
				},
				description: {
					type: 'string',
					optional: false, nullable: false,
				},
				bannerId: {
					type: 'string',
					optional: false, nullable: true,
					format: 'id',
				},
				bannerUrl: {
					type: 'string',
					optional: false, nullable: true,
				},
				userId: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				user: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserDetailed',
				},
				participantsCount: {
					type: 'number',
					optional: false, nullable: false,
				},
				isParticipating: {
					type: 'boolean',
					optional: false, nullable: false,
				},
			},
		},
	},

	errors: {
		invalidType: {
			message: 'Invalid event type.',
			code: 'INVALID_TYPE',
			id: 'a7865789-cf04-4adf-b32a-d9382574d98b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		type: { type: 'string', enum: ['active', 'ended'], default: 'active' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private eventRepository: EventRepository,
		private eventParticipantRepository: EventParticipantRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get events
			let events;
			if (ps.type === 'active') {
				events = await this.eventRepository.findActive({
					limit: ps.limit,
					sinceId: ps.sinceId,
					untilId: ps.untilId,
				});
			} else if (ps.type === 'ended') {
				events = await this.eventRepository.findEnded({
					limit: ps.limit,
					sinceId: ps.sinceId,
					untilId: ps.untilId,
				});
			} else {
				throw new ApiError(meta.errors.invalidType);
			}

			// Add participation status
			const eventsWithParticipation = await Promise.all(events.map(async event => {
				let isParticipating = false;

				if (me) {
					isParticipating = await this.eventParticipantRepository.isParticipating(me.id, event.id);
				}

				let bannerUrl = null;
				if (event.banner) {
					bannerUrl = this.driveFilesRepository.getPublicUrl(event.banner);
				}

				return {
					...event,
					bannerUrl,
					isParticipating,
				};
			}));

			return eventsWithParticipation;
		});
	}
}
