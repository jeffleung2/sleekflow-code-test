import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models import ActivityLog, ActivityActionType, ActivityEntityType


def log_activity(
	db: Session,
	user_id: int,
	action_type: str,
	entity_type: str,
	entity_id: int,
	list_id: Optional[int] = None,
	todo_id: Optional[int] = None,
	details: Optional[Dict[str, Any]] = None
) -> ActivityLog:
	details_json = json.dumps(details) if details else None
	
	activity = ActivityLog(
		user_id=user_id,
		list_id=list_id,
		todo_id=todo_id,
		action_type=action_type,
		entity_type=entity_type,
		entity_id=entity_id,
		details=details_json
	)
	
	db.add(activity)
	db.commit()
	db.refresh(activity)
	
	return activity


def log_list_created(db: Session, user_id: int, list_id: int, list_name: str) -> ActivityLog:
	return log_activity(
		db=db,
		user_id=user_id,
		action_type=ActivityActionType.CREATED.value,
		entity_type=ActivityEntityType.LIST.value,
		entity_id=list_id,
		list_id=list_id,
		details={"name": list_name}
	)

def log_list_updated(
	db: Session,
	user_id: int,
	list_id: int,
	list_name: str,
	changes: Dict[str, Any]
) -> ActivityLog:
	return log_activity(
		db=db,
		user_id=user_id,
		action_type=ActivityActionType.UPDATED.value,
		entity_type=ActivityEntityType.LIST.value,
		entity_id=list_id,
		list_id=list_id,
		details={"name": list_name, "changes": changes}
	)

def log_list_deleted(db: Session, user_id: int, list_id: int, list_name: str) -> ActivityLog:
	return log_activity(
		db=db,
		user_id=user_id,
		action_type=ActivityActionType.DELETED.value,
		entity_type=ActivityEntityType.LIST.value,
		entity_id=list_id,
		list_id=list_id,
		details={"name": list_name}
	)

def log_todo_created(
	db: Session,
	user_id: int,
	todo_id: int,
	list_id: int,
	todo_name: str
) -> ActivityLog:
	return log_activity(
		db=db,
		user_id=user_id,
		action_type=ActivityActionType.CREATED.value,
		entity_type=ActivityEntityType.TODO.value,
		entity_id=todo_id,
		list_id=list_id,
		todo_id=todo_id,
		details={"name": todo_name}
	)

def log_todo_updated(
	db: Session,
	user_id: int,
	todo_id: int,
	list_id: int,
	todo_name: str,
	changes: Dict[str, Any]
) -> ActivityLog:
	return log_activity(
		db=db,
		user_id=user_id,
		action_type=ActivityActionType.UPDATED.value,
		entity_type=ActivityEntityType.TODO.value,
		entity_id=todo_id,
		list_id=list_id,
		todo_id=todo_id,
		details={"name": todo_name, "changes": changes}
	)

def log_todo_status_changed(
	db: Session,
	user_id: int,
	todo_id: int,
	list_id: int,
	todo_name: str,
	old_status: str,
	new_status: str
) -> ActivityLog:
	return log_activity(
		db=db,
		user_id=user_id,
		action_type=ActivityActionType.STATUS_CHANGED.value,
		entity_type=ActivityEntityType.TODO.value,
		entity_id=todo_id,
		list_id=list_id,
		todo_id=todo_id,
		details={
			"name": todo_name,
			"old_status": old_status,
			"new_status": new_status
		}
	)

def log_todo_deleted(
	db: Session,
	user_id: int,
	todo_id: int,
	list_id: int,
	todo_name: str
) -> ActivityLog:
	return log_activity(
		db=db,
		user_id=user_id,
		action_type=ActivityActionType.DELETED.value,
		entity_type=ActivityEntityType.TODO.value,
		entity_id=todo_id,
		list_id=list_id,
		todo_id=todo_id,
		details={"name": todo_name}
	)

def log_list_shared(
	db: Session,
	user_id: int,
	list_id: int,
	list_name: str,
	shared_with_user_id: int,
	permission_level: str
) -> ActivityLog:
	return log_activity(
		db=db,
		user_id=user_id,
		action_type=ActivityActionType.SHARED.value,
		entity_type=ActivityEntityType.PERMISSION.value,
		entity_id=shared_with_user_id,
		list_id=list_id,
		details={
			"list_name": list_name,
			"shared_with_user_id": shared_with_user_id,
			"permission_level": permission_level
		}
	)


def log_permission_changed(
	db: Session,
	user_id: int,
	list_id: int,
	list_name: str,
	target_user_id: int,
	old_permission: str,
	new_permission: str
) -> ActivityLog:
	return log_activity(
		db=db,
		user_id=user_id,
		action_type=ActivityActionType.PERMISSION_CHANGED.value,
		entity_type=ActivityEntityType.PERMISSION.value,
		entity_id=target_user_id,
		list_id=list_id,
		details={
			"list_name": list_name,
			"target_user_id": target_user_id,
			"old_permission": old_permission,
			"new_permission": new_permission
		}
	)


def get_activity_feed(
	db: Session,
	user_id: Optional[int] = None,
	list_id: Optional[int] = None,
	skip: int = 0,
	limit: int = 50
):
	query = db.query(ActivityLog)
	
	if user_id:
		query = query.filter(ActivityLog.user_id == user_id)
	
	if list_id:
		query = query.filter(ActivityLog.list_id == list_id)
	
	total = query.count()
	
	activities = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
	
	return activities, total
