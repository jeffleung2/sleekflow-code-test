from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os

from app.database import get_db
from app.models import User
from app.schemas import TokenData

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
	return bcrypt.checkpw(
		plain_password.encode('utf-8'),
		hashed_password.encode('utf-8')
	)


def get_password_hash(password: str) -> str:
	salt = bcrypt.gensalt(rounds=12)
	hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
	return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
	to_encode = data.copy()
	
	if "sub" in to_encode and not isinstance(to_encode["sub"], str):
		to_encode["sub"] = str(to_encode["sub"])
	
	if expires_delta:
		expire = datetime.utcnow() + expires_delta
	else:
		expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
	
	to_encode.update({
		"exp": expire,
		"iat": datetime.utcnow(),
		"type": "access"
	})
	
	encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
	return encoded_jwt


def decode_access_token(token: str) -> TokenData:
	try:
		payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
		user_id_str: str = payload.get("sub")
		username: str = payload.get("username")
		
		if user_id_str is None:
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Invalid authentication token",
				headers={"WWW-Authenticate": "Bearer"},
			)
		
		try:
			user_id = int(user_id_str)
		except (ValueError, TypeError):
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Invalid user ID in token",
				headers={"WWW-Authenticate": "Bearer"},
			)
		
		return TokenData(user_id=user_id, username=username)
		
	except JWTError as e:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail=f"Could not validate credentials: {str(e)}",
			headers={"WWW-Authenticate": "Bearer"},
		)

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
	user = db.query(User).filter(
		(User.username == username) | (User.email == username)
	).first()
	
	if not user:
		return None
	
	if not verify_password(password, user.password_hash):
		return None
	
	if not user.is_active:
		return None
	
	return user

async def get_current_user(
	credentials: HTTPAuthorizationCredentials = Depends(security),
	db: Session = Depends(get_db)
) -> User:
	token = credentials.credentials
	
	# Decode and validate token
	token_data = decode_access_token(token)
	
	# Get user from database
	user = db.query(User).filter(User.id == token_data.user_id).first()
	
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="User not found",
			headers={"WWW-Authenticate": "Bearer"},
		)
	
	if not user.is_active:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Inactive user",
		)
	
	return user


async def get_current_active_user(
	current_user: User = Depends(get_current_user)
) -> User:
	if not current_user.is_active:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Inactive user"
		)
	return current_user

async def get_current_user_optional(
	credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
	db: Session = Depends(get_db)
) -> Optional[User]:
	if not credentials:
		return None
	
	try:
		token_data = decode_access_token(credentials.credentials)
		user = db.query(User).filter(User.id == token_data.user_id).first()
		
		if user and user.is_active:
			return user
			
	except HTTPException:
		pass
	
	return None
