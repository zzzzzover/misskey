/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EventRepository } from '@/models/repositories/event.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { EventEntityService } from '@/core/entities/EventEntityService.js';

export const meta = {
	tags: ['events'],

	requireCredential: true,
	secure: true,

	kind: 'write:events',

	errors: {
		noSuchEvent: {
			message: 'No such event.',
			code: 'NO_SUCH_EVENT',
			id: 'c484e33c-5025-4396-9c26-37f23d526f31',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'd7006846-ac5d-46f4-b5d8-a0e53c7a1c4c',
		},
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'cf8a83fe-e7af-4efe-a6a7-4421791a5576',
		},
		endsAtShouldBeInFuture: {
			message: 'End date should be in the future.',
			code: 'ENDS_AT_SHOULD_BE_IN_FUTURE',
			id: 'f9c5467f-d492-4d3c-9a8g-6be0f215f32e',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Event',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		eventId: { type: 'string', format: 'misskey:id' },
		title: { type: 'string', minLength: 1, maxLength: 128 },
		description: { type: 'string', minLength: 1, maxLength: 4096 },
		endsAt: { type: 'string', format: 'date-time' },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['eventId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private eventRepository: EventRepository,
		private eventEntityService: EventEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 获取活动
			const event = await this.eventRepository.findOneBy({ id: ps.eventId });

			if (event == null) {
				throw new ApiError(meta.errors.noSuchEvent);
			}

			// 只有创建者可以编辑
			if (event.userId !== me.id && !me.isAdmin) {
				throw new ApiError(meta.errors.accessDenied);
			}

			let banner = null;
			if (ps.bannerId != null) {
				banner = await this.driveFilesRepository.findOneBy({
					id: ps.bannerId,
					userId: me.id,
				});

				if (banner == null) {
					throw new ApiError(meta.errors.noSuchFile);
				}
			}

			const updates: Partial<Record<keyof typeof event, any>> = {};

			if (ps.title !== undefined) updates.title = ps.title;
			if (ps.description !== undefined) updates.description = ps.description;
			if (ps.bannerId !== undefined) updates.bannerId = ps.bannerId;

			if (ps.endsAt !== undefined) {
				// 检查结束日期是否在未来
				const endsAt = new Date(ps.endsAt);
				if (endsAt.getTime() <= Date.now()) {
					throw new ApiError(meta.errors.endsAtShouldBeInFuture);
				}
				updates.endsAt = endsAt;
			}

			// 更新活动
			await this.eventRepository.update(event.id, updates);

			// 获取更新后的活动
			const updatedEvent = await this.eventRepository.findOneByOrFail({ id: event.id });

			return await this.eventEntityService.pack(updatedEvent, me);
		});
	}
}
