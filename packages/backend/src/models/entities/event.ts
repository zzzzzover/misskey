/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { id } from '../util/id.js';
import { User } from './user.js';
import { DriveFile } from './drive-file.js';
import type { EventParticipant } from './event-participant.js';

@Entity()
export class Event {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: '创建日期',
	})
	public createdAt: Date;

	@Index()
	@Column('timestamp with time zone', {
		comment: '结束日期',
	})
	public endsAt: Date;

	@Index()
	@Column({
		...id(),
		comment: '创建者ID',
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
		nullable: true,
		comment: '横幅文件ID',
	})
	public bannerId: DriveFile['id'] | null;

	@ManyToOne(type => DriveFile, {
		onDelete: 'SET NULL',
	})
	@JoinColumn()
	public banner: DriveFile | null;

	@Column('varchar', {
		length: 128,
		comment: '活动标题',
	})
	public title: string;

	@Column('varchar', {
		length: 4096,
		comment: '活动描述',
	})
	public description: string;

	@Column('integer', {
		default: 0,
		comment: '参与人数',
	})
	public participantsCount: number;

	@OneToMany(type => 'EventParticipant', eventParticipant => eventParticipant.event)
	public participants: EventParticipant[];
}
