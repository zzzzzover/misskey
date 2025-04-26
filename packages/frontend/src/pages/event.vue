<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<MkSpacer :contentMax="700">
		<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
			<div v-if="event && tab === 'overview'" class="_gaps">
				<div class="_panel" :class="$style.bannerContainer">
					<XEventFollowButton :event="event" :full="true" :class="$style.subscribe"/>
					<MkButton v-if="favorited" v-tooltip="i18n.ts.unfavorite" asLike class="button" rounded primary :class="$style.favorite" @click="unfavorite()"><i class="ti ti-star"></i></MkButton>
					<MkButton v-else v-tooltip="i18n.ts.favorite" asLike class="button" rounded :class="$style.favorite" @click="favorite()"><i class="ti ti-star"></i></MkButton>
					<div :style="{ backgroundImage: event.bannerUrl ? `url(${event.bannerUrl})` : undefined }" :class="$style.banner">
						<div :class="$style.bannerStatus">
							<div><i class="ti ti-users ti-fw"></i><I18n :src="i18n.ts._event.usersCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ event.usersCount }}</b></template></I18n></div>
							<div><i class="ti ti-pencil ti-fw"></i><I18n :src="i18n.ts._event.notesCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ event.notesCount }}</b></template></I18n></div>
						</div>
						<div v-if="event.isSensitive" :class="$style.sensitiveIndicator">{{ i18n.ts.sensitive }}</div>
						<div :class="$style.bannerFade"></div>
					</div>
					<div v-if="event.description" :class="$style.description">
						<Mfm :text="event.description" :isNote="false"/>
					</div>
					<div :class="$style.eventInfo">
						<div v-if="event.startDate" :class="$style.eventDate">
							<i class="ti ti-calendar"></i> {{ formatDate(event.startDate) }}
							<span v-if="event.endDate">〜 {{ formatDate(event.endDate) }}</span>
						</div>
					</div>
				</div>

				<MkFoldableSection>
					<template #header><i class="ti ti-pin ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.pinnedNotes }}</template>
					<div v-if="event.pinnedNotes && event.pinnedNotes.length > 0" class="_gaps">
						<MkNote v-for="note in event.pinnedNotes" :key="note.id" class="_panel" :note="note"/>
					</div>
				</MkFoldableSection>
			</div>
			<div v-if="event && tab === 'timeline'" class="_gaps">
				<MkInfo v-if="event.isArchived" warn>{{ i18n.ts.thisEventArchived }}</MkInfo>

				<!-- 自动焦点仅在桌面设备上启用 -->
				<MkPostForm v-if="$i && prefer.r.showFixedPostFormInChannel.value" :event="event" class="post-form _panel" fixed :autofocus="deviceKind === 'desktop'"/>

				<MkTimeline :key="eventId" src="event" :event="eventId" @before="before" @after="after" @note="miLocalStorage.setItemAsJson(`eventLastReadedAt:${event.id}`, Date.now())"/>
			</div>
			<div v-else-if="tab === 'featured'">
				<MkNotes :pagination="featuredPagination"/>
			</div>
			<div v-else-if="tab === 'search'">
				<div v-if="notesSearchAvailable" class="_gaps">
					<div>
						<MkInput v-model="searchQuery" @enter="search()">
							<template #prefix><i class="ti ti-search"></i></template>
						</MkInput>
						<MkButton primary rounded style="margin-top: 8px;" @click="search()">{{ i18n.ts.search }}</MkButton>
					</div>
					<MkNotes v-if="searchPagination" :key="searchKey" :pagination="searchPagination"/>
				</div>
				<div v-else>
					<MkInfo warn>{{ i18n.ts.notesSearchNotAvailable }}</MkInfo>
				</div>
			</div>
		</MkHorizontalSwipe>
	</MkSpacer>
	<template #footer>
		<div :class="$style.footer">
			<MkSpacer :contentMax="700" :marginMin="16" :marginMax="16">
				<div class="_buttonsCenter">
					<MkButton inline rounded primary gradate @click="openPostForm()"><i class="ti ti-pencil"></i> {{ i18n.ts._event.postToTheEvent }}</MkButton>
				</div>
			</MkSpacer>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { url } from '@@/js/config.js';
import type { PageHeaderItem } from '@/types/page-header.js';
import MkPostForm from '@/components/MkPostForm.vue';
import MkTimeline from '@/components/MkTimeline.vue';
import XEventFollowButton from '@/components/MkEventFollowButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i, iAmModerator } from '@/i.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { deviceKind } from '@/utility/device-kind.js';
import MkNotes from '@/components/MkNotes.vue';
import { favoritedEventsCache } from '@/cache.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import { prefer } from '@/preferences.js';
import MkNote from '@/components/MkNote.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';
import { isSupportShare } from '@/utility/navigator.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { notesSearchAvailable } from '@/utility/check-permissions.js';
import { miLocalStorage } from '@/local-storage.js';
import { useRouter } from '@/router.js';

const router = useRouter();

const props = defineProps<{
	eventId: string;
}>();

const tab = ref('overview');

const event = ref<Misskey.entities.Event | null>(null);
const favorited = ref(false);
const searchQuery = ref('');
const searchPagination = ref();
const searchKey = ref('');
const featuredPagination = computed(() => ({
	endpoint: 'notes/featured' as const,
	limit: 10,
	params: {
		eventId: props.eventId,
	},
}));

watch(() => props.eventId, async () => {
	event.value = await misskeyApi('events/show', {
		eventId: props.eventId,
	});
	favorited.value = event.value.isFavorited ?? false;
	if (favorited.value || event.value.isFollowing) {
		tab.value = 'timeline';
	}

	if ((favorited.value || event.value.isFollowing) && event.value.lastNotedAt) {
		const lastReadedAt: number = miLocalStorage.getItemAsJson(`eventLastReadedAt:${event.value.id}`) ?? 0;
		const lastNotedAt = Date.parse(event.value.lastNotedAt);

		if (lastNotedAt > lastReadedAt) {
			miLocalStorage.setItemAsJson(`eventLastReadedAt:${event.value.id}`, lastNotedAt);
		}
	}
}, { immediate: true });

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString();
}

function edit() {
	router.push(`/events/${event.value?.id}/edit`);
}

function openPostForm() {
	os.post({
		event: event.value,
	});
}

function favorite() {
	if (!event.value) return;

	os.apiWithDialog('events/favorite', {
		eventId: event.value.id,
	}).then(() => {
		favorited.value = true;
		favoritedEventsCache.delete();
	});
}

async function unfavorite() {
	if (!event.value) return;

	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unfavoriteConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('events/unfavorite', {
		eventId: event.value.id,
	}).then(() => {
		favorited.value = false;
		favoritedEventsCache.delete();
	});
}

async function search() {
	if (!event.value) return;

	const query = searchQuery.value.toString().trim();

	if (query == null) return;

	searchPagination.value = {
		endpoint: 'notes/search',
		limit: 10,
		params: {
			query: query,
			eventId: event.value.id,
		},
	};

	searchKey.value = query;
}

const headerActions = computed(() => {
	if (event.value && event.value.userId) {
		const headerItems: PageHeaderItem[] = [];

		headerItems.push({
			icon: 'ti ti-link',
			text: i18n.ts.copyUrl,
			handler: async (): Promise<void> => {
				if (!event.value) {
					console.warn('failed to copy event URL. event.value is null.');
					return;
				}
				copyToClipboard(`${url}/events/${event.value.id}`);
			},
		});

		if (isSupportShare()) {
			headerItems.push({
				icon: 'ti ti-share',
				text: i18n.ts.share,
				handler: async (): Promise<void> => {
					if (!event.value) {
						console.warn('failed to share event. event.value is null.');
						return;
					}

					navigator.share({
						title: event.value.name,
						text: event.value.description ?? undefined,
						url: `${url}/events/${event.value.id}`,
					});
				},
			});
		}

		if (($i && $i.id === event.value.userId) || iAmModerator) {
			headerItems.push({
				icon: 'ti ti-settings',
				text: i18n.ts.edit,
				handler: edit,
			});
		}

		return headerItems.length > 0 ? headerItems : null;
	} else {
		return null;
	}
});

const headerTabs = computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
	icon: 'ti ti-info-circle',
}, {
	key: 'timeline',
	title: i18n.ts.timeline,
	icon: 'ti ti-home',
}, {
	key: 'featured',
	title: i18n.ts.featured,
	icon: 'ti ti-bolt',
}, {
	key: 'search',
	title: i18n.ts.search,
	icon: 'ti ti-search',
}]);

function before() {
	// 定义前置处理函数
}

function after() {
	// 定义后置处理函数
}

definePage(() => ({
	title: event.value ? event.value.name : i18n.ts.event,
	icon: 'ti ti-calendar-event',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.bannerContainer {
	position: relative;
}

.subscribe {
	position: absolute;
	z-index: 1;
	top: 16px;
	left: 16px;
}

.favorite {
	position: absolute;
	z-index: 1;
	top: 16px;
	right: 16px;
}

.banner {
	position: relative;
	height: 200px;
	background-position: center;
	background-size: cover;
}

.bannerFade {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 64px;
	background: linear-gradient(0deg, var(--MI_THEME-panel), color(from var(--MI_THEME-panel) srgb r g b / 0));
}

.bannerStatus {
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

.description {
	padding: 16px;
}

.eventInfo {
	padding: 0 16px 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.eventDate {
	display: flex;
	align-items: center;
	gap: 4px;
}

.sensitiveIndicator {
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
</style>
