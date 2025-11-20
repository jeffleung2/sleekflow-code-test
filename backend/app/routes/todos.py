from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/lists/{list_id}/todos", tags=["todos"])


@router.get("/", response_model=List[schemas.TodoResponse])
def get_todos(
	list_id: int,
	skip: int = 0,
	limit: int = 100,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	todos = crud.get_list_todos(db, list_id=list_id, user_id=current_user.id, skip=skip, limit=limit)
	return todos


@router.get("/{todo_id}", response_model=schemas.TodoResponse)
def get_todo(
	list_id: int,
	todo_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	todo = crud.get_todo_by_id(db, todo_id=todo_id, user_id=current_user.id)
	
	if todo.list_id != list_id:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Todo not found in this list"
		)
	
	return todo


@router.post("/", response_model=schemas.TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(
	list_id: int,
	todo_data: schemas.TodoCreate,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	new_todo = crud.create_todo(db, list_id=list_id, todo_data=todo_data, user_id=current_user.id)
	return new_todo


@router.put("/{todo_id}", response_model=schemas.TodoResponse)
def update_todo(
	list_id: int,
	todo_id: int,
	todo_data: schemas.TodoUpdate,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	todo = crud.get_todo_by_id(db, todo_id=todo_id, user_id=current_user.id)
	
	if todo.list_id != list_id:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Todo not found in this list"
		)
	
	updated_todo = crud.update_todo(db, todo_id=todo_id, todo_data=todo_data, user_id=current_user.id)
	return updated_todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
	list_id: int,
	todo_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	todo = crud.get_todo_by_id(db, todo_id=todo_id, user_id=current_user.id)
	
	if todo.list_id != list_id:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Todo not found in this list"
		)
	
	crud.delete_todo(db, todo_id=todo_id, user_id=current_user.id)
	return None
