import { useState } from 'react';
import { X, Users, Trash2, Share2, Settings } from 'lucide-react';
import type { TodoList, TodoListCreate, ListPermissionCreate } from '../types/todo';

interface TodoListManagerProps {
	list: TodoList | null;
	onClose: () => void;
	onCreate: (data: TodoListCreate) => Promise<void>;
	onUpdate: (listId: number, data: { name?: string; description?: string | null; color?: string }) => Promise<void>;
	onDelete: (listId: number) => Promise<void>;
	onShare: (listId: number, data: ListPermissionCreate) => Promise<void>;
	currentUserId: number;
	mode: 'create' | 'edit';
}

const DEFAULT_COLORS = [
	'#3B82F6', // Blue
	'#10B981', // Green
	'#F59E0B', // Amber
	'#EF4444', // Red
	'#8B5CF6', // Purple
	'#EC4899', // Pink
	'#06B6D4', // Cyan
	'#6B7280', // Gray
];

export function TodoListManager({
	list,
	onClose,
	onCreate,
	onUpdate,
	onDelete,
	onShare,
	currentUserId,
	mode,
}: TodoListManagerProps) {
	const [name, setName] = useState(list?.name || '');
	const [description, setDescription] = useState(list?.description || '');
	const [color, setColor] = useState(list?.color || DEFAULT_COLORS[0]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showShareModal, setShowShareModal] = useState(false);
	const [shareUserIdentifier, setShareUserIdentifier] = useState('');
	const [sharePermission, setSharePermission] = useState<'view' | 'update'>('view');

	const isOwner = list && list.owner_id === currentUserId;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			if (mode === 'create') {
				await onCreate({ name, description: description || null, color });
			} else if (list) {
				await onUpdate(list.id, {
					name,
					description: description || null,
					color
				});
			}
			onClose();
		} catch (err: any) {
			setError(err.message || 'Failed to save list');
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!list || !window.confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
			return;
		}

		setLoading(true);
		try {
			await onDelete(list.id);
			onClose();
		} catch (err: any) {
			setError(err.message || 'Failed to delete list');
			setLoading(false);
		}
	};

	const handleShare = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!list || !shareUserIdentifier) return;

		setLoading(true);
		setError(null);

		try {
			await onShare(list.id, {
				user_identifier: shareUserIdentifier,
				permission_level: sharePermission,
			});
			setShowShareModal(false);
			setShareUserIdentifier('');
			setSharePermission('view');
		} catch (err: any) {
			setError(err.message || 'Failed to share list');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
						<Settings size={24} />
						{mode === 'create' ? 'Create Todo List' : 'Manage List'}
					</h2>
					<button
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
					>
						<X size={20} />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
							{error}
						</div>
					)}

					{/* Name */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							List Name *
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="e.g., Work Tasks"
							required
							disabled={loading || (mode === 'edit' && !isOwner)}
						/>
					</div>

					{/* Description */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Optional description..."
							rows={3}
							disabled={loading || (mode === 'edit' && !isOwner)}
						/>
					</div>

					{/* Color Picker */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Color
						</label>
						<div className="flex gap-2 flex-wrap">
							{DEFAULT_COLORS.map((c) => (
								<button
									key={c}
									type="button"
									onClick={() => setColor(c)}
									className={`w-10 h-10 rounded-lg transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
										}`}
									style={{ backgroundColor: c }}
									disabled={loading || (mode === 'edit' && !isOwner)}
								/>
							))}
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-3 pt-4">
						{mode === 'create' || isOwner ? (
							<>
								<button
									type="submit"
									disabled={loading || !name.trim()}
									className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
								>
									{loading ? 'Saving...' : mode === 'create' ? 'Create List' : 'Save Changes'}
								</button>
								<button
									type="button"
									onClick={onClose}
									disabled={loading}
									className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 font-medium"
								>
									Cancel
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={onClose}
								className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
							>
								Close
							</button>
						)}
					</div>
				</form>

				{/* Additional Actions (Edit Mode Only) */}
				{mode === 'edit' && list && isOwner && (
					<div className="border-t border-gray-200 p-6 space-y-3">
						<button
							onClick={() => setShowShareModal(true)}
							className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium"
						>
							<Share2 size={18} />
							Share List
						</button>

						<button
							onClick={handleDelete}
							disabled={loading}
							className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium disabled:opacity-50"
						>
							<Trash2 size={18} />
							Delete List
						</button>
					</div>
				)}
			</div>

			{/* Share Modal */}
			{showShareModal && list && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
					<div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
						<div className="flex items-center justify-between p-6 border-b border-gray-200">
							<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
								<Users size={20} />
								Share List
							</h3>
							<button
								onClick={() => setShowShareModal(false)}
								className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleShare} className="p-6 space-y-4">
							{error && (
								<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
									{error}
								</div>
							)}

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									User Email / Username *
								</label>
								<input
									type="text"
									value={shareUserIdentifier}
									onChange={(e) => setShareUserIdentifier(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									placeholder="Enter user email or username"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Permission Level
								</label>
								<select
									value={sharePermission}
									onChange={(e) => setSharePermission(e.target.value as 'view' | 'update')}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="view">View Only</option>
									<option value="update">Can Edit</option>
								</select>
								<p className="text-xs text-gray-500 mt-1">
									View only: Can see todos but not modify them
									<br />
									Can edit: Can create, update, and delete todos
								</p>
							</div>

							<div className="flex gap-3 pt-2">
								<button
									type="submit"
									disabled={loading || !shareUserIdentifier}
									className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
								>
									{loading ? 'Sharing...' : 'Share'}
								</button>
								<button
									type="button"
									onClick={() => setShowShareModal(false)}
									disabled={loading}
									className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 font-medium"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
