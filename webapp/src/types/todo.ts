// ============================================================================
// ENUMS & TYPES
// ============================================================================

export type TodoStatus = 'Not Started' | 'In Progress' | 'Completed';

export type TodoPriority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';

export type PermissionLevel = 'view' | 'update';

export type SortField = 'name' | 'due_date' | 'status' | 'created_at' | 'priority';
export type SortOrder = 'asc' | 'desc';

// ============================================================================
// USER INTERFACES
// ============================================================================

export interface User {
	id: number;
	email: string;
	username: string;
	full_name: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
}

// ============================================================================
// TODO LIST INTERFACES
// ============================================================================

export interface TodoList {
	id: number;
	name: string;
	description: string | null;
	color: string;
	owner_id: number;
	is_archived: boolean;
	created_at: string;
	updated_at: string | null;
	todo_count?: number;
	permission_level?: PermissionLevel | null;
}

export interface TodoListCreate {
	name: string;
	description?: string | null;
	color?: string;
}

export interface TodoListUpdate {
	name?: string;
	description?: string | null;
	color?: string;
	is_archived?: boolean;
}

export interface TodoListWithDetails extends TodoList {
	todos: Todo[];
	shared_with: ListPermission[];
}

// ============================================================================
// PERMISSION INTERFACES
// ============================================================================

export interface ListPermission {
	id: number;
	list_id: number;
	user_id: number;
	permission_level: PermissionLevel;
	shared_by: number;
	shared_at: string;
	user?: User;
}

export interface ListPermissionCreate {
	user_identifier: string;
	permission_level: PermissionLevel;
}

export interface ListPermissionUpdate {
	permission_level: PermissionLevel;
}

// ============================================================================
// TAG INTERFACES
// ============================================================================

export interface Tag {
	id: number;
	name: string;
	color: string;
	created_by: number;
	created_at: string;
}

export interface TagCreate {
	name: string;
	color?: string;
}

export interface TagUpdate {
	name?: string;
	color?: string;
}

// ============================================================================
// TODO INTERFACES
// ============================================================================

export interface Todo {
	id: number;
	list_id: number;
	name: string;
	description: string | null;
	due_date: string; // ISO 8601 date string (YYYY-MM-DD)
	status: TodoStatus;
	priority: TodoPriority;
	created_at: string;
	updated_at: string | null;
	tags: Tag[];
}

export interface TodoCreate {
	name: string;
	description?: string | null;
	due_date: string;
	status?: TodoStatus;
	priority?: TodoPriority;
	tag_ids?: number[];
}

export interface TodoUpdate {
	name?: string;
	description?: string | null;
	status?: TodoStatus;
	priority?: TodoPriority;
	tag_ids?: number[];
}

// ============================================================================
// FILTER & SORT INTERFACES
// ============================================================================

export interface TodoFilter {
	status?: TodoStatus;
	priority?: TodoPriority;
	searchTerm?: string;
}

export interface TodoSort {
	field: SortField;
	order: SortOrder;
}

// ============================================================================
// ACTIVITY INTERFACES
// ============================================================================

export interface Activity {
	id: number;
	user_id: number;
	list_id: number | null;
	todo_id: number | null;
	action_type: 'created' | 'updated' | 'status_changed' | 'deleted' | 'shared';
	entity_type: 'todo_list' | 'todo' | 'permission';
	entity_id: number | null;
	details: Record<string, any> | null;
	created_at: string;
	user?: User;
}

// ============================================================================
// PAGINATED RESPONSES
// ============================================================================

export interface PaginatedResponse<T> {
	total: number;
	items: T[];
}
