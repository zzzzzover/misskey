/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EventRepository } from '@/models/repositories/event.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository } from '@/models/index.js';
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
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '963e27f4-3f3a-4279-ac28-4ce970a8fc78',
		},
		accessDenied: {
			message: 'Only administrators or the event creator can update the event.',
			code: 'ACCESS_DENIED',
			id: 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		eventId: { type: 'string', format: 'misskey:id' },
		title: { type: 'string', minLength: 1, maxLength: 128 },
		description: { type: 'string', minLength: 1, maxLength: 4096 },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
		endsAt: { type: 'string', format: 'date-time' },
	},
	required: ['eventId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private eventRepository: EventRepository,
		private driveFileEntityService: DriveFileEntityService,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 获取活动
			const event = await this.eventRepository.findOneBy({ id: ps.eventId });
			if (event == null) {
				throw new ApiError(meta.errors.noSuchEvent);
			}

			// 检查权限 - 只有管理员或者活动创建者可以修改活动
			if (!me.isAdmin && event.userId !== me.id) {
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

			// 组装更新内容
			const updates = {} as any;

			if (ps.title !== undefined) updates.title = ps.title;
			if (ps.description !== undefined) updates.description = ps.description;
			if (ps.endsAt !== undefined) updates.endsAt = new Date(ps.endsAt);
			if (ps.bannerId !== undefined) updates.bannerId = ps.bannerId;

			// 更新活动
			await this.eventRepository.update(event.id, updates);

			// 获取更新后的活动
			const updatedEvent = await this.eventRepository.findOneByOrFail({ id: event.id });

			// 获取公开链接
			let bannerUrl = null;
			if (updatedEvent.banner) {
				bannerUrl = this.driveFileEntityService.getPublicUrl(updatedEvent.banner);
			}

			return {
				...updatedEvent,
				user: await this.getterService.getUser(updatedEvent.userId),
				bannerUrl,
				isParticipating: false, // 由前端根据用户ID自行判断
			};
		});
	}
}
