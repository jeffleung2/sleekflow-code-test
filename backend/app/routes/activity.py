from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.activity import get_activity_feed

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("/", response_model=schemas.ActivityFeedResponse)
def get_my_activity_feed(
	skip: int = Query(0, ge=0, description="Number of records to skip"),
	limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	activities, total = get_activity_feed(db, user_id=current_user.id, skip=skip, limit=limit)
	# Parse details from JSON string to dict
	for activity in activities:
		if activity.details and isinstance(activity.details, str):
			import json
			try:
				activity.details = json.loads(activity.details)
			except:
				activity.details = None
	return schemas.ActivityFeedResponse(total=total, items=activities)


@router.get("/list/{list_id}", response_model=schemas.ActivityFeedResponse)
def get_list_activity_feed(
	list_id: int,
	skip: int = Query(0, ge=0, description="Number of records to skip"),
	limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	# Check if user has access to this list (will raise exception if not)
	from app.authorization import check_list_view_permission
	check_list_view_permission(db, list_id, current_user.id)
	
	activities, total = get_activity_feed(db, list_id=list_id, skip=skip, limit=limit)
	# Parse details from JSON string to dict
	for activity in activities:
		if activity.details and isinstance(activity.details, str):
			import json
			try:
				activity.details = json.loads(activity.details)
			except:
				activity.details = None
	return schemas.ActivityFeedResponse(total=total, items=activities)


@router.get("/all", response_model=schemas.ActivityFeedResponse)
def get_all_activity_feed(
	skip: int = Query(0, ge=0, description="Number of records to skip"),
	limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db)
):
	# This endpoint shows all activities, not filtered by user
	# In production, you might want to restrict this or add more filtering
	activities, total = get_activity_feed(db, skip=skip, limit=limit)
	# Parse details from JSON string to dict
	for activity in activities:
		if activity.details and isinstance(activity.details, str):
			import json
			try:
				activity.details = json.loads(activity.details)
			except:
				activity.details = None
	return schemas.ActivityFeedResponse(total=total, items=activities)
