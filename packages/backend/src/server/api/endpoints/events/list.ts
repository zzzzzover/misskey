/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EventRepository } from '@/models/repositories/event.js';
import { EventParticipantRepository } from '@/models/repositories/event-participant.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { EventEntityService } from '@/core/entities/EventEntityService.js';

export const meta = {
	tags: ['events'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Event',
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
		private eventEntityService: EventEntityService,
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

			// 使用EventEntityService处理事件数据
			return await this.eventEntityService.packMany(events, me);
		});
	}
}
