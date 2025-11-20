import React, { useMemo } from 'react';
import { Search, Filter, ArrowUpDown, X, Lock } from 'lucide-react';
import type { TodoStatus, SortField, TodoPriority } from '../types/todo';
import { useTodoStore } from '../store/todoStore';
import { TodoItem } from './TodoItem';

export const TodoList: React.FC = () => {
	const { todos = [], sort, setSort, canEdit } = useTodoStore();
	const [searchTerm, setSearchTerm] = React.useState('');
	const [statusFilter, setStatusFilter] = React.useState<TodoStatus | 'all'>('all');
	const [priorityFilter, setPriorityFilter] = React.useState<TodoPriority | 'all'>('all');

	const isReadOnly = !canEdit();

	// Apply filters and sorting
	const filteredAndSortedTodos = useMemo(() => {
		let result = [...todos];

		// Filter by search term
		if (searchTerm) {
			result = result.filter(
				(todo) =>
					todo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase()))
			);
		}

		// Filter by status
		if (statusFilter !== 'all') {
			result = result.filter((todo) => todo.status === statusFilter);
		}

		// Filter by priority
		if (priorityFilter !== 'all') {
			result = result.filter((todo) => todo.priority === priorityFilter);
		}

		// Sort
		result.sort((a, b) => {
			let aValue: any = a[sort.field as keyof typeof a];
			let bValue: any = b[sort.field as keyof typeof b];

			// Handle date strings
			if (sort.field === 'due_date' || sort.field === 'created_at') {
				aValue = aValue ? new Date(aValue).getTime() : 0;
				bValue = bValue ? new Date(bValue).getTime() : 0;
			}

			if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
			if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
			return 0;
		});

		return result;
	}, [todos, searchTerm, statusFilter, priorityFilter, sort]);

	const handleSortChange = (field: SortField) => {
		if (sort.field === field) {
			setSort({ field, order: sort.order === 'asc' ? 'desc' : 'asc' });
		} else {
			setSort({ field, order: 'asc' });
		}
	};

	const clearFilters = () => {
		setSearchTerm('');
		setStatusFilter('all');
		setPriorityFilter('all');
	};

	const hasActiveFilters = searchTerm || statusFilter !== 'all' || priorityFilter !== 'all';

	return (
		<div className="space-y-4">
			{/* Read-only indicator */}
			{isReadOnly && (
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-yellow-800">
					<Lock size={18} />
					<span className="text-sm font-medium">
						View-only access - You cannot edit this list
					</span>
				</div>
			)}

			{/* Filters and Search */}
			<div className="card">
				<div className="flex flex-col gap-3 sm:gap-4">
					{/* Search - Full width on its own row */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
						<input
							type="text"
							placeholder="Search todos..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="input-field pl-10 w-full"
						/>
					</div>

					{/* Filters Row */}
					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
						{/* Status Filter */}
						<div className="flex items-center gap-2 flex-1">
							<Filter size={18} className="text-gray-500 flex-shrink-0 hidden sm:block" />
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value as TodoStatus | 'all')}
								className="input-field w-full sm:min-w-[140px]"
							>
								<option value="all">All Status</option>
								<option value="Not Started">Not Started</option>
								<option value="In Progress">In Progress</option>
								<option value="Completed">Completed</option>
							</select>
						</div>

						{/* Priority Filter */}
						<div className="flex items-center gap-2 flex-1">
							<select
								value={priorityFilter}
								onChange={(e) => setPriorityFilter(e.target.value as TodoPriority | 'all')}
								className="input-field w-full sm:min-w-[140px]"
							>
								<option value="all">All Priority</option>
								<option value="Highest">Highest</option>
								<option value="High">High</option>
								<option value="Medium">Medium</option>
								<option value="Low">Low</option>
								<option value="Lowest">Lowest</option>
							</select>
						</div>

						{/* Sort */}
						<div className="flex items-center gap-2 flex-1">
							<ArrowUpDown size={18} className="text-gray-500 flex-shrink-0 hidden sm:block" />
							<select
								value={sort.field}
								onChange={(e) => handleSortChange(e.target.value as SortField)}
								className="input-field w-full sm:min-w-[140px]"
							>
								<option value="created_at">Created Date</option>
								<option value="due_date">Due Date</option>
								<option value="name">Name</option>
								<option value="status">Status</option>
								<option value="priority">Priority</option>
							</select>
							<button
								onClick={() => setSort({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' })}
								className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
								title={sort.order === 'asc' ? 'Ascending' : 'Descending'}
							>
								{sort.order === 'asc' ? '↑' : '↓'}
							</button>
						</div>

						{/* Clear Filters */}
						{hasActiveFilters && (
							<button
								onClick={clearFilters}
								className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
							>
								<X size={18} />
								<span className="hidden sm:inline">Clear</span>
							</button>
						)}
					</div>
				</div>
			</div>			{/* Todo Count */}
			<div className="flex items-center justify-between text-sm text-gray-600">
				<span>
					Showing {filteredAndSortedTodos.length} of {todos.length} todos
				</span>
				{hasActiveFilters && (
					<span className="text-primary-600 font-medium">Filters active</span>
				)}
			</div>

			{/* Todo Items */}
			<div>
				{filteredAndSortedTodos.length === 0 ? (
					<div className="card text-center py-12">
						<p className="text-gray-500 text-lg">
							{todos.length === 0
								? 'No todos yet. Create your first todo to get started!'
								: 'No todos match your filters.'}
						</p>
					</div>
				) : (
					filteredAndSortedTodos.map((todo) => (
						<TodoItem key={todo.id} todo={todo} />
					))
				)}
			</div>
		</div>
	);
};
