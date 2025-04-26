/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiEvent } from './Event.js';

@Entity('event_following')
@Index(['followerId', 'followeeId'], { unique: true })
export class MiEventFollowing {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The followee event ID.',
	})
	public followeeId: MiEvent['id'];

	@ManyToOne(type => MiEvent, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public followee: MiEvent | null;

	@Index()
	@Column({
		...id(),
		comment: 'The follower user ID.',
	})
	public followerId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public follower: MiUser | null;
}
