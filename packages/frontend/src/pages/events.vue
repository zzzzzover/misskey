<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<script lang="ts" setup>
import { computed, ref, watch, onMounted } from 'vue';
import * as os from '@/os.js';
import { $i } from '@/i.js';
import MkContainer from '@/components/MkContainer.vue';
import MkTab from '@/components/MkTab.vue';
import MkButton from '@/components/MkButton.vue';
import MkPagination from '@/components/MkPagination.vue';
import { i18n } from '@/i18n.js';

// 定义事件类型
interface Event {
	id: string;
	title: string;
	description: string;
	endsAt: string;
	bannerUrl: string;
	participantsCount: number;
	isParticipating: boolean;
}

const tab = ref('active');
const events = ref<Event[]>([]);
const selectedEvent = ref<Event | null>(null);
const loading = ref(true);
const pagination = {
	endpoint: 'notes/local-timeline' as const,
	limit: 10,
};

const isAdmin = computed(() => $i && $i.isAdmin);

const tabs = [{
	key: 'active',
	title: '进行中',
}, {
	key: 'ended',
	title: '已结束',
}];

if (isAdmin.value) {
	tabs.push({
		key: 'admin',
		title: '管理活动',
	});
}

const fetchEvents = async (type: string) => {
	loading.value = true;
	// 在这里实现获取活动列表的逻辑，目前使用模拟数据
	events.value = [
		{
			id: '1',
			title: '2024年社区春季活动',
			description: '欢迎参加我们的春季活动！这是一个分享和交流的好机会。\n\n活动内容包括：\n1. 线上交友\n2. 分享创意\n3. 参与互动游戏',
			endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			bannerUrl: 'https://images.unsplash.com/photo-1554418651-70309daf95f5?q=80&w=1000',
			participantsCount: 56,
			isParticipating: false,
		},
		{
			id: '2',
			title: '技术分享大会',
			description: '邀请各位技术爱好者参与我们的分享大会，共同探讨最新技术趋势！',
			endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
			bannerUrl: 'https://images.unsplash.com/photo-1551641506-ee5bf4cb45f1?q=80&w=1000',
			participantsCount: 42,
			isParticipating: true,
		},
	];
	loading.value = false;
};

watch(tab, (newTab) => {
	fetchEvents(newTab);
	selectedEvent.value = null;
});

const showEventDetail = (event: Event) => {
	selectedEvent.value = event;
};

const createEvent = () => {
	os.form('创建活动', {
		title: {
			type: 'string',
			label: '活动标题',
		},
		description: {
			type: 'string',
			multiline: true,
			label: '活动描述',
		},
		endsAt: {
			type: 'string',
			label: '结束时间',
		},
		bannerUrl: {
			type: 'string',
			label: '横幅图片链接',
		},
	}).then(async result => {
		os.alert({
			type: 'info',
			text: '活动创建功能将在后端实现后可用',
		});
		fetchEvents(tab.value);
	});
};

const editEvent = (event: Event) => {
	os.form('编辑活动', {
		title: {
			type: 'string',
			label: '活动标题',
			default: event.title,
		},
		description: {
			type: 'string',
			multiline: true,
			label: '活动描述',
			default: event.description,
		},
		endsAt: {
			type: 'string',
			label: '结束时间',
			default: new Date(event.endsAt).toLocaleString(),
		},
		bannerUrl: {
			type: 'string',
			label: '横幅图片链接',
			default: event.bannerUrl,
		},
	}).then(async result => {
		os.alert({
			type: 'info',
			text: '活动编辑功能将在后端实现后可用',
		});
		fetchEvents(tab.value);
	});
};

const deleteEvent = (event: Event) => {
	os.confirm({
		type: 'warning',
		text: '确定要删除这个活动吗？',
	}).then(({ canceled }) => {
		if (canceled) return;
		os.alert({
			type: 'info',
			text: '活动删除功能将在后端实现后可用',
		});
		fetchEvents(tab.value);
	});
};

const participateEvent = (event: Event) => {
	os.alert({
		type: 'info',
		text: '参加活动功能将在后端实现后可用',
	});
	// 模拟更新界面
	if (selectedEvent.value && selectedEvent.value.id === event.id) {
		selectedEvent.value = {
			...selectedEvent.value,
			isParticipating: true,
			participantsCount: selectedEvent.value.participantsCount + 1,
		};
	}
};

const leaveEvent = (event: Event) => {
	os.alert({
		type: 'info',
		text: '退出活动功能将在后端实现后可用',
	});
	// 模拟更新界面
	if (selectedEvent.value && selectedEvent.value.id === event.id) {
		selectedEvent.value = {
			...selectedEvent.value,
			isParticipating: false,
			participantsCount: selectedEvent.value.participantsCount - 1,
		};
	}
};

onMounted(() => {
	fetchEvents(tab.value);
});
</script>

<template>
<div class="mk-events-view">
	<MkContainer :style="{ marginBottom: '1.5em' }">
		<template #header>活动</template>
		<MkTab v-model="tab" :tabs="tabs" style="margin-bottom: 1em;"/>

		<div v-if="tab !== 'admin'" class="events-container">
			<div class="events-list">
				<div v-if="!loading">
					<div v-if="events.length === 0" class="empty">
						<p>暂无活动</p>
					</div>
					<div v-else class="event-items">
						<div
							v-for="event in events"
							:key="event.id"
							class="event-item"
							:class="{ active: selectedEvent && selectedEvent.id === event.id }"
							@click="showEventDetail(event)"
						>
							<div class="event-banner" :style="event.bannerUrl ? `background-image: url(${event.bannerUrl})` : ''">
								<div v-if="!event.bannerUrl" class="no-banner">无横幅</div>
							</div>
							<div class="event-content">
								<div class="event-title">{{ event.title }}</div>
								<div class="event-meta">
									<span class="participants">参与人数: {{ event.participantsCount }}</span>
									<span class="ends-at">结束时间: {{ new Date(event.endsAt).toLocaleString() }}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div v-else class="loading">{{ i18n.ts.loading }}</div>
			</div>

			<div v-if="selectedEvent" class="event-detail">
				<div class="event-detail-banner" :style="selectedEvent.bannerUrl ? `background-image: url(${selectedEvent.bannerUrl})` : ''">
					<div v-if="!selectedEvent.bannerUrl" class="no-banner">无横幅</div>
				</div>
				<div class="event-detail-content">
					<h1 class="event-detail-title">{{ selectedEvent.title }}</h1>
					<div class="event-detail-meta">
						<span class="participants">参与人数: {{ selectedEvent.participantsCount }}</span>
						<span class="ends-at">结束时间: {{ new Date(selectedEvent.endsAt).toLocaleString() }}</span>
					</div>
					<div class="event-detail-description">{{ selectedEvent.description }}</div>

					<div class="event-detail-actions">
						<MkButton v-if="!selectedEvent.isParticipating" primary @click="participateEvent(selectedEvent)">
							参加活动
						</MkButton>
						<MkButton v-else danger @click="leaveEvent(selectedEvent)">
							退出活动
						</MkButton>

						<div v-if="isAdmin" class="admin-actions">
							<MkButton @click="editEvent(selectedEvent)">
								<i class="ti ti-edit"></i> 编辑
							</MkButton>
							<MkButton danger @click="deleteEvent(selectedEvent)">
								<i class="ti ti-trash"></i> 删除
							</MkButton>
						</div>
					</div>
				</div>
			</div>

			<div v-else class="event-detail empty-detail">
				<p>请选择一个活动</p>
			</div>
		</div>

		<div v-else-if="tab === 'admin'" class="admin-panel">
			<MkButton primary @click="createEvent">
				<i class="ti ti-plus"></i> 创建活动
			</MkButton>

			<div class="admin-event-list">
				<div v-if="events.length === 0" class="empty">
					<p>暂无活动</p>
				</div>
				<div v-for="event in events" :key="event.id" class="admin-event-item">
					<div class="admin-event-info">
						<div class="admin-event-title">{{ event.title }}</div>
						<div class="admin-event-meta">
							<span class="participants">参与人数: {{ event.participantsCount }}</span>
							<span class="ends-at">结束时间: {{ new Date(event.endsAt).toLocaleString() }}</span>
						</div>
					</div>
					<div class="admin-event-actions">
						<MkButton @click="editEvent(event)">
							<i class="ti ti-edit"></i> 编辑
						</MkButton>
						<MkButton danger @click="deleteEvent(event)">
							<i class="ti ti-trash"></i> 删除
						</MkButton>
					</div>
				</div>
			</div>
		</div>
	</MkContainer>
</div>
</template>

<style lang="scss" scoped>
.mk-events-view {
	max-width: 1200px;
	margin: 0 auto;
}

.events-container {
	display: grid;
	grid-template-columns: 300px 1fr;
	gap: 20px;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
}

.events-list {
	.event-items {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.event-item {
		border: solid 1px var(--divider);
		border-radius: 6px;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover {
			border-color: var(--accent);
			box-shadow: 0 0 0 1px var(--accent);
		}

		&.active {
			border-color: var(--accent);
			box-shadow: 0 0 0 1px var(--accent);
			background: var(--X2);
		}

		.event-banner {
			height: 80px;
			background-size: cover;
			background-position: center;
			background-color: var(--panel);
			display: flex;
			align-items: center;
			justify-content: center;

			.no-banner {
				color: var(--fg);
				opacity: 0.7;
			}
		}

		.event-content {
			padding: 10px;

			.event-title {
				font-weight: bold;
				margin-bottom: 4px;
			}

			.event-meta {
				font-size: 0.85em;
				opacity: 0.8;
				display: flex;
				flex-wrap: wrap;
				gap: 8px;
			}
		}
	}

	.empty, .loading {
		text-align: center;
		padding: 20px;
		opacity: 0.7;
	}
}

.event-detail {
	border: solid 1px var(--divider);
	border-radius: 6px;
	overflow: hidden;

	&.empty-detail {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		background: var(--panel);
		opacity: 0.7;
	}

	.event-detail-banner {
		height: 200px;
		background-size: cover;
		background-position: center;
		background-color: var(--panel);
		display: flex;
		align-items: center;
		justify-content: center;

		.no-banner {
			color: var(--fg);
			opacity: 0.7;
		}
	}

	.event-detail-content {
		padding: 20px;

		.event-detail-title {
			font-size: 1.5em;
			font-weight: bold;
			margin-bottom: 10px;
		}

		.event-detail-meta {
			font-size: 0.9em;
			opacity: 0.8;
			margin-bottom: 20px;
			display: flex;
			flex-wrap: wrap;
			gap: 15px;
		}

		.event-detail-description {
			white-space: pre-wrap;
			margin-bottom: 20px;
			line-height: 1.5;
		}

		.event-detail-actions {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;

			.admin-actions {
				margin-left: auto;
				display: flex;
				gap: 10px;
			}
		}
	}
}

.admin-panel {
	> button {
		margin-bottom: 20px;
	}

	.admin-event-list {
		display: flex;
		flex-direction: column;
		gap: 10px;

		.admin-event-item {
			border: solid 1px var(--divider);
			border-radius: 6px;
			padding: 15px;
			display: flex;
			justify-content: space-between;
			align-items: center;

			@media (max-width: 768px) {
				flex-direction: column;
				align-items: flex-start;
				gap: 10px;
			}

			.admin-event-info {
				.admin-event-title {
					font-weight: bold;
					margin-bottom: 4px;
				}

				.admin-event-meta {
					font-size: 0.85em;
					opacity: 0.8;
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
				}
			}

			.admin-event-actions {
				display: flex;
				gap: 10px;
			}
		}
	}

	.empty {
		text-align: center;
		padding: 20px;
		opacity: 0.7;
	}
}
</style>
