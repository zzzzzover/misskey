<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<MkSpacer :contentMax="1200">
		<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
			<div v-if="tab === 'search'" :class="$style.searchRoot">
				<div class="_gaps">
					<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search" @enter="search">
						<template #prefix><i class="ti ti-search"></i></template>
					</MkInput>
					<MkRadios v-model="searchType" @update:modelValue="search()">
						<option value="nameAndDescription">{{ i18n.ts._event.nameAndDescription }}</option>
						<option value="nameOnly">{{ i18n.ts._event.nameOnly }}</option>
					</MkRadios>
					<MkButton large primary gradate rounded @click="search">{{ i18n.ts.search }}</MkButton>
				</div>

				<MkFoldableSection v-if="eventPagination">
					<template #header>{{ i18n.ts.searchResult }}</template>
					<MkEventList :key="key" :pagination="eventPagination"/>
				</MkFoldableSection>
			</div>
			<div v-if="tab === 'featured'">
				<MkPagination v-slot="{items}" :pagination="featuredPagination">
					<div :class="$style.root">
						<MkEventPreview v-for="event in items" :key="event.id" :event="event"/>
					</div>
				</MkPagination>
			</div>
			<div v-else-if="tab === 'favorites'">
				<MkPagination v-slot="{items}" :pagination="favoritesPagination">
					<div :class="$style.root">
						<MkEventPreview v-for="event in items" :key="event.id" :event="event"/>
					</div>
				</MkPagination>
			</div>
			<div v-else-if="tab === 'following'">
				<MkPagination v-slot="{items}" :pagination="followingPagination">
					<div :class="$style.root">
						<MkEventPreview v-for="event in items" :key="event.id" :event="event"/>
					</div>
				</MkPagination>
			</div>
			<div v-else-if="tab === 'owned'">
				<MkButton class="new" @click="create()"><i class="ti ti-plus"></i></MkButton>
				<MkPagination v-slot="{items}" :pagination="ownedPagination">
					<div :class="$style.root">
						<MkEventPreview v-for="event in items" :key="event.id" :event="event"/>
					</div>
				</MkPagination>
			</div>
		</MkHorizontalSwipe>
	</MkSpacer>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import MkEventPreview from '@/components/MkEventPreview.vue';
import MkEventList from '@/components/MkEventList.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';

const router = useRouter();

const props = defineProps<{
	query: string;
	type?: string;
}>();

const key = ref('');
const tab = ref('featured');
const searchQuery = ref('');
const searchType = ref('nameAndDescription');
const eventPagination = ref();

onMounted(() => {
	searchQuery.value = props.query ?? '';
	searchType.value = props.type ?? 'nameAndDescription';
});

const featuredPagination = {
	endpoint: 'events/featured' as const,
	limit: 10,
	noPaging: true,
};
const favoritesPagination = {
	endpoint: 'events/my-favorites' as const,
	limit: 100,
	noPaging: true,
};
const followingPagination = {
	endpoint: 'events/followed' as const,
	limit: 10,
};
const ownedPagination = {
	endpoint: 'events/owned' as const,
	limit: 10,
};

async function search() {
	const query = searchQuery.value.toString().trim();

	if (query == null) return;

	const type = searchType.value.toString().trim();

	eventPagination.value = {
		endpoint: 'events/search',
		limit: 10,
		params: {
			query: searchQuery.value,
			type: type,
		},
	};

	key.value = query + type;
}

function create() {
	router.push('/events/new');
}

const headerActions = computed(() => [{
	icon: 'ti ti-plus',
	text: i18n.ts.create,
	handler: create,
}]);

const headerTabs = computed(() => [{
	key: 'search',
	title: i18n.ts.search,
	icon: 'ti ti-search',
}, {
	key: 'featured',
	title: i18n.ts._event.featured,
	icon: 'ti ti-comet',
}, {
	key: 'favorites',
	title: i18n.ts.favorites,
	icon: 'ti ti-star',
}, {
	key: 'following',
	title: i18n.ts._event.following,
	icon: 'ti ti-eye',
}, {
	key: 'owned',
	title: i18n.ts._event.owned,
	icon: 'ti ti-edit',
}]);

definePage(() => ({
	title: i18n.ts.event,
	icon: 'ti ti-calendar-event',
}));
</script>

<style lang="scss" module>
.searchRoot {
	width: 100%;
	max-width: 700px;
	margin: 0 auto;
}

.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
	gap: var(--MI-margin);
}
</style>
