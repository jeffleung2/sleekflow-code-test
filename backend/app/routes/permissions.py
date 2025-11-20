from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/lists/{list_id}/permissions", tags=["permissions"])


@router.get("/", response_model=List[schemas.ListPermissionResponse])
def get_permissions(
	list_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	permissions = crud.get_list_permissions(db, list_id=list_id, user_id=current_user.id)
	return permissions


@router.post("/", response_model=schemas.ListPermissionResponse, status_code=status.HTTP_201_CREATED)
def share_list(
	list_id: int,
	permission_data: schemas.ListPermissionCreate,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	new_permission = crud.create_permission(
		db,
		list_id=list_id,
		permission_data=permission_data,
		owner_id=current_user.id
	)
	return new_permission


@router.put("/{permission_id}", response_model=schemas.ListPermissionResponse)
def update_permission(
	list_id: int,
	permission_id: int,
	permission_data: schemas.ListPermissionUpdate,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	updated_permission = crud.update_permission(
		db,
		permission_id=permission_id,
		permission_data=permission_data,
		user_id=current_user.id
	)
	return updated_permission


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_permission(
	list_id: int,
	permission_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	crud.delete_permission(db, permission_id=permission_id, user_id=current_user.id)
	return None
