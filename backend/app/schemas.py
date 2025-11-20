from pydantic import BaseModel, Field, ConfigDict, EmailStr
from datetime import date, datetime
from typing import Optional, List
from app.models import TodoStatus, TodoPriority, PermissionLevel

class UserBase(BaseModel):
	email: EmailStr = Field(..., description="User's email address")
	username: str = Field(..., min_length=3, max_length=100, description="Unique username")
	full_name: Optional[str] = Field(None, max_length=255, description="User's full name")


class UserCreate(UserBase):
	password: str = Field(..., min_length=8, description="User's password")


class UserUpdate(BaseModel):
	email: Optional[EmailStr] = None
	username: Optional[str] = Field(None, min_length=3, max_length=100)
	full_name: Optional[str] = Field(None, max_length=255)
	password: Optional[str] = Field(None, min_length=8)
	is_active: Optional[bool] = None


class UserResponse(UserBase):
	id: int
	is_active: bool
	created_at: datetime
	updated_at: Optional[datetime] = None

	model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
	username: str = Field(..., description="Username or email")
	password: str = Field(..., description="Password")




class TodoListBase(BaseModel):
	name: str = Field(..., min_length=1, max_length=255, description="Name of the todo list")
	description: Optional[str] = Field(None, description="Description of the list")
	color: Optional[str] = Field('#3B82F6', pattern='^#[0-9A-Fa-f]{6}$', description="Hex color code")


class TodoListCreate(TodoListBase):
	pass


class TodoListUpdate(BaseModel):
	name: Optional[str] = Field(None, min_length=1, max_length=255)
	description: Optional[str] = None
	color: Optional[str] = Field(None, pattern='^#[0-9A-Fa-f]{6}$')
	is_archived: Optional[bool] = None


class TodoListResponse(TodoListBase):
	id: int
	owner_id: int
	is_archived: bool
	created_at: datetime
	updated_at: Optional[datetime] = None
	todo_count: Optional[int] = 0
	permission_level: Optional[str] = None

	model_config = ConfigDict(from_attributes=True)

class ListPermissionBase(BaseModel):
	user_id: int = Field(..., description="ID of user to share with")
	permission_level: PermissionLevel = Field(..., description="Permission level: view or update")


class ListPermissionCreate(BaseModel):
	user_identifier: str = Field(..., description="Username or email of user to share with")
	permission_level: PermissionLevel = Field(..., description="Permission level: view or update")


class ListPermissionUpdate(BaseModel):
	permission_level: PermissionLevel


class ListPermissionResponse(ListPermissionBase):
	id: int
	list_id: int
	shared_by: int
	shared_at: datetime
	user: Optional['UserResponse'] = None

	model_config = ConfigDict(from_attributes=True)

class TagBase(BaseModel):
	name: str = Field(..., min_length=1, max_length=100, description="Tag name")
	color: Optional[str] = Field('#6B7280', pattern='^#[0-9A-Fa-f]{6}$', description="Hex color code")


class TagCreate(TagBase):
	pass


class TagUpdate(BaseModel):
	name: Optional[str] = Field(None, min_length=1, max_length=100)
	color: Optional[str] = Field(None, pattern='^#[0-9A-Fa-f]{6}$')


class TagResponse(TagBase):
	id: int
	created_by: int
	created_at: datetime

	model_config = ConfigDict(from_attributes=True)

class TodoBase(BaseModel):
	name: str = Field(..., min_length=1, max_length=255, description="Name of the TODO")
	description: Optional[str] = Field(None, description="Description of the TODO")
	color: str = Field(None, description="Color of the TODO")
	due_date: date = Field(..., description="Due date for the TODO")
	status: TodoStatus = Field(TodoStatus.NOT_STARTED, description="Status of the TODO")
	priority: TodoPriority = Field(TodoPriority.MEDIUM, description="Priority of the TODO")


class TodoCreate(TodoBase):
	tag_ids: Optional[List[int]] = Field(default_factory=list, description="List of tag IDs to assign")


class TodoUpdate(BaseModel):
	name: Optional[str] = Field(None, min_length=1, max_length=255)
	description: Optional[str] = None
	color: Optional[str] = None
	status: Optional[TodoStatus] = None
	priority: Optional[TodoPriority] = None
	tag_ids: Optional[List[int]] = None


class TodoResponse(TodoBase):
	id: int
	list_id: int
	created_at: datetime
	updated_at: Optional[datetime] = None
	tags: List[TagResponse] = []

	model_config = ConfigDict(from_attributes=True)

class TodoListListResponse(BaseModel):
	total: int
	items: List[TodoListResponse]


class TodoListResponseWithDetails(TodoListResponse):
	todos: List[TodoResponse] = []
	shared_with: List[ListPermissionResponse] = []

	model_config = ConfigDict(from_attributes=True)


class TagListResponse(BaseModel):
	total: int
	items: List[TagResponse]


class TodoListResponsePaginated(BaseModel):
	total: int
	items: List[TodoResponse]

class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"
	user: UserResponse


class TokenData(BaseModel):
	user_id: Optional[int] = None
	username: Optional[str] = None

class ActivityLogResponse(BaseModel):
	id: int
	user_id: int
	list_id: Optional[int] = None
	todo_id: Optional[int] = None
	action_type: str
	entity_type: str
	entity_id: Optional[int] = None
	details: Optional[dict] = None
	created_at: datetime
	user: Optional[UserResponse] = None
	
	model_config = ConfigDict(from_attributes=True)


class ActivityFeedResponse(BaseModel):
	total: int
	items: List[ActivityLogResponse]
