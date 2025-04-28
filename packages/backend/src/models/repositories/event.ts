/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { db } from '@/db/postgre.js';
import { Event } from '@/models/entities/event.js';
import { EventParticipant } from '@/models/entities/event-participant.js';
import { User } from '@/models/entities/user.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { makePaginationQuery } from './make-pagination-query.js';

export const EventRepository = db.getRepository(Event).extend({
	async findActive(options: {
		limit?: number;
		sinceId?: string;
		untilId?: string;
	}) {
		const query = makePaginationQuery(this.createQueryBuilder('event'), options.sinceId, options.untilId)
			.andWhere('event.endsAt > :now', { now: new Date() })
			.leftJoinAndSelect('event.user', 'user')
			.leftJoinAndSelect('event.banner', 'banner')
			.orderBy('event.createdAt', 'DESC');

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
		const query = makePaginationQuery(this.createQueryBuilder('event'), options.sinceId, options.untilId)
			.andWhere('event.endsAt <= :now', { now: new Date() })
			.leftJoinAndSelect('event.user', 'user')
			.leftJoinAndSelect('event.banner', 'banner')
			.orderBy('event.endsAt', 'DESC');

		if (options.limit) {
			query.take(options.limit);
		}

		return await query.getMany();
	},

	async getEventWithParticipationStatus(eventId: Event['id'], userId?: User['id']): Promise<{
		event: Event & { isParticipating: boolean };
	}> {
		// Get event
		const event = await this.findOneByOrFail({ id: eventId });

		let isParticipating = false;

		// Check if user is participating
		if (userId) {
			const participating = await db.getRepository(EventParticipant).findOne({
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
