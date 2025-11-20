from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from app.database import get_db
from app.models import TodoStatus, TodoPriority
from app.schemas import TodoCreate, TodoUpdate, TodoResponse, TodoListResponse
from app import crud

router = APIRouter(prefix="/todos", tags=["todos"])


@router.post("/", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(
	todo: TodoCreate,
	db: Session = Depends(get_db)
):
	return crud.create_todo(db=db, todo=todo)


@router.get("/", response_model=TodoListResponse)
def list_todos(
	skip: int = Query(0, ge=0, description="Number of records to skip"),
	limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
	status: Optional[TodoStatus] = Query(None, description="Filter by status"),
	priority: Optional[TodoPriority] = Query(None, description="Filter by priority"),
	tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
	due_date: Optional[date] = Query(None, description="Filter by exact due date"),
	due_date_from: Optional[date] = Query(None, description="Filter by due date from"),
	due_date_to: Optional[date] = Query(None, description="Filter by due date to"),
	sort_by: str = Query("due_date", regex="^(name|due_date|status|priority)$", description="Field to sort by"),
	sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order"),
	db: Session = Depends(get_db)
):
	tag_list = [tag.strip() for tag in tags.split(",")] if tags else None
	
	todos, total = crud.get_todos(
		db=db,
		skip=skip,
		limit=limit,
		status=status,
		priority=priority,
		tags=tag_list,
		due_date=due_date,
		due_date_from=due_date_from,
		due_date_to=due_date_to,
		sort_by=sort_by,
		sort_order=sort_order
	)
	
	return TodoListResponse(total=total, items=todos)


@router.get("/{todo_id}", response_model=TodoResponse)
def get_todo(
	todo_id: int,
	db: Session = Depends(get_db)
):
	db_todo = crud.get_todo(db=db, todo_id=todo_id)
	if db_todo is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=f"TODO with id {todo_id} not found"
		)
	return db_todo


@router.put("/{todo_id}", response_model=TodoResponse)
def update_todo(
	todo_id: int,
	todo: TodoUpdate,
	db: Session = Depends(get_db)
):
	db_todo = crud.update_todo(db=db, todo_id=todo_id, todo_update=todo)
	if db_todo is None:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=f"TODO with id {todo_id} not found"
		)
	return db_todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
	todo_id: int,
	db: Session = Depends(get_db)
):
	success = crud.delete_todo(db=db, todo_id=todo_id)
	if not success:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=f"TODO with id {todo_id} not found"
		)
	return None
