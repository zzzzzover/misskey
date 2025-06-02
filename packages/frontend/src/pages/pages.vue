<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="tab === 'featured'">
			<MkPagination v-slot="{items}" :pagination="featuredPagesPagination">
				<div class="_gaps">
					<MkPagePreview v-for="page in items" :key="page.id" :page="page"/>
				</div>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'my' && isStaff" class="_gaps">
			<MkButton class="new" @click="create()"><i class="ti ti-plus"></i></MkButton>
			<MkPagination v-slot="{items}" :pagination="myPagesPagination">
				<div class="_gaps">
					<MkPagePreview v-for="page in items" :key="page.id" :page="page"/>
				</div>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'liked'">
			<MkPagination v-slot="{items}" :pagination="likedPagesPagination">
				<div class="_gaps">
					<MkPagePreview v-for="like in items" :key="like.page.id" :page="like.page"/>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkPagePreview from '@/components/MkPagePreview.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';
import { $i } from '@/i.js';

const router = useRouter();

const tab = ref('featured');
const isStaff = computed(() => $i && ($i.isAdmin || $i.isModerator));

const featuredPagesPagination = {
	endpoint: 'pages/featured' as const,
	noPaging: true,
};
const myPagesPagination = {
	endpoint: 'i/pages' as const,
	limit: 5,
};
const likedPagesPagination = {
	endpoint: 'i/page-likes' as const,
	limit: 5,
};

function create() {
	router.push('/pages/new');
}

const headerActions = computed(() => isStaff.value ? [{
	icon: 'ti ti-plus',
	text: i18n.ts.create,
	handler: create,
}] : []);

const headerTabs = computed(() => {
	const tabs = [{
		key: 'featured',
		title: i18n.ts._pages.featured,
		icon: 'ti ti-flare',
	}, {
		key: 'liked',
		title: '我参加的',
		icon: 'ti ti-heart',
	}];

	if (isStaff.value) {
		tabs.push({
			key: 'my',
			title: '我管理的',
			icon: 'ti ti-edit',
		});
	}

	return tabs;
});

definePage(() => ({
	title: '活动',
	icon: 'ti ti-note',
}));
</script>
