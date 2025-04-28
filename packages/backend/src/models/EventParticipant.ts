/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiEvent } from './Event.js';

@Entity('event_participant')
export class MiEventParticipant {
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
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index()
	@Column({
		...id(),
		comment: '活动ID',
	})
	public eventId: MiEvent['id'];

	@ManyToOne(type => MiEvent, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public event: MiEvent | null;
}
