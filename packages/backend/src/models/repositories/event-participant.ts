/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { db } from '@/db/postgre.js';
import { EventParticipant } from '@/models/entities/event-participant.js';
import { Event } from '@/models/entities/event.js';
import { User } from '@/models/entities/user.js';
import { makePaginationQuery } from './make-pagination-query.js';

export const EventParticipantRepository = db.getRepository(EventParticipant).extend({
	async findByEventId(eventId: Event['id'], options: {
		limit?: number;
		sinceId?: string;
		untilId?: string;
	}) {
		const query = makePaginationQuery(this.createQueryBuilder('participant'), options.sinceId, options.untilId)
			.andWhere('participant.eventId = :eventId', { eventId })
			.leftJoinAndSelect('participant.user', 'user')
			.orderBy('participant.createdAt', 'DESC');

		if (options.limit) {
			query.take(options.limit);
		}

		return await query.getMany();
	},

	async isParticipating(userId: User['id'], eventId: Event['id']): Promise<boolean> {
		const participant = await this.findOne({
			where: {
				userId,
				eventId,
			},
		});

		return !!participant;
	},
});
