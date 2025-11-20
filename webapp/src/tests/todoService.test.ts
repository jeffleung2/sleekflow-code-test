import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as todoService from '../services/todoService';
import type { TodoCreate, TodoUpdate } from '../types/todo';

// Mock auth headers
vi.mock('../services/authService', () => ({
	getAuthHeaders: () => ({
		'Content-Type': 'application/json',
		Authorization: 'Bearer test-token',
	}),
}));

describe('TodoService', () => {
	beforeEach(() => {
		global.fetch = vi.fn();
	});

	describe('getTodos', () => {
		it('should fetch todos for a list', async () => {
			const mockTodos = [
				{
					id: 1,
					name: 'Test Todo',
					description: 'Description',
					due_date: '2024-12-31',
					status: 'Not Started',
					priority: 'Medium',
					list_id: 1,
					created_at: '2024-01-01T00:00:00Z',
					tags: [],
				},
			];

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockTodos),
				} as Response)
			);

			const result = await todoService.getTodos(1);

			expect(result).toEqual(mockTodos);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8080/lists/1/todos?skip=0&limit=100',
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				})
			);
		});

		it('should handle pagination parameters', async () => {
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve([]),
				} as Response)
			);

			await todoService.getTodos(1, 10, 20);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8080/lists/1/todos?skip=10&limit=20',
				expect.anything()
			);
		});

		it('should throw error on fetch failure', async () => {
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: false,
					json: () => Promise.resolve({ detail: 'Not found' }),
				} as Response)
			);

			await expect(todoService.getTodos(1)).rejects.toThrow('Not found');
		});
	});

	describe('getTodo', () => {
		it('should fetch a single todo', async () => {
			const mockTodo = {
				id: 1,
				name: 'Test Todo',
				status: 'Not Started',
			};

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockTodo),
				} as Response)
			);

			const result = await todoService.getTodo(1, 1);

			expect(result).toEqual(mockTodo);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8080/lists/1/todos/1',
				expect.anything()
			);
		});
	});

	describe('createTodo', () => {
		it('should create a new todo', async () => {
			const todoData: TodoCreate = {
				name: 'New Todo',
				description: 'Description',
				due_date: '2024-12-31',
				status: 'Not Started',
				priority: 'High',
			};

			const mockCreatedTodo = {
				id: 1,
				...todoData,
				list_id: 1,
				created_at: '2024-01-01T00:00:00Z',
				tags: [],
			};

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockCreatedTodo),
				} as Response)
			);

			const result = await todoService.createTodo(1, todoData);

			expect(result).toEqual(mockCreatedTodo);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8080/lists/1/todos',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(todoData),
				})
			);
		});

		it('should throw error on creation failure', async () => {
			const todoData: TodoCreate = {
				name: 'New Todo',
				due_date: '2024-12-31',
			};

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: false,
					json: () => Promise.resolve({ detail: 'Validation error' }),
				} as Response)
			);

			await expect(todoService.createTodo(1, todoData)).rejects.toThrow(
				'Validation error'
			);
		});
	});

	describe('updateTodo', () => {
		it('should update a todo', async () => {
			const updateData: TodoUpdate = {
				name: 'Updated Todo',
				status: 'In Progress',
			};

			const mockUpdatedTodo = {
				id: 1,
				...updateData,
				list_id: 1,
			};

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockUpdatedTodo),
				} as Response)
			);

			const result = await todoService.updateTodo(1, 1, updateData);

			expect(result).toEqual(mockUpdatedTodo);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8080/lists/1/todos/1',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify(updateData),
				})
			);
		});
	});

	describe('deleteTodo', () => {
		it('should delete a todo', async () => {
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
				} as Response)
			);

			await todoService.deleteTodo(1, 1);

			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8080/lists/1/todos/1',
				expect.objectContaining({
					method: 'DELETE',
				})
			);
		});

		it('should throw error on deletion failure', async () => {
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: false,
					json: () => Promise.resolve({ detail: 'Cannot delete' }),
				} as Response)
			);

			await expect(todoService.deleteTodo(1, 1)).rejects.toThrow(
				'Cannot delete'
			);
		});
	});

	describe('toggleTodoStatus', () => {
		it('should toggle status from Not Started to In Progress', async () => {
			const mockTodo = {
				id: 1,
				status: 'In Progress',
			};

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockTodo),
				} as Response)
			);

			const result = await todoService.toggleTodoStatus(1, 1, 'Not Started');

			expect(result.status).toBe('In Progress');
		});

		it('should toggle status from In Progress to Completed', async () => {
			const mockTodo = {
				id: 1,
				status: 'Completed',
			};

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockTodo),
				} as Response)
			);

			const result = await todoService.toggleTodoStatus(1, 1, 'In Progress');

			expect(result.status).toBe('Completed');
		});

		it('should toggle status from Completed to Not Started', async () => {
			const mockTodo = {
				id: 1,
				status: 'Not Started',
			};

			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockTodo),
				} as Response)
			);

			const result = await todoService.toggleTodoStatus(1, 1, 'Completed');

			expect(result.status).toBe('Not Started');
		});
	});

	describe('Tag operations', () => {
		describe('getTags', () => {
			it('should fetch all tags', async () => {
				const mockTags = [
					{
						id: 1,
						name: 'Important',
						color: '#FF0000',
						created_by: 1,
						created_at: '2024-01-01T00:00:00Z',
					},
				];

				global.fetch = vi.fn(() =>
					Promise.resolve({
						ok: true,
						json: () => Promise.resolve(mockTags),
					} as Response)
				);

				const result = await todoService.getTags();

				expect(result).toEqual(mockTags);
				expect(global.fetch).toHaveBeenCalledWith(
					'http://localhost:8080/tags/?skip=0&limit=100',
					expect.anything()
				);
			});
		});

		describe('createTag', () => {
			it('should create a new tag', async () => {
				const tagData = {
					name: 'Urgent',
					color: '#FF0000',
				};

				const mockCreatedTag = {
					id: 1,
					...tagData,
					created_by: 1,
					created_at: '2024-01-01T00:00:00Z',
				};

				global.fetch = vi.fn(() =>
					Promise.resolve({
						ok: true,
						json: () => Promise.resolve(mockCreatedTag),
					} as Response)
				);

				const result = await todoService.createTag(tagData);

				expect(result).toEqual(mockCreatedTag);
			});
		});

		describe('updateTag', () => {
			it('should update a tag', async () => {
				const updateData = {
					name: 'Updated Tag',
					color: '#00FF00',
				};

				const mockUpdatedTag = {
					id: 1,
					...updateData,
					created_by: 1,
					created_at: '2024-01-01T00:00:00Z',
				};

				global.fetch = vi.fn(() =>
					Promise.resolve({
						ok: true,
						json: () => Promise.resolve(mockUpdatedTag),
					} as Response)
				);

				const result = await todoService.updateTag(1, updateData);

				expect(result).toEqual(mockUpdatedTag);
			});
		});

		describe('deleteTag', () => {
			it('should delete a tag', async () => {
				global.fetch = vi.fn(() =>
					Promise.resolve({
						ok: true,
					} as Response)
				);

				await todoService.deleteTag(1);

				expect(global.fetch).toHaveBeenCalledWith(
					'http://localhost:8080/tags/1',
					expect.objectContaining({
						method: 'DELETE',
					})
				);
			});
		});
	});
});
