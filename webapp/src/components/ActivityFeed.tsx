import React, { useEffect } from 'react';
import { Activity as ActivityIcon, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTodoStore } from '../store/todoStore';
import type { Activity } from '../types/todo';

export const ActivityFeed: React.FC = () => {
	const { activities, selectedListId, fetchActivities } = useTodoStore();

	useEffect(() => {
		if (selectedListId) {
			fetchActivities(selectedListId);
		}
	}, [selectedListId, fetchActivities]);

	const getActionColor = (actionType: Activity['action_type']) => {
		switch (actionType) {
			case 'created':
				return 'text-green-600 bg-green-50';
			case 'updated':
				return 'text-blue-600 bg-blue-50';
			case 'deleted':
				return 'text-red-600 bg-red-50';
			case 'status_changed':
				return 'text-purple-600 bg-purple-50';
			case 'shared':
				return 'text-yellow-600 bg-yellow-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	};

	const getActionLabel = (actionType: Activity['action_type']) => {
		switch (actionType) {
			case 'created':
				return 'Created';
			case 'updated':
				return 'Updated';
			case 'deleted':
				return 'Deleted';
			case 'status_changed':
				return 'Status Changed';
			case 'shared':
				return 'Shared';
			default:
				return actionType;
		}
	};

	const formatActivityDetails = (activity: Activity): string => {
		if (activity.details && typeof activity.details === 'object') {
			const details = activity.details as Record<string, any>;

			if (activity.entity_type === 'todo' && details.todo_name) {
				return `${activity.user?.username || 'Someone'} ${getActionLabel(activity.action_type).toLowerCase()} todo "${details.todo_name}"`;
			}

			if (activity.entity_type === 'todo_list' && details.list_name) {
				return `${activity.user?.username || 'Someone'} ${getActionLabel(activity.action_type).toLowerCase()} list "${details.list_name}"`;
			}

			if (activity.entity_type === 'permission' && details.shared_with) {
				return `${activity.user?.username || 'Someone'} shared list with ${details.shared_with}`;
			}
		}

		return `${activity.user?.username || 'Someone'} ${getActionLabel(activity.action_type).toLowerCase()} a ${activity.entity_type}`;
	};

	return (
		<div className="card">
			<div className="flex items-center gap-2 mb-3 sm:mb-4">
				<ActivityIcon size={20} className="text-primary-600 sm:hidden" />
				<ActivityIcon size={24} className="text-primary-600 hidden sm:block" />
				<h2 className="text-lg sm:text-xl font-bold text-gray-900">Activity Feed</h2>
			</div>

			<div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
				{activities.length === 0 ? (
					<div className="text-center py-6 sm:py-8 text-gray-500">
						<Clock size={40} className="mx-auto mb-2 opacity-30 sm:w-12 sm:h-12" />
						<p className="text-sm">No activities yet</p>
					</div>
				) : (
					activities.map((activity) => (
						<div
							key={activity.id}
							className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors"
						>
							<div className={`p-1.5 sm:p-2 rounded-full ${getActionColor(activity.action_type)} flex-shrink-0`}>
								<ActivityIcon size={14} className="sm:hidden" />
								<ActivityIcon size={16} className="hidden sm:block" />
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1 min-w-0">
										<span className={`font-medium text-xs sm:text-sm ${getActionColor(activity.action_type).split(' ')[0]}`}>
											{getActionLabel(activity.action_type)}
										</span>
										<p className="text-xs sm:text-sm text-gray-700 mt-0.5 sm:mt-1 break-words">
											{formatActivityDetails(activity)}
										</p>
									</div>

									<span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
										{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
									</span>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
};
