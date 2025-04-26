/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EventsRepository, DriveFilesRepository } from '@/models/_.js';
import type { MiEvent } from '@/models/Event.js';
import { IdService } from '@/core/IdService.js';
import { EventEntityService } from '@/core/entities/EventEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['events'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Event',
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'cd1e9f3e-5a12-4ab4-96f6-5d0a2cc32051',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 128 },
		description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048 },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
		color: { type: 'string', minLength: 1, maxLength: 16 },
		isSensitive: { type: 'boolean', nullable: true },
		allowRenoteToExternal: { type: 'boolean', nullable: true },
		startDate: { type: 'string', format: 'date-time', nullable: true },
		endDate: { type: 'string', format: 'date-time', nullable: true },
		location: { type: 'string', minLength: 1, maxLength: 256, nullable: true },
		isOnline: { type: 'boolean', nullable: true },
	},
	required: ['name'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.eventsRepository)
		private eventsRepository: EventsRepository,

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

			const now = new Date();

			const event = await this.eventsRepository.insert({
				id: this.idService.gen(),
				createdAt: now,
				updatedAt: null,
				lastNotedAt: null,
				userId: me.id,
				name: ps.name,
				description: ps.description ?? null,
				bannerId: banner ? banner.id : null,
				pinnedNoteIds: [],
				color: ps.color ?? '#86b300',
				isArchived: false,
				notesCount: 0,
				usersCount: 0,
				isSensitive: ps.isSensitive ?? false,
				allowRenoteToExternal: ps.allowRenoteToExternal ?? true,
				startDate: ps.startDate ? new Date(ps.startDate) : null,
				endDate: ps.endDate ? new Date(ps.endDate) : null,
				location: ps.location ?? null,
				isOnline: ps.isOnline ?? false,
			}).then(x => this.eventsRepository.findOneByOrFail(x.identifiers[0]));

			return await this.eventEntityService.pack(event, me);
		});
	}
}
