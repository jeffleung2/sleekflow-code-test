from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import cast, ARRAY, Text, or_
from fastapi import HTTPException, status

from app import models, schemas
from app.models import TodoList, Todo, ListPermission, Tag, User, PermissionLevel
from app.authorization import (
	check_list_ownership,
	check_list_view_permission,
	check_list_update_permission
)
from app import activity

def get_user_lists(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[TodoList]:
	owned_lists = db.query(TodoList).filter(TodoList.owner_id == user_id)
	
	shared_list_ids = db.query(ListPermission.list_id).filter(
		ListPermission.user_id == user_id
	).subquery()
	
	shared_lists = db.query(TodoList).filter(TodoList.id.in_(shared_list_ids))
	
	all_lists = owned_lists.union(shared_lists).offset(skip).limit(limit).all()
	return all_lists


def get_list_by_id(db: Session, list_id: int, user_id: int) -> TodoList:
	return check_list_view_permission(db, list_id, user_id)


def create_list(db: Session, list_data: schemas.TodoListCreate, owner_id: int) -> TodoList:
	db_list = TodoList(
		name=list_data.name,
		color=list_data.color,
		description=list_data.description,
		owner_id=owner_id
	)
	db.add(db_list)
	db.commit()
	db.refresh(db_list)
	
	activity.log_list_created(db, owner_id, db_list.id, db_list.name)
	
	return db_list


def update_list(db: Session, list_id: int, list_data: schemas.TodoListUpdate, user_id: int) -> TodoList:
	todo_list = check_list_ownership(db, list_id, user_id)
	
	changes = {}
	if list_data.name is not None:
		changes["name"] = {"old": todo_list.name, "new": list_data.name}
		todo_list.name = list_data.name
	if list_data.description is not None:
		changes["description"] = {"old": todo_list.description, "new": list_data.description}
		todo_list.description = list_data.description
	if list_data.color is not None:
		changes["color"] = {"old": todo_list.color, "new": list_data.color}
		todo_list.color = list_data.color
	if list_data.is_archived is not None:
		changes["is_archived"] = {"old": todo_list.is_archived, "new": list_data.is_archived}
		todo_list.is_archived = list_data.is_archived
	
	db.commit()
	db.refresh(todo_list)
	
	if changes:
		activity.log_list_updated(db, user_id, list_id, todo_list.name, changes)
	
	return todo_list

def delete_list(db: Session, list_id: int, user_id: int) -> bool:
	"""Delete a todo list (owner only)"""
	todo_list = check_list_ownership(db, list_id, user_id)
	list_name = todo_list.name
	
	# Log activity before deletion
	activity.log_list_deleted(db, user_id, list_id, list_name)
	
	db.query(Todo).filter(Todo.list_id == list_id).delete()
	
	db.query(ListPermission).filter(ListPermission.list_id == list_id).delete()
	
	db.delete(todo_list)
	db.commit()
	return True

def get_list_permissions(db: Session, list_id: int, user_id: int) -> List[ListPermission]:
	check_list_ownership(db, list_id, user_id)
	return db.query(ListPermission).filter(ListPermission.list_id == list_id).all()

def create_permission(
	db: Session,
	list_id: int,
	permission_data: schemas.ListPermissionCreate,
	owner_id: int
) -> ListPermission:
	check_list_ownership(db, list_id, owner_id)
	
	# Check if target user exists by username or email
	target_user = db.query(User).filter(
		(User.username == permission_data.user_identifier) | 
		(User.email == permission_data.user_identifier)
	).first()
	if not target_user:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=f"User not found with username or email: {permission_data.user_identifier}"
		)
	
	# Check if permission already exists for this user (regardless of permission level)
	existing = db.query(ListPermission).filter(
		ListPermission.list_id == list_id,
		ListPermission.user_id == target_user.id
	).first()

	if existing:
		# Update the permission level if it's different
		old_permission = existing.permission_level.value
		existing.permission_level = permission_data.permission_level
		db.commit()
		db.refresh(existing)
		
		# Log activity if permission level changed
		if old_permission != permission_data.permission_level.value:
			todo_list = db.query(TodoList).filter(TodoList.id == list_id).first()
			activity.log_permission_changed(
				db, owner_id, list_id, todo_list.name,
				target_user.id, old_permission, permission_data.permission_level.value
			)
		
		return existing
	
	db_permission = ListPermission(
		list_id=list_id,
		user_id=target_user.id,
		permission_level=permission_data.permission_level,
		shared_by=owner_id
	)
	db.add(db_permission)
	db.commit()
	db.refresh(db_permission)
	
	todo_list = db.query(TodoList).filter(TodoList.id == list_id).first()
	activity.log_list_shared(
		db, owner_id, list_id, todo_list.name,
		target_user.id, permission_data.permission_level.value
	)
	
	return db_permission


def update_permission(
	db: Session,
	permission_id: int,
	permission_data: schemas.ListPermissionUpdate,
	user_id: int
) -> ListPermission:
	permission = db.query(ListPermission).filter(ListPermission.id == permission_id).first()
	
	if not permission:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Permission not found"
		)
	
	check_list_ownership(db, permission.list_id, user_id)
	
	old_permission = permission.permission_level.value
	
	if permission_data.permission_level is not None:
		permission.permission_level = permission_data.permission_level
	
	db.commit()
	db.refresh(permission)
	
	if permission_data.permission_level is not None:
		todo_list = db.query(TodoList).filter(TodoList.id == permission.list_id).first()
		activity.log_permission_changed(
			db, user_id, permission.list_id, todo_list.name,
			permission.user_id, old_permission, permission.permission_level.value
		)
	
	return permission


def delete_permission(db: Session, permission_id: int, user_id: int) -> bool:
	permission = db.query(ListPermission).filter(ListPermission.id == permission_id).first()
	
	if not permission:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Permission not found"
		)
	
	check_list_ownership(db, permission.list_id, user_id)
	
	db.delete(permission)
	db.commit()
	return True


# ==================== TODOS ====================

def get_list_todos(
	db: Session,
	list_id: int,
	user_id: int,
	skip: int = 0,
	limit: int = 100
) -> List[Todo]:
	check_list_view_permission(db, list_id, user_id)
	return db.query(Todo).filter(Todo.list_id == list_id).offset(skip).limit(limit).all()


def get_todo_by_id(db: Session, todo_id: int, user_id: int) -> Todo:
	todo = db.query(Todo).filter(Todo.id == todo_id).first()
	
	if not todo:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Todo not found"
		)
	
	check_list_view_permission(db, todo.list_id, user_id)
	return todo


def create_todo(
	db: Session,
	list_id: int,
	todo_data: schemas.TodoCreate,
	user_id: int
) -> Todo:
	check_list_update_permission(db, list_id, user_id)
	
	db_todo = Todo(
		name=todo_data.name,
		description=todo_data.description,
		due_date=todo_data.due_date,
		status=todo_data.status,
		priority=todo_data.priority,
		list_id=list_id,
		created_by=user_id
	)
	db.add(db_todo)
	db.commit()
	db.refresh(db_todo)
	
	if todo_data.tag_ids:
		for tag_id in todo_data.tag_ids:
			tag = db.query(Tag).filter(Tag.id == tag_id).first()
			if tag:
				db_todo.tags.append(tag)
		db.commit()
		db.refresh(db_todo)
	
	activity.log_todo_created(db, user_id, db_todo.id, list_id, db_todo.name)
	
	return db_todo


def update_todo(
	db: Session,
	todo_id: int,
	todo_data: schemas.TodoUpdate,
	user_id: int
) -> Todo:
	todo = db.query(Todo).filter(Todo.id == todo_id).first()
	
	if not todo:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Todo not found"
		)
	
	check_list_update_permission(db, todo.list_id, user_id)
	
	changes = {}
	old_status = str(todo.status.value) if todo.status else None
	status_changed = False
	
	if todo_data.name is not None:
		changes["name"] = {"old": todo.name, "new": todo_data.name}
		todo.name = todo_data.name
	if todo_data.description is not None:
		changes["description"] = {"old": todo.description, "new": todo_data.description}
		todo.description = todo_data.description
	if todo_data.status is not None:
		new_status = str(todo_data.status.value)
		if old_status != new_status:
			status_changed = True
		changes["status"] = {"old": old_status, "new": new_status}
		todo.status = todo_data.status
	if todo_data.priority is not None:
		changes["priority"] = {"old": str(todo.priority.value), "new": str(todo_data.priority.value)}
		todo.priority = todo_data.priority

	if todo_data.tag_ids is not None:
		todo.tags.clear()
		for tag_id in todo_data.tag_ids:
			tag = db.query(Tag).filter(Tag.id == tag_id).first()
			if tag:
				todo.tags.append(tag)
	
	db.commit()
	db.refresh(todo)
	
	if status_changed and todo_data.status is not None:
		activity.log_todo_status_changed(
			db, user_id, todo.id, todo.list_id, todo.name,
			old_status, str(todo_data.status.value)
		)
	elif changes:
		activity.log_todo_updated(db, user_id, todo.id, todo.list_id, todo.name, changes)
	
	return todo


def delete_todo(db: Session, todo_id: int, user_id: int) -> bool:
	todo = db.query(Todo).filter(Todo.id == todo_id).first()
	
	if not todo:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Todo not found"
		)
	
	check_list_update_permission(db, todo.list_id, user_id)
	
	activity.log_todo_deleted(db, user_id, todo.id, todo.list_id, todo.name)
	
	db.delete(todo)
	db.commit()
	return True


# ==================== TAGS ====================

def get_user_tags(db: Session, user_id: int) -> List[Tag]:
	return db.query(Tag).filter(Tag.created_by == user_id).all()


def create_tag(db: Session, tag_data: schemas.TagCreate, user_id: int) -> Tag:
	existing = db.query(Tag).filter(
		Tag.name == tag_data.name,
		Tag.created_by == user_id
	).first()
	
	if existing:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Tag with this name already exists"
		)
	
	db_tag = Tag(
		name=tag_data.name,
		color=tag_data.color,
		created_by=user_id
	)
	db.add(db_tag)
	db.commit()
	db.refresh(db_tag)
	return db_tag


def update_tag(db: Session, tag_id: int, tag_data: schemas.TagUpdate, user_id: int) -> Tag:
	tag = db.query(Tag).filter(Tag.id == tag_id).first()
	
	if not tag:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Tag not found"
		)
	
	if tag.created_by != user_id:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="You do not have permission to modify this tag"
		)
	
	if tag_data.name is not None:
		tag.name = tag_data.name
	if tag_data.color is not None:
		tag.color = tag_data.color
	
	db.commit()
	db.refresh(tag)
	return tag


def delete_tag(db: Session, tag_id: int, user_id: int) -> bool:
	tag = db.query(Tag).filter(Tag.id == tag_id).first()
	
	if not tag:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Tag not found"
		)
	
	if tag.created_by != user_id:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="You do not have permission to delete this tag"
		)
	
	db.delete(tag)
	db.commit()
	return True
