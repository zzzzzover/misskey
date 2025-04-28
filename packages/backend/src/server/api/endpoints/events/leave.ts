/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EventRepository } from '@/models/repositories/event.js';
import { EventParticipantRepository } from '@/models/repositories/event-participant.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['events'],

	requireCredential: true,

	kind: 'write:events',

	errors: {
		noSuchEvent: {
			message: 'No such event.',
			code: 'NO_SUCH_EVENT',
			id: '3e292f71-e2e2-4cea-8bb1-5f3e86326520',
		},
		notParticipating: {
			message: 'You are not participating in this event.',
			code: 'NOT_PARTICIPATING',
			id: '5c8f4b3f-29b0-4046-a286-2c48a0ec8f75',
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
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private eventRepository: EventRepository,
		private eventParticipantRepository: EventParticipantRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 获取活动
			const event = await this.eventRepository.findOneBy({ id: ps.eventId });
			if (event == null) {
				throw new ApiError(meta.errors.noSuchEvent);
			}

			// 检查是否参与活动
			const participant = await this.eventParticipantRepository.findOne({
				where: {
					userId: me.id,
					eventId: event.id,
				},
			});

			if (participant == null) {
				throw new ApiError(meta.errors.notParticipating);
			}

			// 删除参与记录
			await this.eventParticipantRepository.delete({
				userId: me.id,
				eventId: event.id,
			});

			// 更新参与人数
			await this.eventRepository.update(event.id, {
				participantsCount: Math.max(0, event.participantsCount - 1),
			});

			return {
				success: true,
			};
		});
	}
}
