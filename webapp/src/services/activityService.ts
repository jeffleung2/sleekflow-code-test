import type { Activity } from '../types/todo';
import { getAuthHeaders } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface ActivityFeedResponse {
	total: number;
	items: Activity[];
}

/**
 * Get activity feed for the current user
 */
export async function getMyActivityFeed(
	skip: number = 0,
	limit: number = 50
): Promise<ActivityFeedResponse> {
	const response = await fetch(
		`${API_URL}/activity/?skip=${skip}&limit=${limit}`,
		{
			headers: getAuthHeaders(),
		}
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to fetch activity feed');
	}

	return response.json();
}

/**
 * Get activity feed for a specific list
 */
export async function getListActivityFeed(
	listId: number,
	skip: number = 0,
	limit: number = 50
): Promise<ActivityFeedResponse> {
	const response = await fetch(
		`${API_URL}/activity/list/${listId}?skip=${skip}&limit=${limit}`,
		{
			headers: getAuthHeaders(),
		}
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to fetch list activity feed');
	}

	return response.json();
}

/**
 * Get all activity feed (global)
 */
export async function getAllActivityFeed(
	skip: number = 0,
	limit: number = 50
): Promise<ActivityFeedResponse> {
	const response = await fetch(
		`${API_URL}/activity/all?skip=${skip}&limit=${limit}`,
		{
			headers: getAuthHeaders(),
		}
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.detail || 'Failed to fetch all activity feed');
	}

	return response.json();
}
