import type {
	Todo,
	TodoCreate,
	TodoUpdate,
	Tag,
	TagCreate,
	TagUpdate,
} from '../types/todo';
import { getAuthHeaders } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ============================================================================
// TODO CRUD
// ============================================================================

/**
 * Get all todos for a specific list
 */
export async function getTodos(
	listId: number,
	skip: number = 0,
	limit: number = 100
): Promise<Todo[]> {
	const response = await fetch(
		`${API_URL}/lists/${listId}/todos?skip=${skip}&limit=${limit}`,
		{
			headers: getAuthHeaders(),
		}
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to fetch todos');
	}

	return response.json();
}

/**
 * Get a single todo by ID
 */
export async function getTodo(listId: number, todoId: number): Promise<Todo> {
	const response = await fetch(`${API_URL}/lists/${listId}/todos/${todoId}`, {
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to fetch todo');
	}

	return response.json();
}

/**
 * Create a new todo in a list
 */
export async function createTodo(
	listId: number,
	data: TodoCreate
): Promise<Todo> {
	const response = await fetch(`${API_URL}/lists/${listId}/todos`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...getAuthHeaders(),
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to create todo');
	}

	return response.json();
}

/**
 * Update a todo
 */
export async function updateTodo(
	listId: number,
	todoId: number,
	data: TodoUpdate
): Promise<Todo> {
	const response = await fetch(`${API_URL}/lists/${listId}/todos/${todoId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			...getAuthHeaders(),
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to update todo');
	}

	return response.json();
}

/**
 * Delete a todo
 */
export async function deleteTodo(listId: number, todoId: number): Promise<void> {
	const response = await fetch(`${API_URL}/lists/${listId}/todos/${todoId}`, {
		method: 'DELETE',
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to delete todo');
	}
}

/**
 * Toggle todo status (quick update)
 */
export async function toggleTodoStatus(
	listId: number,
	todoId: number,
	currentStatus: string
): Promise<Todo> {
	let newStatus: string;

	switch (currentStatus) {
		case 'Not Started':
			newStatus = 'In Progress';
			break;
		case 'In Progress':
			newStatus = 'Completed';
			break;
		case 'Completed':
			newStatus = 'Not Started';
			break;
		default:
			newStatus = 'In Progress';
	}

	return updateTodo(listId, todoId, { status: newStatus as any });
}

// ============================================================================
// TAG CRUD
// ============================================================================

/**
 * Get all tags for the current user
 */
export async function getTags(
	skip: number = 0,
	limit: number = 100
): Promise<Tag[]> {
	const response = await fetch(
		`${API_URL}/tags/?skip=${skip}&limit=${limit}`,
		{
			headers: getAuthHeaders(),
		}
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to fetch tags');
	}

	return response.json();
}

/**
 * Create a new tag
 */
export async function createTag(data: TagCreate): Promise<Tag> {
	const response = await fetch(`${API_URL}/tags/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...getAuthHeaders(),
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to create tag');
	}

	return response.json();
}

/**
 * Update a tag
 */
export async function updateTag(tagId: number, data: TagUpdate): Promise<Tag> {
	const response = await fetch(`${API_URL}/tags/${tagId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			...getAuthHeaders(),
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to update tag');
	}

	return response.json();
}

/**
 * Delete a tag
 */
export async function deleteTag(tagId: number): Promise<void> {
	const response = await fetch(`${API_URL}/tags/${tagId}`, {
		method: 'DELETE',
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to delete tag');
	}
}
