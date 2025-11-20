from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=List[schemas.TagResponse])
def get_my_tags(
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	tags = crud.get_user_tags(db, user_id=current_user.id)
	return tags


@router.post("/", response_model=schemas.TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
	tag_data: schemas.TagCreate,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	new_tag = crud.create_tag(db, tag_data=tag_data, user_id=current_user.id)
	return new_tag


@router.put("/{tag_id}", response_model=schemas.TagResponse)
def update_tag(
	tag_id: int,
	tag_data: schemas.TagUpdate,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	updated_tag = crud.update_tag(db, tag_id=tag_id, tag_data=tag_data, user_id=current_user.id)
	return updated_tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
	tag_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	crud.delete_tag(db, tag_id=tag_id, user_id=current_user.id)
	return None
