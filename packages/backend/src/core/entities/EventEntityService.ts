/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { EventsRepository, EventFollowingsRepository, EventFavoritesRepository, DriveFilesRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiUser } from '@/models/User.js';
import type { MiEvent } from '@/models/Event.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class EventEntityService {
	constructor(
		@Inject(DI.eventsRepository)
		private eventsRepository: EventsRepository,

		@Inject(DI.eventFollowingsRepository)
		private eventFollowingsRepository: EventFollowingsRepository,

		@Inject(DI.eventFavoritesRepository)
		private eventFavoritesRepository: EventFavoritesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiEvent['id'] | MiEvent,
		me?: { id: MiUser['id'] } | null | undefined,
		detailed?: boolean,
	): Promise<Packed<'Event'>> {
		const event = typeof src === 'object' ? src : await this.eventsRepository.findOneByOrFail({ id: src });
		const meId = me ? me.id : null;

		const banner = event.bannerId ? await this.driveFilesRepository.findOneBy({ id: event.bannerId }) : null;

		const isFollowing = meId ? await this.eventFollowingsRepository.exists({
			where: {
				followerId: meId,
				followeeId: event.id,
			},
		}) : false;

		const isFavorited = meId ? await this.eventFavoritesRepository.exists({
			where: {
				userId: meId,
				eventId: event.id,
			},
		}) : false;

		return {
			id: event.id,
			createdAt: this.idService.parse(event.id).date.toISOString(),
			name: event.name,
			description: event.description,
			userId: event.userId,
			bannerUrl: banner ? this.driveFileEntityService.getPublicUrl(banner) : null,
			location: event.location,
			start: event.start ? event.start.toISOString() : null,
			end: event.end ? event.end.toISOString() : null,
			isOnline: event.isOnline,
			participantsCount: event.participantsCount,

			...(me ? {
				isFollowing,
				isFavorited,
			} : {}),

			...(detailed ? {
				// 详细信息可以在这里添加
			} : {}),
		};
	}
}
