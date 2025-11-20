import { Plus, List, Users, Lock } from 'lucide-react';
import type { TodoList } from '../types/todo';

interface TodoListSelectorProps {
	lists: TodoList[];
	selectedListId: number | null;
	onSelectList: (listId: number) => void;
	onCreateList: () => void;
	currentUserId: number;
}

export function TodoListSelector({
	lists,
	selectedListId,
	onSelectList,
	onCreateList,
	currentUserId,
}: TodoListSelectorProps) {
	const safeList = lists || [];

	const ownedLists = safeList.filter((list) => list.owner_id === currentUserId);
	const sharedLists = safeList.filter((list) => list.owner_id !== currentUserId);

	return (
		<div className="bg-white border-r border-gray-200 w-full md:w-72 lg:w-80 flex flex-col h-full">
			{/* Header */}
			<div className="p-3 md:p-4 border-b border-gray-200">
				<div className="flex items-center justify-between mb-2 md:mb-3">
					<h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
						<List size={18} className="md:hidden" />
						<List size={20} className="hidden md:block" />
						<span className="hidden sm:inline">Todo Lists</span>
						<span className="sm:hidden">Lists</span>
					</h2>
					<button
						onClick={onCreateList}
						className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
						title="Create new list"
					>
						<Plus size={20} />
					</button>
				</div>
			</div>

			{/* Lists */}
			<div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
				{/* Owned Lists */}
				{ownedLists.length > 0 && (
					<div className="p-2 pb-4">
						<h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
							My Lists
						</h3>
						{ownedLists.map((list) => (
							<button
								key={list.id}
								onClick={() => onSelectList(list.id)}
								className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors mb-1 ${selectedListId === list.id
										? 'bg-blue-50 text-blue-900 border border-blue-200'
										: 'hover:bg-gray-50 text-gray-700'
									}`}
							>
								<div className="flex items-start gap-3">
									<div
										className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
										style={{ backgroundColor: list.color }}
									/>
									<div className="flex-1 min-w-0">
										<div className="font-medium truncate">{list.name}</div>
										{list.description && (
											<div className="text-xs text-gray-500 truncate mt-0.5">
												{list.description}
											</div>
										)}
										<div className="flex items-center gap-2 mt-1">
											<span className="text-xs text-gray-500">
												{list.todo_count || 0} {list.todo_count === 1 ? 'todo' : 'todos'}
											</span>
										</div>
									</div>
								</div>
							</button>
						))}
					</div>
				)}

				{/* Shared Lists */}
				{sharedLists.length > 0 && (
					<div className="p-2 pb-4 border-t border-gray-100">
						<h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
							<Users size={12} />
							Shared with me
						</h3>
						{sharedLists.map((list) => (
							<button
								key={list.id}
								onClick={() => onSelectList(list.id)}
								className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors mb-1 ${selectedListId === list.id
										? 'bg-blue-50 text-blue-900 border border-blue-200'
										: 'hover:bg-gray-50 text-gray-700'
									}`}
							>
								<div className="flex items-start gap-3">
									<div
										className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
										style={{ backgroundColor: list.color }}
									/>
									<div className="flex-1 min-w-0">
										<div className="font-medium truncate">{list.name}</div>
										{list.description && (
											<div className="text-xs text-gray-500 truncate mt-0.5">
												{list.description}
											</div>
										)}
										<div className="flex items-center gap-2 mt-1">
											<span className="text-xs text-gray-500">
												{list.todo_count || 0} {list.todo_count === 1 ? 'todo' : 'todos'}
											</span>
											{list.permission_level === 'view' && (
												<span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
													<Lock size={10} />
													View only
												</span>
											)}
										</div>
									</div>
								</div>
							</button>
						))}
					</div>
				)}

				{/* Empty State */}
				{safeList.length === 0 && (
					<div className="p-8 text-center">
						<List size={48} className="mx-auto text-gray-300 mb-3" />
						<h3 className="text-sm font-medium text-gray-900 mb-1">No lists yet</h3>
						<p className="text-xs text-gray-500 mb-4">
							Create your first todo list to get started
						</p>
						<button
							onClick={onCreateList}
							className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
						>
							<Plus size={16} />
							Create List
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
