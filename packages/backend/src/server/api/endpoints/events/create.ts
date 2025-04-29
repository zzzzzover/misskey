/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
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

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Event',
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'cd1e9f3e-5a12-4ab4-96f6-5d0a2cc32050',
		},
		endsAtShouldBeInFuture: {
			message: 'End date should be in the future.',
			code: 'ENDS_AT_SHOULD_BE_IN_FUTURE',
			id: 'f9c5467f-d492-4d3c-9a8g-6be0f215f32d',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string', minLength: 1, maxLength: 128 },
		description: { type: 'string', minLength: 1, maxLength: 4096 },
		endsAt: { type: 'string', format: 'date-time' },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['title', 'description', 'endsAt'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private eventRepository: EventRepository,
		private idService: IdService,
		private eventEntityService: EventEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
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

			// 检查结束日期是否在未来
			const endsAt = new Date(ps.endsAt);
			if (endsAt.getTime() <= Date.now()) {
				throw new ApiError(meta.errors.endsAtShouldBeInFuture);
			}

			const event = await this.eventRepository.insert({
				id: this.idService.gen(),
				createdAt: new Date(),
				userId: me.id,
				title: ps.title,
				description: ps.description,
				endsAt: endsAt,
				bannerId: banner ? banner.id : null,
				participantsCount: 0,
			}).then(x => this.eventRepository.findOneByOrFail({ id: x.identifiers[0].id }));

			return await this.eventEntityService.pack(event, me);
		});
	}
}
