/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../util/id.js';
import { User } from './user.js';
import { Event } from './event.js';

@Entity()
export class EventParticipant {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: '参与日期',
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: '用户ID',
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column({
		...id(),
		comment: '活动ID',
	})
	public eventId: Event['id'];

	@ManyToOne(type => Event, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public event: Event | null;
}
