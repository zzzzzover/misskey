/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import { EventRepository } from '@/models/repositories/event.js';
import { EventParticipantRepository } from '@/models/repositories/event-participant.js';
import { ApiError } from '@/server/api/error.js';
import { GetterService } from '@/server/api/GetterService.js';

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
		alreadyParticipating: {
			message: 'You are already participating in this event.',
			code: 'ALREADY_PARTICIPATING',
			id: '6c5a7519-44c4-4070-9349-0b436bd0d0a2',
		},
		eventEnded: {
			message: 'This event has already ended.',
			code: 'EVENT_ENDED',
			id: '78b5f267-1056-4f37-b693-e75e92a98048',
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
		private idService: IdService,
		private eventRepository: EventRepository,
		private eventParticipantRepository: EventParticipantRepository,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 获取活动
			const event = await this.eventRepository.findOneBy({ id: ps.eventId });
			if (event == null) {
				throw new ApiError(meta.errors.noSuchEvent);
			}

			// 检查活动是否已结束
			if (event.endsAt < new Date()) {
				throw new ApiError(meta.errors.eventEnded);
			}

			// 检查是否已经参加
			const isParticipating = await this.eventParticipantRepository.isParticipating(me.id, event.id);
			if (isParticipating) {
				throw new ApiError(meta.errors.alreadyParticipating);
			}

			// 创建参与记录
			await this.eventParticipantRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: me.id,
				eventId: event.id,
			});

			// 更新参与人数
			await this.eventRepository.update(event.id, {
				participantsCount: event.participantsCount + 1,
			});

			return {
				success: true,
			};
		});
	}
}
