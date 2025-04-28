/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import { EventRepository } from '@/models/repositories/event.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { GetterService } from '@/server/api/GetterService.js';

export const meta = {
	tags: ['events'],

	requireCredential: true,

	kind: 'write:events',

	res: {
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

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '963e27f4-3f3a-4279-ac28-4ce970a8fc78',
		},
		accessDenied: {
			message: 'Only administrators can create events.',
			code: 'ACCESS_DENIED',
			id: 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string', minLength: 1, maxLength: 128 },
		description: { type: 'string', minLength: 1, maxLength: 4096 },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
		endsAt: { type: 'string', format: 'date-time' },
	},
	required: ['title', 'description', 'endsAt'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private idService: IdService,
		private eventRepository: EventRepository,
		private driveFileEntityService: DriveFileEntityService,
		private roleService: RoleService,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 检查权限 - 只有管理员可以创建活动
			if (!me.isAdmin) {
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

			const event = await this.eventRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				endsAt: new Date(ps.endsAt),
				userId: me.id,
				title: ps.title,
				description: ps.description,
				bannerId: banner?.id || null,
				participantsCount: 0,
			}).then(x => this.eventRepository.findOneByOrFail({ id: x.identifiers[0].id }));

			// 获取公开链接
			let bannerUrl = null;
			if (banner) {
				bannerUrl = this.driveFileEntityService.getPublicUrl(banner);
			}

			return {
				...event,
				user: await this.getterService.getUser(me.id),
				bannerUrl,
				isParticipating: false,
			};
		});
	}
}
