import { create } from 'zustand';
import type {
	Todo,
	TodoList,
	TodoCreate,
	TodoUpdate,
	TodoListCreate,
	TodoListUpdate,
	Tag,
	Activity,
	TodoFilter,
	TodoSort,
	ListPermissionCreate,
} from '../types/todo';
import * as todoListService from '../services/todoListService';
import * as todoService from '../services/todoService';
import * as activityService from '../services/activityService';
import { showError, showSuccess } from '../utils/notification';

interface TodoState {
	// State
	lists: TodoList[];
	selectedListId: number | null;
	todos: Todo[];
	tags: Tag[];
	activities: Activity[];
	filter: TodoFilter;
	sort: TodoSort;
	loading: boolean;
	error: string | null;

	// Todo List operations
	fetchLists: () => Promise<void>;
	createList: (data: TodoListCreate) => Promise<void>;
	updateList: (listId: number, data: TodoListUpdate) => Promise<void>;
	deleteList: (listId: number) => Promise<void>;
	selectList: (listId: number) => Promise<void>;
	shareList: (listId: number, data: ListPermissionCreate) => Promise<void>;

	// Todo operations
	fetchTodos: (listId: number) => Promise<void>;
	createTodo: (data: TodoCreate) => Promise<void>;
	updateTodo: (todoId: number, data: TodoUpdate) => Promise<void>;
	deleteTodo: (todoId: number) => Promise<void>;
	toggleTodoStatus: (todoId: number) => Promise<void>;

	// Tag operations
	fetchTags: () => Promise<void>;

	// Activity operations
	fetchActivities: (listId?: number) => Promise<void>;

	// Filter and sort
	setFilter: (filter: TodoFilter) => void;
	setSort: (sort: TodoSort) => void;

	// Utility
	clearError: () => void;
	getSelectedList: () => TodoList | null;
	canEdit: () => boolean;
}

export const useTodoStore = create<TodoState>((set, get) => ({
	// Initial state
	lists: [],
	selectedListId: null,
	todos: [],
	tags: [],
	activities: [],
	filter: {},
	sort: {
		field: 'created_at',
		order: 'desc',
	},
	loading: false,
	error: null,

	// ============================================================================
	// TODO LIST OPERATIONS
	// ============================================================================

	fetchLists: async () => {
		set({ loading: true, error: null });
		try {
			const list = await todoListService.getTodoLists();
			console.log('Fetched lists:', list);
			console.log('Lists items:', list);
			set({ lists: list, loading: false });

			// Auto-select first list if none selected
			if (!get().selectedListId && list.length > 0) {
				console.log('Auto-selecting first list:', list[0].id);
				get().selectList(list[0].id);
			}
		} catch (error: any) {
			console.error('Error fetching lists:', error);
			const errorMessage = error.message || 'Failed to fetch lists';
			set({ error: errorMessage, loading: false });
			showError(errorMessage);
		}
	},

	createList: async (data: TodoListCreate) => {
		set({ loading: true, error: null });
		try {
			const newList = await todoListService.createTodoList(data);
			set((state) => ({
				lists: [...(state.lists || []), newList],
				loading: false,
			}));
			// Auto-select the newly created list
			get().selectList(newList.id);
			// Refresh activity feed
			get().fetchActivities(newList.id);
			showSuccess('List created successfully');
		} catch (error: any) {
			const errorMessage = error.message || 'Failed to create list';
			set({ error: errorMessage, loading: false });
			showError(errorMessage);
			throw error;
		}
	},

	updateList: async (listId: number, data: TodoListUpdate) => {
		set({ loading: true, error: null });
		try {
			const updatedList = await todoListService.updateTodoList(listId, data);
			set((state) => ({
				lists: (state.lists || []).map((list) =>
					list.id === listId ? updatedList : list
				),
				loading: false,
			}));
			// Refresh activity feed
			get().fetchActivities(listId);
			showSuccess('List updated successfully');
		} catch (error: any) {
			const errorMessage = error.message || 'Failed to update list';
			set({ error: errorMessage, loading: false });
			showError(errorMessage);
			throw error;
		}
	},

	deleteList: async (listId: number) => {
		set({ loading: true, error: null });
		try {
			await todoListService.deleteTodoList(listId);
			set((state) => {
				const newLists = (state.lists || []).filter((list) => list.id !== listId);
				const newSelectedId =
					state.selectedListId === listId
						? newLists.length > 0
							? newLists[0].id
							: null
						: state.selectedListId;

				return {
					lists: newLists,
					selectedListId: newSelectedId,
					todos: state.selectedListId === listId ? [] : state.todos,
					loading: false,
				};
			});

			// Fetch todos for the new selected list
			const newSelectedId = get().selectedListId;
			if (newSelectedId) {
				get().fetchTodos(newSelectedId);
				// Refresh activity feed for the new selected list
				get().fetchActivities(newSelectedId);
			}
			showSuccess('List deleted successfully');
		} catch (error: any) {
			const errorMessage = error.message || 'Failed to delete list';
			set({ error: errorMessage, loading: false });
			showError(errorMessage);
			throw error;
		}
	},

	selectList: async (listId: number) => {
		set({ selectedListId: listId });
		await get().fetchTodos(listId);
	},

	shareList: async (listId: number, data: ListPermissionCreate) => {
		set({ loading: true, error: null });
		try {
			await todoListService.shareTodoList(listId, data);
			set({ loading: false });
			// Refresh activity feed
			get().fetchActivities(listId);
			showSuccess('List shared successfully');
		} catch (error: any) {
			const errorMessage = error.message || 'Failed to share list';
			set({ error: errorMessage, loading: false });
			showError(errorMessage);
			throw error;
		}
	},

	// ============================================================================
	// TODO OPERATIONS
	// ============================================================================

	fetchTodos: async (listId: number) => {
		set({ loading: true, error: null });
		try {
			const todoItems = await todoService.getTodos(listId);
			set({ todos: todoItems, loading: false });
		} catch (error: any) {
			const errorMessage = error.message || 'Failed to fetch todos';
			set({ error: errorMessage, loading: false });
			showError(errorMessage);
		}
	},

	createTodo: async (data: TodoCreate) => {
		const { selectedListId } = get();
		if (!selectedListId) {
			const errorMessage = 'No list selected';
			set({ error: errorMessage });
			showError(errorMessage);
			return;
		}

		set({ loading: true, error: null });
		try {
			const newTodo = await todoService.createTodo(selectedListId, data);
			set((state) => ({
				todos: [...(state.todos || []), newTodo],
				loading: false,
			}));

			// Refresh list to update todo count
			get().fetchLists();
			// Refresh activity feed
			get().fetchActivities(selectedListId);
			showSuccess('Todo created successfully');
		} catch (error: any) {
			const errorMessage = error.message || 'Failed to create todo';
			set({ error: errorMessage, loading: false });
			showError(errorMessage);
			throw error;
		}
	},

	updateTodo: async (todoId: number, data: TodoUpdate) => {
		const { selectedListId } = get();
		if (!selectedListId) return;

		set({ loading: true, error: null });
		try {
			const updatedTodo = await todoService.updateTodo(selectedListId, todoId, data);
			set((state) => ({
				todos: (state.todos || []).map((todo) =>
					todo.id === todoId ? updatedTodo : todo
				),
				loading: false,
			}));
			// Refresh activity feed
			get().fetchActivities(selectedListId);
			showSuccess('Todo updated successfully');
		} catch (error: any) {
			const errorMessage = error.message || 'Failed to update todo';
			set({ error: errorMessage, loading: false });
			showError(errorMessage);
			throw error;
		}
	},

	deleteTodo: async (todoId: number) => {
		const { selectedListId } = get();
		if (!selectedListId) return;

		set({ loading: true, error: null });
		try {
			await todoService.deleteTodo(selectedListId, todoId);
			set((state) => ({
				todos: (state.todos || []).filter((todo) => todo.id !== todoId),
				loading: false,
			}));

			// Refresh list to update todo count
			get().fetchLists();
			// Refresh activity feed
			get().fetchActivities(selectedListId);
			showSuccess('Todo deleted successfully');
		} catch (error: any) {
			const errorMessage = error.message || 'Failed to delete todo';
			set({ error: errorMessage, loading: false });
			showError(errorMessage);
			throw error;
		}
	},

	toggleTodoStatus: async (todoId: number) => {
		const { selectedListId, todos } = get();
		if (!selectedListId) return;

		const todo = (todos || []).find((t) => t.id === todoId);
		if (!todo) return;

		set({ loading: true, error: null });
		try {
			const updatedTodo = await todoService.toggleTodoStatus(
				selectedListId,
				todoId,
				todo.status
			);
			set((state) => ({
				todos: (state.todos || []).map((t) => (t.id === todoId ? updatedTodo : t)),
				loading: false,
			}));
			// Refresh activity feed
			get().fetchActivities(selectedListId);
		} catch (error: any) {
			const errorMessage = error.message || 'Failed to toggle todo status';
			set({ error: errorMessage, loading: false });
			showError(errorMessage);
		}
	},

	// ============================================================================
	// TAG OPERATIONS
	// ============================================================================

	fetchTags: async () => {
		try {
			const response = await todoService.getTags();
			set({ tags: response });
		} catch (error: any) {
			console.error('Failed to fetch tags:', error);
			showError('Failed to fetch tags');
		}
	},

	// ============================================================================
	// ACTIVITY OPERATIONS
	// ============================================================================

	fetchActivities: async (listId?: number) => {
		try {
			let response;
			if (listId) {
				response = await activityService.getListActivityFeed(listId);
			} else {
				response = await activityService.getMyActivityFeed();
			}
			set({ activities: response.items });
		} catch (error: any) {
			console.error('Failed to fetch activities:', error);
			// Don't show error notification for activities - it's not critical
		}
	},

	// ============================================================================
	// FILTER AND SORT
	// ============================================================================

	setFilter: (filter) => set({ filter }),

	setSort: (sort) => set({ sort }),

	// ============================================================================
	// UTILITY
	// ============================================================================

	clearError: () => set({ error: null }),

	getSelectedList: () => {
		const { lists, selectedListId } = get();
		if (!lists || !Array.isArray(lists) || !selectedListId) return null;
		return lists.find((list) => list.id === selectedListId) || null;
	},

	canEdit: () => {
		const selectedList = get().getSelectedList();
		if (!selectedList) return false;

		// Owner can always edit
		// Users with 'update' permission can edit
		// Users with 'view' permission cannot edit
		return !selectedList.permission_level || selectedList.permission_level === 'update';
	},
}));
