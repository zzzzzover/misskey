/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiEvent } from './Event.js';

@Entity('event_favorite')
@Index(['userId', 'eventId'], { unique: true })
export class MiEventFavorite {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
	})
	public eventId: MiEvent['id'];

	@ManyToOne(type => MiEvent, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public event: MiEvent | null;

	@Index()
	@Column({
		...id(),
	})
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;
}
