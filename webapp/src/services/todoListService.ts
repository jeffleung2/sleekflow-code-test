import type {
	TodoList,
	TodoListCreate,
	TodoListUpdate,
	TodoListWithDetails,
	ListPermission,
	ListPermissionCreate,
	ListPermissionUpdate,
} from '../types/todo';
import { getAuthHeaders } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ============================================================================
// TODO LIST CRUD
// ============================================================================

/**
 * Get all todo lists (owned + shared)
 */
export async function getTodoLists(
	skip: number = 0,
	limit: number = 100
): Promise<TodoList[]> {
	const response = await fetch(
		`${API_URL}/lists/?skip=${skip}&limit=${limit}`,
		{
			headers: getAuthHeaders(),
		}
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to fetch todo lists');
	}

	return response.json();
}

/**
 * Get a single todo list by ID
 */
export async function getTodoList(listId: number): Promise<TodoListWithDetails> {
	const response = await fetch(`${API_URL}/lists/${listId}`, {
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to fetch todo list');
	}

	return response.json();
}

/**
 * Create a new todo list
 */
export async function createTodoList(data: TodoListCreate): Promise<TodoList> {
	const response = await fetch(`${API_URL}/lists/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...getAuthHeaders(),
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to create todo list');
	}

	return response.json();
}

/**
 * Update a todo list
 */
export async function updateTodoList(
	listId: number,
	data: TodoListUpdate
): Promise<TodoList> {
	const response = await fetch(`${API_URL}/lists/${listId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			...getAuthHeaders(),
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to update todo list');
	}

	return response.json();
}

/**
 * Delete a todo list
 */
export async function deleteTodoList(listId: number): Promise<void> {
	const response = await fetch(`${API_URL}/lists/${listId}`, {
		method: 'DELETE',
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to delete todo list');
	}
}

// ============================================================================
// LIST PERMISSIONS
// ============================================================================

/**
 * Share a todo list with another user
 */
export async function shareTodoList(
	listId: number,
	data: ListPermissionCreate
): Promise<ListPermission> {
	const response = await fetch(`${API_URL}/lists/${listId}/permissions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...getAuthHeaders(),
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to share todo list');
	}

	return response.json();
}

/**
 * Update permission level for a shared user
 */
export async function updatePermission(
	listId: number,
	permissionId: number,
	data: ListPermissionUpdate
): Promise<ListPermission> {
	const response = await fetch(
		`${API_URL}/lists/${listId}/permissions/${permissionId}`,
		{
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeaders(),
			},
			body: JSON.stringify(data),
		}
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to update permission');
	}

	return response.json();
}

/**
 * Revoke access to a shared list
 */
export async function revokePermission(
	listId: number,
	permissionId: number
): Promise<void> {
	const response = await fetch(
		`${API_URL}/lists/${listId}/permissions/${permissionId}`,
		{
			method: 'DELETE',
			headers: getAuthHeaders(),
		}
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to revoke permission');
	}
}

/**
 * Get all permissions for a list
 */
export async function getListPermissions(
	listId: number
): Promise<ListPermission[]> {
	const response = await fetch(`${API_URL}/lists/${listId}/permissions`, {
		headers: getAuthHeaders(),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to fetch permissions');
	}

	return response.json();
}
