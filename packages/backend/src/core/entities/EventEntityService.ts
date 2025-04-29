/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiUser } from '@/models/User.js';
import type { Event } from '@/models/entities/event.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { EventParticipantRepository } from '@/models/repositories/event-participant.js';
import { EventRepository } from '@/models/repositories/event.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class EventEntityService {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private eventRepository: EventRepository,
		private eventParticipantRepository: EventParticipantRepository,
		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: Event['id'] | Event,
		me?: { id: MiUser['id'] } | null | undefined,
		detailed?: boolean,
	): Promise<Packed<'Event'>> {
		const event = typeof src === 'object' ? src : await this.eventRepository.findOneByOrFail({ id: src });
		const meId = me ? me.id : null;

		const banner = event.bannerId ? await this.driveFilesRepository.findOneBy({ id: event.bannerId }) : null;

		// 检查用户是否参与了该事件
		let isParticipating = false;
		if (meId) {
			isParticipating = await this.eventParticipantRepository.isParticipating(meId, event.id);
		}

		// 基本事件信息
		const packed: Packed<'Event'> = {
			id: event.id,
			createdAt: event.createdAt.toISOString(),
			endsAt: event.endsAt.toISOString(),
			title: event.title,
			description: event.description,
			bannerId: event.bannerId,
			bannerUrl: banner ? this.driveFileEntityService.getPublicUrl(banner) : null,
			userId: event.userId,
			participantsCount: event.participantsCount,
			isParticipating,
		};

		// 如果需要详细信息，可以添加创建者用户信息
		if (detailed && event.user) {
			packed.user = await this.userEntityService.pack(event.user, me);
		}

		// 如果需要更详细的信息，可以查询并添加参与者列表
		if (detailed && detailed === true) {
			const participants = await this.eventParticipantRepository.findByEventId(event.id, { limit: 10 });
			packed.participants = await Promise.all(
				participants.filter(p => p.user != null).map(p => this.userEntityService.pack(p.user!, me)),
			);
		}

		return packed;
	}

	@bindThis
	public async packMany(
		events: (Event['id'] | Event)[],
		me?: { id: MiUser['id'] } | null | undefined,
		detailed?: boolean,
	): Promise<Packed<'Event'>[]> {
		return await Promise.all(events.map(e => this.pack(e, me, detailed)));
	}
}
