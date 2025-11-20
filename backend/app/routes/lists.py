from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/lists", tags=["lists"])

@router.get("/", response_model=List[schemas.TodoListResponse])
def get_my_lists(
	skip: int = 0,
	limit: int = 100,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	lists = crud.get_user_lists(db, user_id=current_user.id, skip=skip, limit=limit)
	
	# Add todo_count to each list
	for todo_list in lists:
		todo_list.todo_count = len(todo_list.todos)
	
	return lists


@router.get("/{list_id}", response_model=schemas.TodoListResponse)
def get_list(
	list_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	todo_list = crud.get_list_by_id(db, list_id=list_id, user_id=current_user.id)
	
	todo_list.todo_count = len(todo_list.todos)
	
	return todo_list


@router.post("/", response_model=schemas.TodoListResponse, status_code=status.HTTP_201_CREATED)
def create_list(
	list_data: schemas.TodoListCreate,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):

	new_list = crud.create_list(db, list_data=list_data, owner_id=current_user.id)
	
	new_list.todo_count = len(new_list.todos)
	
	return new_list


@router.put("/{list_id}", response_model=schemas.TodoListResponse)
def update_list(
	list_id: int,
	list_data: schemas.TodoListUpdate,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	updated_list = crud.update_list(db, list_id=list_id, list_data=list_data, user_id=current_user.id)
	
	updated_list.todo_count = len(updated_list.todos)
	
	return updated_list


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list(
	list_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	crud.delete_list(db, list_id=list_id, user_id=current_user.id)
	return None
