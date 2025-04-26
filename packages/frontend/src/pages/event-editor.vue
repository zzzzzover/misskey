<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<MkSpacer :contentMax="700">
		<div v-if="eventId == null || event != null" class="_gaps_m">
			<MkInput v-model="name">
				<template #label>{{ i18n.ts.name }}</template>
			</MkInput>

			<MkTextarea v-model="description" mfmAutocomplete :mfmPreview="true">
				<template #label>{{ i18n.ts.description }}</template>
			</MkTextarea>

			<MkInput v-model="startDate" type="date">
				<template #label>{{ i18n.ts._event.startDate }}</template>
			</MkInput>

			<MkInput v-model="endDate" type="date">
				<template #label>{{ i18n.ts._event.endDate }}</template>
			</MkInput>

			<MkColorInput v-model="color">
				<template #label>{{ i18n.ts.color }}</template>
			</MkColorInput>

			<MkSwitch v-model="isSensitive">
				<template #label>{{ i18n.ts.sensitive }}</template>
			</MkSwitch>

			<MkSwitch v-model="allowRenoteToExternal">
				<template #label>{{ i18n.ts._event.allowRenoteToExternal }}</template>
			</MkSwitch>

			<div>
				<MkButton v-if="bannerId == null" @click="setBannerImage"><i class="ti ti-plus"></i> {{ i18n.ts._event.setBanner }}</MkButton>
				<div v-else-if="bannerUrl">
					<img :src="bannerUrl" style="width: 100%;"/>
					<MkButton @click="removeBannerImage()"><i class="ti ti-trash"></i> {{ i18n.ts._event.removeBanner }}</MkButton>
				</div>
			</div>

			<MkFolder :defaultOpen="true">
				<template #label>{{ i18n.ts.pinnedNotes }}</template>

				<div class="_gaps">
					<MkButton primary rounded @click="addPinnedNote()"><i class="ti ti-plus"></i></MkButton>

					<Sortable
						v-model="pinnedNotes"
						itemKey="id"
						:handle="'.' + $style.pinnedNoteHandle"
						:animation="150"
					>
						<template #item="{element,index}">
							<div :class="$style.pinnedNote">
								<button class="_button" :class="$style.pinnedNoteHandle"><i class="ti ti-menu"></i></button>
								{{ element.id }}
								<button class="_button" :class="$style.pinnedNoteRemove" @click="removePinnedNote(index)"><i class="ti ti-x"></i></button>
							</div>
						</template>
					</Sortable>
				</div>
			</MkFolder>

			<div class="_buttons">
				<MkButton primary @click="save()"><i class="ti ti-device-floppy"></i> {{ eventId ? i18n.ts.save : i18n.ts.create }}</MkButton>
				<MkButton v-if="eventId" danger @click="archive()"><i class="ti ti-trash"></i> {{ i18n.ts.archive }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref, watch, defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkColorInput from '@/components/MkColorInput.vue';
import { selectFile } from '@/utility/select-file.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import { useRouter } from '@/router.js';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const router = useRouter();

const props = defineProps<{
	eventId?: string;
}>();

const event = ref<Misskey.entities.Event | null>(null);
const name = ref<string | null>(null);
const description = ref<string | null>(null);
const startDate = ref<string | null>(null);
const endDate = ref<string | null>(null);
const bannerUrl = ref<string | null>(null);
const bannerId = ref<string | null>(null);
const color = ref('#000');
const isSensitive = ref(false);
const allowRenoteToExternal = ref(true);
const pinnedNotes = ref<{ id: Misskey.entities.Note['id'] }[]>([]);

watch(() => bannerId.value, async () => {
	if (bannerId.value == null) {
		bannerUrl.value = null;
	} else {
		bannerUrl.value = (await misskeyApi('drive/files/show', {
			fileId: bannerId.value,
		})).url;
	}
});

async function fetchEvent() {
	if (props.eventId == null) return;

	event.value = await misskeyApi('events/show', {
		eventId: props.eventId,
	});

	name.value = event.value.name;
	description.value = event.value.description;
	startDate.value = event.value.startDate;
	endDate.value = event.value.endDate;
	bannerId.value = event.value.bannerId;
	bannerUrl.value = event.value.bannerUrl;
	isSensitive.value = event.value.isSensitive;
	pinnedNotes.value = event.value.pinnedNoteIds.map(id => ({
		id,
	}));
	color.value = event.value.color;
	allowRenoteToExternal.value = event.value.allowRenoteToExternal;
}

fetchEvent();

async function addPinnedNote() {
	const { canceled, result: value } = await os.inputText({
		title: i18n.ts.noteIdOrUrl,
	});
	if (canceled) return;
	const note = await os.apiWithDialog('notes/show', {
		noteId: value.includes('/') ? value.split('/').pop() : value,
	});
	pinnedNotes.value = [{
		id: note.id,
	}, ...pinnedNotes.value];
}

function removePinnedNote(index: number) {
	pinnedNotes.value.splice(index, 1);
}

function save() {
	const params = {
		name: name.value,
		description: description.value,
		startDate: startDate.value,
		endDate: endDate.value,
		bannerId: bannerId.value,
		pinnedNoteIds: pinnedNotes.value.map(x => x.id),
		color: color.value,
		isSensitive: isSensitive.value,
		allowRenoteToExternal: allowRenoteToExternal.value,
	};

	if (props.eventId) {
		params.eventId = props.eventId;
		os.apiWithDialog('events/update', params);
	} else {
		os.apiWithDialog('events/create', params).then(created => {
			router.push(`/events/${created.id}`);
		});
	}
}

async function archive() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.tsx.eventArchiveConfirmTitle({ name: name.value }),
		text: i18n.ts.eventArchiveConfirmDescription,
	});

	if (canceled) return;

	misskeyApi('events/update', {
		eventId: props.eventId,
		isArchived: true,
	}).then(() => {
		os.success();
	});
}

function setBannerImage(evt) {
	selectFile(evt.currentTarget ?? evt.target, null).then(file => {
		bannerId.value = file.id;
	});
}

function removeBannerImage() {
	bannerId.value = null;
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: props.eventId ? i18n.ts._event.edit : i18n.ts._event.create,
	icon: 'ti ti-calendar-event',
}));
</script>

<style lang="scss" module>
.pinnedNote {
	position: relative;
	display: block;
	line-height: 2.85rem;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
	color: var(--MI_THEME-navFg);
}

.pinnedNoteRemove {
	position: absolute;
	z-index: 10000;
	width: 32px;
	height: 32px;
	color: #ff2a2a;
	right: 8px;
	opacity: 0.8;
}

.pinnedNoteHandle {
	cursor: move;
	width: 32px;
	height: 32px;
	margin: 0 8px;
	opacity: 0.5;
}
</style>
