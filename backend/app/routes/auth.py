from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models import User
from app.schemas import (
	UserCreate, UserResponse, UserLogin, Token, UserUpdate
)
from app.auth import (
	get_password_hash, authenticate_user, create_access_token,
	get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
	user_data: UserCreate,
	db: Session = Depends(get_db)
):
	"""
	Register a new user account
	
	- **email**: Valid email address (must be unique)
	- **username**: Unique username (3-100 characters)
	- **password**: Password (minimum 8 characters)
	- **full_name**: Optional full name
	"""
	# Check if email already exists
	existing_user = db.query(User).filter(User.email == user_data.email).first()
	if existing_user:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Email already registered"
		)
	
	# Check if username already exists
	existing_user = db.query(User).filter(User.username == user_data.username).first()
	if existing_user:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Username already taken"
		)
	
	hashed_password = get_password_hash(user_data.password)
	
	db_user = User(
		email=user_data.email,
		username=user_data.username,
		password_hash=hashed_password,
		full_name=user_data.full_name,
		is_active=True
	)
	
	db.add(db_user)
	db.commit()
	db.refresh(db_user)
	
	return db_user


@router.post("/login", response_model=Token)
def login(
	login_data: UserLogin,
	db: Session = Depends(get_db)
):
	"""
	Login with username/email and password
	
	Returns JWT access token for authentication
	
	- **username**: Username or email address
	- **password**: User's password
	"""
	user = authenticate_user(db, login_data.username, login_data.password)
	
	if not user:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Incorrect username/email or password",
			headers={"WWW-Authenticate": "Bearer"},
		)
	
	access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
	access_token = create_access_token(
		data={"sub": user.id, "username": user.username},
		expires_delta=access_token_expires
	)
	
	return {
		"access_token": access_token,
		"token_type": "bearer",
		"user": user
	}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
	current_user: User = Depends(get_current_active_user)
):
	return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user_profile(
	user_update: UserUpdate,
	current_user: User = Depends(get_current_active_user),
	db: Session = Depends(get_db)
):
	"""
	Update current user's profile
	
	Requires authentication (JWT token in Authorization header)
	
	- **email**: New email (must be unique)
	- **username**: New username (must be unique)
	- **full_name**: New full name
	- **password**: New password
	"""
	# Check if email is being changed and if it's already taken
	if user_update.email and user_update.email != current_user.email:
		existing = db.query(User).filter(User.email == user_update.email).first()
		if existing:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Email already in use"
			)
		current_user.email = user_update.email
	
	# Check if username is being changed and if it's already taken
	if user_update.username and user_update.username != current_user.username:
		existing = db.query(User).filter(User.username == user_update.username).first()
		if existing:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Username already taken"
			)
		current_user.username = user_update.username
	
	# Update other fields
	if user_update.full_name is not None:
		current_user.full_name = user_update.full_name
	
	if user_update.password:
		current_user.password_hash = get_password_hash(user_update.password)
	
	if user_update.is_active is not None:
		current_user.is_active = user_update.is_active
	
	db.commit()
	db.refresh(current_user)
	
	return current_user


@router.post("/logout")
def logout(
	current_user: User = Depends(get_current_active_user)
):
	return {
		"message": "Successfully logged out. Please remove the token from client storage."
	}


@router.get("/verify")
def verify_token(
	current_user: User = Depends(get_current_active_user)
):
	return {
		"valid": True,
		"user_id": current_user.id,
		"username": current_user.username,
		"email": current_user.email
	}
