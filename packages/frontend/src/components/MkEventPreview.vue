<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div style="position: relative;">
	<MkA :to="`/events/${event.id}`" class="eftoefju _panel" @click="updateLastReadedAt">
		<div class="banner" :style="bannerStyle">
			<div class="fade"></div>
			<div class="name"><i class="ti ti-calendar-event"></i> {{ event.name }}</div>
			<div v-if="event.isSensitive" class="sensitiveIndicator">{{ i18n.ts.sensitive }}</div>
			<div class="status">
				<div>
					<i class="ti ti-users ti-fw"></i>
					<I18n :src="i18n.ts._event.usersCount" tag="span" style="margin-left: 4px;">
						<template #n>
							<b>{{ event.usersCount }}</b>
						</template>
					</I18n>
				</div>
				<div>
					<i class="ti ti-pencil ti-fw"></i>
					<I18n :src="i18n.ts._event.notesCount" tag="span" style="margin-left: 4px;">
						<template #n>
							<b>{{ event.notesCount }}</b>
						</template>
					</I18n>
				</div>
			</div>
		</div>
		<article v-if="event.description">
			<p :title="event.description">{{ event.description.length > 85 ? event.description.slice(0, 85) + '…' : event.description }}</p>
		</article>
		<footer>
			<span v-if="event.lastNotedAt">
				{{ i18n.ts.updatedAt }}: <MkTime :time="event.lastNotedAt"/>
			</span>
		</footer>
	</MkA>
	<div
		v-if="event.lastNotedAt && (event.isFavorited || event.isFollowing) && (!lastReadedAt || Date.parse(event.lastNotedAt) > lastReadedAt)"
		class="indicator"
	></div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';

const props = defineProps<{
	event: Misskey.entities.Event;
}>();

const getLastReadedAt = (): number | null => {
	return miLocalStorage.getItemAsJson(`eventLastReadedAt:${props.event.id}`) ?? null;
};

const lastReadedAt = ref(getLastReadedAt());

watch(() => props.event.id, () => {
	lastReadedAt.value = getLastReadedAt();
});

const updateLastReadedAt = () => {
	lastReadedAt.value = props.event.lastNotedAt ? Date.parse(props.event.lastNotedAt) : Date.now();
};

const bannerStyle = computed(() => {
	if (props.event.bannerUrl) {
		return { backgroundImage: `url(${props.event.bannerUrl})` };
	} else {
		return { backgroundColor: '#4c5e6d' };
	}
});
</script>

<style lang="scss" scoped>
.eftoefju {
	display: block;
	position: relative;
	overflow: hidden;
	width: 100%;

	&:hover {
		text-decoration: none;
	}

	&:focus-within {
		outline: none;

		&::after {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			border-radius: inherit;
			pointer-events: none;
			box-shadow: inset 0 0 0 2px var(--MI_THEME-focus);
		}
	}

	> .banner {
		position: relative;
		width: 100%;
		height: 200px;
		background-position: center;
		background-size: cover;

		> .fade {
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			background: linear-gradient(0deg, var(--MI_THEME-panel), color(from var(--MI_THEME-panel) srgb r g b / 0));
		}

		> .name {
			position: absolute;
			top: 16px;
			left: 16px;
			max-width: calc(100% - 32px);
			padding: 12px 16px;
			box-sizing: border-box;
			background: rgba(0, 0, 0, 0.7);
			color: #fff;
			font-size: 1.2em;
		}

		> .status {
			position: absolute;
			z-index: 1;
			bottom: 16px;
			right: 16px;
			padding: 8px 12px;
			font-size: 80%;
			background: rgba(0, 0, 0, 0.7);
			border-radius: 6px;
			color: #fff;
		}

		> .sensitiveIndicator {
			position: absolute;
			z-index: 1;
			bottom: 16px;
			left: 16px;
			background: rgba(0, 0, 0, 0.7);
			color: var(--MI_THEME-warn);
			border-radius: 6px;
			font-weight: bold;
			font-size: 1em;
			padding: 4px 7px;
		}
	}

	> article {
		padding: 16px;

		> p {
			margin: 0;
			font-size: 1em;
		}
	}

	> footer {
		padding: 12px 16px;
		border-top: solid 0.5px var(--MI_THEME-divider);

		> span {
			opacity: 0.7;
			font-size: 0.9em;
		}
	}

	@media (max-width: 550px) {
		font-size: 0.9em;

		> .banner {
			height: 80px;

			> .status {
				display: none;
			}
		}

		> article {
			padding: 12px;
		}

		> footer {
			display: none;
		}
	}

	@media (max-width: 500px) {
		font-size: 0.8em;

		> .banner {
			height: 70px;
		}

		> article {
			padding: 8px;
		}
	}
}

.indicator {
	position: absolute;
	top: 0;
	right: 0;
	transform: translate(25%, -25%);
	background-color: var(--MI_THEME-accent);
	border: solid var(--MI_THEME-bg) 4px;
	border-radius: 100%;
	width: 1.5rem;
	height: 1.5rem;
	aspect-ratio: 1 / 1;
}
</style>
