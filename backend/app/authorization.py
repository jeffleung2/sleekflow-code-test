from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import TodoList, ListPermission, PermissionLevel


def check_list_ownership(db: Session, list_id: int, user_id: int) -> TodoList:
	todo_list = db.query(TodoList).filter(TodoList.id == list_id).first()
	
	if not todo_list:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Todo list not found"
		)
	
	if todo_list.owner_id != user_id:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="You do not have permission to access this list"
		)
	
	return todo_list


def check_list_view_permission(db: Session, list_id: int, user_id: int) -> TodoList:
	todo_list = db.query(TodoList).filter(TodoList.id == list_id).first()
	
	if not todo_list:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Todo list not found"
		)
	
	if todo_list.owner_id == user_id:
		return todo_list
	
	permission = db.query(ListPermission).filter(
		ListPermission.list_id == list_id,
		ListPermission.user_id == user_id
	).first()
	
	if not permission or permission.permission_level not in [PermissionLevel.VIEW, PermissionLevel.UPDATE]:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="You do not have permission to view this list"
		)
	
	return todo_list


def check_list_update_permission(db: Session, list_id: int, user_id: int) -> TodoList:
	todo_list = db.query(TodoList).filter(TodoList.id == list_id).first()
	
	if not todo_list:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Todo list not found"
		)
	
	if todo_list.owner_id == user_id:
		return todo_list
	
	permission = db.query(ListPermission).filter(
		ListPermission.list_id == list_id,
		ListPermission.user_id == user_id,
		ListPermission.permission_level == PermissionLevel.UPDATE
	).first()
	
	if not permission:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="You do not have permission to modify this list"
		)
	
	return todo_list


def get_user_permission_level(db: Session, list_id: int, user_id: int) -> Optional[str]:
	todo_list = db.query(TodoList).filter(TodoList.id == list_id).first()
	
	if not todo_list:
		return None
	
	if todo_list.owner_id == user_id:
		return "owner"
	
	permission = db.query(ListPermission).filter(
		ListPermission.list_id == list_id,
		ListPermission.user_id == user_id
	).first()
	
	if permission:
		return permission.permission_level.value
	
	return None


def can_view_list(db: Session, list_id: int, user_id: int) -> bool:
	permission = get_user_permission_level(db, list_id, user_id)
	return permission in ["owner", "update", "view"]


def can_update_list(db: Session, list_id: int, user_id: int) -> bool:
	permission = get_user_permission_level(db, list_id, user_id)
	return permission in ["owner", "update"]


def can_delete_list(db: Session, list_id: int, user_id: int) -> bool:
	todo_list = db.query(TodoList).filter(TodoList.id == list_id).first()
	return todo_list and todo_list.owner_id == user_id


def can_manage_permissions(db: Session, list_id: int, user_id: int) -> bool:
	return can_delete_list(db, list_id, user_id)
