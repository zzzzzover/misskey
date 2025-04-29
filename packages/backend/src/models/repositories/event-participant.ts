/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { MiEventParticipant } from '@/models/EventParticipant.js';
import { MiEvent } from '@/models/Event.js';
import { MiUser } from '@/models/User.js';

export const EventParticipantRepository = (db: DataSource) => db.getRepository(MiEventParticipant).extend({
	async findByEventId(eventId: MiEvent['id'], options: {
		limit?: number;
		sinceId?: string;
		untilId?: string;
	}) {
		const query = this.createQueryBuilder('participant')
			.where('participant.eventId = :eventId', { eventId })
			.leftJoinAndSelect('participant.user', 'user')
			.orderBy('participant.createdAt', 'DESC');

		if (options.sinceId) {
			query.andWhere('participant.id > :sinceId', { sinceId: options.sinceId });
		}

		if (options.untilId) {
			query.andWhere('participant.id < :untilId', { untilId: options.untilId });
		}

		if (options.limit) {
			query.take(options.limit);
		}

		return await query.getMany();
	},

	async isParticipating(userId: MiUser['id'], eventId: MiEvent['id']): Promise<boolean> {
		const participant = await this.findOne({
			where: {
				userId,
				eventId,
			},
		});

		return !!participant;
	},
});
