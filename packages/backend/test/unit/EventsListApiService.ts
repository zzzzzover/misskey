/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { GlobalModule } from '@/GlobalModule.js';
import { DI } from '@/di-symbols.js';
import { CoreModule } from '@/core/CoreModule.js';
import { IdService } from '@/core/IdService.js';
import EndpointImpl from '@/server/api/endpoints/events/list.js';

// 简化的类型定义，避免导入错误
type User = {
	id: string;
	[key: string]: any;
};

type DriveFile = {
	id: string;
	[key: string]: any;
};

type Event = {
	id: string;
	createdAt: Date;
	endsAt: Date;
	title: string;
	description: string;
	userId: string;
	bannerId: string | null;
	participantsCount: number;
	user: User;
	banner: DriveFile | null;
	participants: any[];
	[key: string]: any;
};

const moduleMocker = new ModuleMocker(global);

describe('EventsListApiService', () => {
	let app: TestingModule;
	let endpoint: EndpointImpl;
	let eventsRepository: any;
	let eventParticipantsRepository: any;
	let driveFilesRepository: any;
	let idService: IdService;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
			providers: [
				EndpointImpl,
			],
		}).useMocker((token) => {
			if (token === DI.eventsRepository) {
				return {
					findActive: jest.fn(),
					findEnded: jest.fn(),
				};
			}
			if (token === DI.eventParticipantsRepository) {
				return {
					isParticipating: jest.fn(),
				};
			}
			if (token === DI.driveFilesRepository) {
				return {
					getPublicUrl: jest.fn(),
				};
			}
			if (typeof token === 'function') {
				const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
				const Mock = moduleMocker.generateFromMetadata(mockMetadata);
				return new Mock();
			}
			return {};
		}).compile();

		endpoint = app.get<EndpointImpl>(EndpointImpl);
		eventsRepository = app.get(DI.eventsRepository);
		eventParticipantsRepository = app.get(DI.eventParticipantsRepository);
		driveFilesRepository = app.get(DI.driveFilesRepository);
		idService = app.get<IdService>(IdService);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('events/list API', () => {
		// 创建模拟测试数据
		const createMockEvent = (id: string): Event => {
			const now = new Date();
			const futureDate = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 一天后
			const pastDate = new Date(now.getTime() - 1000 * 60 * 60 * 24); // 一天前

			const event: Event = {
				id,
				createdAt: now,
				endsAt: id.includes('active') ? futureDate : pastDate,
				title: `Test Event ${id}`,
				description: `This is test event ${id}`,
				userId: `user-${id}`,
				bannerId: `banner-${id}`,
				participantsCount: 5,
				user: { id: `user-${id}` },
				banner: { id: `banner-${id}` },
				participants: [],
			};

			return event;
		};

		// 生成活动列表测试数据
		const generateMockEvents = (prefix: string, count: number): Event[] => {
			return Array.from({ length: count }, (_, i) => createMockEvent(`${prefix}-${i + 1}`));
		};

		test('应该返回活动的活动列表', async () => {
			// 设置模拟数据
			const mockActiveEvents = generateMockEvents('active', 3);
			eventsRepository.findActive.mockResolvedValue(mockActiveEvents);
			eventParticipantsRepository.isParticipating.mockResolvedValue(false);
			driveFilesRepository.getPublicUrl.mockReturnValue('https://example.com/banner.jpg');

			// 执行API调用
			const result = await endpoint.exec({ type: 'active', limit: 10 }, { id: 'test-user-id' } as any, null);

			// 验证结果
			expect(result.length).toBe(3);
			expect(eventsRepository.findActive).toHaveBeenCalledWith({
				limit: 10,
				sinceId: undefined,
				untilId: undefined,
			});
			expect(eventParticipantsRepository.isParticipating).toHaveBeenCalledTimes(3);
			expect(driveFilesRepository.getPublicUrl).toHaveBeenCalledTimes(3);

			// 检查返回的数据格式是否正确
			result.forEach((item: any, index: number) => {
				expect(item.id).toBe(mockActiveEvents[index].id);
				expect(item.title).toBe(mockActiveEvents[index].title);
				expect(item.description).toBe(mockActiveEvents[index].description);
				expect(item.bannerUrl).toBe('https://example.com/banner.jpg');
				expect(item.isParticipating).toBe(false);
			});
		});

		test('应该返回已结束的活动列表', async () => {
			// 设置模拟数据
			const mockEndedEvents = generateMockEvents('ended', 2);
			eventsRepository.findEnded.mockResolvedValue(mockEndedEvents);
			eventParticipantsRepository.isParticipating.mockResolvedValue(false);
			driveFilesRepository.getPublicUrl.mockReturnValue('https://example.com/banner.jpg');

			// 执行API调用
			const result = await endpoint.exec({ type: 'ended', limit: 5 }, { id: 'test-user-id' } as any, null);

			// 验证结果
			expect(result.length).toBe(2);
			expect(eventsRepository.findEnded).toHaveBeenCalledWith({
				limit: 5,
				sinceId: undefined,
				untilId: undefined,
			});
			expect(eventParticipantsRepository.isParticipating).toHaveBeenCalledTimes(2);
			expect(driveFilesRepository.getPublicUrl).toHaveBeenCalledTimes(2);
		});

		test('当用户参与活动时，isParticipating 应为 true', async () => {
			// 设置模拟数据
			const mockEvents = generateMockEvents('active', 1);
			eventsRepository.findActive.mockResolvedValue(mockEvents);
			eventParticipantsRepository.isParticipating.mockResolvedValue(true);
			driveFilesRepository.getPublicUrl.mockReturnValue('https://example.com/banner.jpg');

			// 执行API调用
			const result = await endpoint.exec({ type: 'active', limit: 10 }, { id: 'test-user-id' } as any, null);

			// 验证结果
			expect(result.length).toBe(1);
			expect(result[0].isParticipating).toBe(true);
			expect(eventParticipantsRepository.isParticipating).toHaveBeenCalledWith('test-user-id', mockEvents[0].id);
		});

		test('当无用户登录时，isParticipating 应为 false', async () => {
			// 设置模拟数据
			const mockEvents = generateMockEvents('active', 1);
			eventsRepository.findActive.mockResolvedValue(mockEvents);

			// 执行API调用（未提供用户信息）
			const result = await endpoint.exec({ type: 'active', limit: 10 }, null, null);

			// 验证结果
			expect(result.length).toBe(1);
			expect(result[0].isParticipating).toBe(false);
			// 确保不会调用 isParticipating 方法
			expect(eventParticipantsRepository.isParticipating).not.toHaveBeenCalled();
		});

		test('应该在非法活动类型时抛出错误', async () => {
			// 尝试使用无效的活动类型
			await expect(endpoint.exec({ type: 'invalid' as any, limit: 10 }, null, null)).rejects.toThrow();
		});

		test('应该处理分页参数', async () => {
			// 设置模拟数据
			eventsRepository.findActive.mockResolvedValue([]);

			// 执行API调用，包含分页参数
			await endpoint.exec(
				{
					type: 'active',
					limit: 20,
					sinceId: 'since-id-123',
					untilId: 'until-id-456',
				},
				null,
				null,
			);

			// 验证是否正确传递了分页参数
			expect(eventsRepository.findActive).toHaveBeenCalledWith({
				limit: 20,
				sinceId: 'since-id-123',
				untilId: 'until-id-456',
			});
		});
	});
});
