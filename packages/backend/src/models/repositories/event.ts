/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { Event } from '@/models/entities/event.js';
import { EventParticipant } from '@/models/entities/event-participant.js';
import { MiUser } from '@/models/User.js';
import { MiDriveFile } from '@/models/DriveFile.js';

export const EventRepository = (db: DataSource) => db.getRepository(Event).extend({
	async findActive(options: {
		limit?: number;
		sinceId?: string;
		untilId?: string;
	}) {
		const query = this.createQueryBuilder('event')
			.andWhere('event.endsAt > :now', { now: new Date() })
			.leftJoinAndSelect('event.user', 'user')
			.leftJoinAndSelect('event.banner', 'banner')
			.orderBy('event.createdAt', 'DESC');

		if (options.sinceId) {
			query.andWhere('event.id > :sinceId', { sinceId: options.sinceId });
		}

		if (options.untilId) {
			query.andWhere('event.id < :untilId', { untilId: options.untilId });
		}

		if (options.limit) {
			query.take(options.limit);
		}

		return await query.getMany();
	},

	async findEnded(options: {
		limit?: number;
		sinceId?: string;
		untilId?: string;
	}) {
		const query = this.createQueryBuilder('event')
			.andWhere('event.endsAt <= :now', { now: new Date() })
			.leftJoinAndSelect('event.user', 'user')
			.leftJoinAndSelect('event.banner', 'banner')
			.orderBy('event.endsAt', 'DESC');

		if (options.sinceId) {
			query.andWhere('event.id > :sinceId', { sinceId: options.sinceId });
		}

		if (options.untilId) {
			query.andWhere('event.id < :untilId', { untilId: options.untilId });
		}

		if (options.limit) {
			query.take(options.limit);
		}

		return await query.getMany();
	},

	async getEventWithParticipationStatus(eventId: Event['id'], userId?: MiUser['id']): Promise<{
		event: Event & { isParticipating: boolean };
	}> {
		// Get event
		const event = await this.findOneByOrFail({ id: eventId });

		let isParticipating = false;

		// Check if user is participating
		if (userId) {
			const participating = await this.manager.getRepository(EventParticipant).findOne({
				where: {
					userId: userId,
					eventId: eventId,
				},
			});
			isParticipating = !!participating;
		}

		return {
			event: {
				...event,
				isParticipating,
			},
		};
	},
});
