import React, { useState } from 'react';
import { Edit2, Trash2, Calendar, CheckCircle, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Todo, TodoStatus } from '../types/todo';
import { useTodoStore } from '../store/todoStore';

interface TodoItemProps {
	todo: Todo;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo }) => {
	const { updateTodo, deleteTodo, toggleTodoStatus, canEdit } = useTodoStore();
	const [isEditing, setIsEditing] = useState(false);
	const [editData, setEditData] = useState({
		name: todo.name,
		description: todo.description || '',
		status: todo.status,
		priority: todo.priority,
	});

	const isReadOnly = !canEdit();

	const handleUpdate = async () => {
		try {
			await updateTodo(todo.id, {
				name: editData.name,
				description: editData.description || null,
				status: editData.status,
				priority: editData.priority,
			});
			setIsEditing(false);
		} catch (error) {
			console.error('Failed to update todo:', error);
		}
	};

	const handleDelete = async () => {
		if (window.confirm(`Are you sure you want to delete "${todo.name}"?`)) {
			try {
				await deleteTodo(todo.id);
			} catch (error) {
				console.error('Failed to delete todo:', error);
			}
		}
	};

	const handleToggleStatus = async () => {
		if (isReadOnly) return;
		try {
			await toggleTodoStatus(todo.id);
		} catch (error) {
			console.error('Failed to toggle status:', error);
		}
	};

	const getStatusColor = (status: TodoStatus) => {
		switch (status) {
			case 'Not Started':
				return 'bg-gray-100 text-gray-800 border-gray-300';
			case 'In Progress':
				return 'bg-blue-100 text-blue-800 border-blue-300';
			case 'Completed':
				return 'bg-green-100 text-green-800 border-green-300';
		}
	};

	const getStatusIcon = (status: TodoStatus) => {
		switch (status) {
			case 'Not Started':
				return <Circle size={16} />;
			case 'In Progress':
				return <Clock size={16} />;
			case 'Completed':
				return <CheckCircle size={16} />;
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'Highest':
				return 'bg-red-100 text-red-800';
			case 'High':
				return 'bg-orange-100 text-orange-800';
			case 'Medium':
				return 'bg-yellow-100 text-yellow-800';
			case 'Low':
				return 'bg-green-100 text-green-800';
			case 'Lowest':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	if (isEditing) {
		return (
			<div className="card mb-4 border-2 border-primary-500">
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
						<input
							type="text"
							value={editData.name}
							onChange={(e) => setEditData({ ...editData, name: e.target.value })}
							className="input-field"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
						<textarea
							value={editData.description}
							onChange={(e) => setEditData({ ...editData, description: e.target.value })}
							className="input-field min-h-[80px] resize-none"
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
							<select
								value={editData.status}
								onChange={(e) => setEditData({ ...editData, status: e.target.value as TodoStatus })}
								className="input-field"
							>
								<option value="Not Started">Not Started</option>
								<option value="In Progress">In Progress</option>
								<option value="Completed">Completed</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
							<select
								value={editData.priority}
								onChange={(e) => setEditData({ ...editData, priority: e.target.value as any })}
								className="input-field"
							>
								<option value="Highest">Highest</option>
								<option value="High">High</option>
								<option value="Medium">Medium</option>
								<option value="Low">Low</option>
								<option value="Lowest">Lowest</option>
							</select>
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<button
							onClick={() => setIsEditing(false)}
							className="btn-secondary text-sm"
						>
							Cancel
						</button>
						<button
							onClick={handleUpdate}
							className="btn-primary text-sm"
						>
							Save Changes
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="card mb-3 sm:mb-4 hover:shadow-lg transition-shadow duration-200">
			<div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
				<div className="flex-1 min-w-0">
					<h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 break-words">{todo.name}</h3>
					<div className="flex items-center gap-2 flex-wrap">
						<button
							onClick={handleToggleStatus}
							disabled={isReadOnly}
							className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(todo.status)} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
								}`}
						>
							{getStatusIcon(todo.status)}
							{todo.status}
						</button>
						<span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(todo.priority)}`}>
							{todo.priority}
						</span>
					</div>
				</div>

				{!isReadOnly && (
					<div className="flex gap-1 sm:gap-2 flex-shrink-0">
						<button
							onClick={() => setIsEditing(true)}
							className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
							title="Edit"
						>
							<Edit2 size={16} className="sm:hidden" />
							<Edit2 size={18} className="hidden sm:block" />
						</button>
						<button
							onClick={handleDelete}
							className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
							title="Delete"
						>
							<Trash2 size={16} className="sm:hidden" />
							<Trash2 size={18} className="hidden sm:block" />
						</button>
					</div>
				)}
			</div>

			{todo.description && (
				<p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3 whitespace-pre-wrap break-words">{todo.description}</p>
			)}

			<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
				{todo.due_date && (
					<div className="flex items-center gap-2">
						<Calendar size={16} />
						<span>Due: {format(new Date(todo.due_date), 'MMM dd, yyyy')}</span>
					</div>
				)}

				{todo.tags && todo.tags.length > 0 && (
					<div className="flex items-center gap-1 flex-wrap">
						{todo.tags.map((tag) => (
							<span
								key={tag.id}
								className="px-2 py-0.5 rounded text-xs"
								style={{ backgroundColor: tag.color + '20', color: tag.color }}
							>
								{tag.name}
							</span>
						))}
					</div>
				)}
			</div>

			<div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 text-xs text-gray-400">
				Created {format(new Date(todo.created_at), 'MMM dd, yyyy HH:mm')}
			</div>
		</div>
	);
};
