/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedEventSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		endsAt: {
			type: 'string',
			format: 'date-time',
		},
		title: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
		bannerId: {
			type: 'string',
			format: 'id',
			nullable: true,
		},
		bannerUrl: {
			type: 'string',
			nullable: true,
		},
		userId: {
			type: 'string',
			format: 'id',
		},
		participantsCount: {
			type: 'number',
		},
		isParticipating: {
			type: 'boolean',
		},
		user: {
			type: 'object',
			optional: true,
			ref: 'UserDetailed',
		},
		participants: {
			type: 'array',
			optional: true,
			items: {
				type: 'object',
				ref: 'UserDetailed',
			},
		},
	},
} as const;
