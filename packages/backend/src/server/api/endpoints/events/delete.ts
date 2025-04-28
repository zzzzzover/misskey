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
		accessDenied: {
			message: 'Only administrators or the event creator can delete the event.',
			code: 'ACCESS_DENIED',
			id: 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9',
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

			// 检查权限 - 只有管理员或者活动创建者可以删除活动
			if (!me.isAdmin && event.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			// 删除活动参与者
			await this.eventParticipantRepository.delete({
				eventId: event.id,
			});

			// 删除活动
			await this.eventRepository.delete(event.id);

			return {
				success: true,
			};
		});
	}
}
