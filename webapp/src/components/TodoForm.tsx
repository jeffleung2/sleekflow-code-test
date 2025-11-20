import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { TodoStatus, TodoPriority } from '../types/todo';
import { useTodoStore } from '../store/todoStore';

interface TodoFormProps {
	onClose: () => void;
}

export const TodoForm: React.FC<TodoFormProps> = ({ onClose }) => {
	const { createTodo, canEdit } = useTodoStore();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		name: '',
		description: '',
		due_date: '',
		status: 'Not Started' as TodoStatus,
		priority: 'Medium' as TodoPriority,
	});

	const isReadOnly = !canEdit();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			setError('Please enter a todo name');
			return;
		}

		if (!formData.due_date) {
			setError('Please select a due date');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			await createTodo({
				name: formData.name,
				description: formData.description || null,
				due_date: formData.due_date,
				status: formData.status,
				priority: formData.priority,
			});
			onClose();
		} catch (err: any) {
			setError(err.message || 'Failed to create todo');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-4 sm:p-6 border-b">
					<h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create New TODO</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X size={20} className="sm:hidden" />
						<X size={24} className="hidden sm:block" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
							{error}
						</div>
					)}

					{isReadOnly && (
						<div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
							You don't have permission to create todos in this list
						</div>
					)}

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Name *
						</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							className="input-field"
							placeholder="Enter todo name"
							required
							disabled={isReadOnly}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Description
						</label>
						<textarea
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							className="input-field min-h-[100px] resize-none"
							placeholder="Enter todo description"
							rows={4}
							disabled={isReadOnly}
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Due Date *
							</label>
							<input
								type="date"
								value={formData.due_date}
								onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
								className="input-field"
								required
								disabled={isReadOnly}
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Priority
							</label>
							<select
								value={formData.priority}
								onChange={(e) => setFormData({ ...formData, priority: e.target.value as TodoPriority })}
								className="input-field"
								disabled={isReadOnly}
							>
								<option value="Highest">Highest</option>
								<option value="High">High</option>
								<option value="Medium">Medium</option>
								<option value="Low">Low</option>
								<option value="Lowest">Lowest</option>
							</select>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Status
						</label>
						<select
							value={formData.status}
							onChange={(e) => setFormData({ ...formData, status: e.target.value as TodoStatus })}
							className="input-field"
							disabled={isReadOnly}
						>
							<option value="Not Started">Not Started</option>
							<option value="In Progress">In Progress</option>
							<option value="Completed">Completed</option>
						</select>
					</div>

					<div className="flex justify-end gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
							disabled={loading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
							disabled={loading || isReadOnly}
						>
							{loading ? 'Creating...' : 'Create TODO'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
