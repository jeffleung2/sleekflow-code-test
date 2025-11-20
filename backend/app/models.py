from sqlalchemy import Column, Integer, String, Text, Date, Enum, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from app.database import Base

class TodoStatus(str, enum.Enum):
	NOT_STARTED = "Not Started"
	IN_PROGRESS = "In Progress"
	COMPLETED = "Completed"


class TodoPriority(str, enum.Enum):
	HIGHEST = "Highest"
	HIGH = "High"
	MEDIUM = "Medium"
	LOW = "Low"
	LOWEST = "Lowest"


class PermissionLevel(str, enum.Enum):
	VIEW = "view"
	UPDATE = "update"


class ActivityActionType(str, enum.Enum):
	CREATED = "created"
	UPDATED = "updated"
	STATUS_CHANGED = "status_changed"
	DELETED = "deleted"
	SHARED = "shared"
	PERMISSION_CHANGED = "permission_changed"


class ActivityEntityType(str, enum.Enum):
	LIST = "list"
	TODO = "todo"
	PERMISSION = "permission"
	TAG = "tag"

todo_tags = Table(
	'todo_tags',
	Base.metadata,
	Column('todo_id', Integer, ForeignKey('todos.id', ondelete='CASCADE'), primary_key=True),
	Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True),
	Column('created_at', DateTime(timezone=True), server_default=func.now())
)

class User(Base):
	__tablename__ = "users"

	id = Column(Integer, primary_key=True, index=True)
	email = Column(String(255), unique=True, nullable=False, index=True)
	username = Column(String(100), unique=True, nullable=False, index=True)
	password_hash = Column(String(255), nullable=False)
	full_name = Column(String(255), nullable=True)
	is_active = Column(Boolean, default=True, nullable=False, index=True)
	created_at = Column(DateTime(timezone=True), server_default=func.now())
	updated_at = Column(DateTime(timezone=True), onupdate=func.now())

	# Relationships
	owned_lists = relationship("TodoList", back_populates="owner", foreign_keys="TodoList.owner_id", cascade="all, delete-orphan")
	created_todos = relationship("Todo", back_populates="creator", foreign_keys="Todo.created_by")
	tags = relationship("Tag", back_populates="user", cascade="all, delete-orphan")
	list_permissions = relationship("ListPermission", back_populates="user", foreign_keys="ListPermission.user_id", cascade="all, delete-orphan")
	activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")

	def __repr__(self):
		return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"


class TodoList(Base):
	__tablename__ = "todo_lists"

	id = Column(Integer, primary_key=True, index=True)
	name = Column(String(255), nullable=False)
	description = Column(Text, nullable=True)
	owner_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
	color = Column(String(7), default='#3B82F6')  # Hex color
	is_archived = Column(Boolean, default=False, nullable=False, index=True)
	created_at = Column(DateTime(timezone=True), server_default=func.now())
	updated_at = Column(DateTime(timezone=True), onupdate=func.now())

	# Relationships
	owner = relationship("User", back_populates="owned_lists", foreign_keys=[owner_id])
	todos = relationship("Todo", back_populates="todo_list", cascade="all, delete-orphan")
	permissions = relationship("ListPermission", back_populates="todo_list", cascade="all, delete-orphan")
	activity_logs = relationship("ActivityLog", back_populates="todo_list", cascade="all, delete-orphan")

	def __repr__(self):
		return f"<TodoList(id={self.id}, name='{self.name}', owner_id={self.owner_id})>"


class ListPermission(Base):
	__tablename__ = "list_permissions"

	id = Column(Integer, primary_key=True, index=True)
	list_id = Column(Integer, ForeignKey('todo_lists.id', ondelete='CASCADE'), nullable=False, index=True)
	user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
	permission_level = Column(
		Enum(PermissionLevel, native_enum=False, length=20, values_callable=lambda x: [e.value for e in x]),
		nullable=False,
		default=PermissionLevel.VIEW,
		index=True
	)
	shared_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
	shared_at = Column(DateTime(timezone=True), server_default=func.now())

	# Relationships
	todo_list = relationship("TodoList", back_populates="permissions")
	user = relationship("User", back_populates="list_permissions", foreign_keys=[user_id])
	shared_by_user = relationship("User", foreign_keys=[shared_by])

	def __repr__(self):
		return f"<ListPermission(list_id={self.list_id}, user_id={self.user_id}, level='{self.permission_level}')>"


class Tag(Base):
	__tablename__ = "tags"

	id = Column(Integer, primary_key=True, index=True)
	name = Column(String(100), nullable=False, index=True)
	color = Column(String(7), default='#6B7280')  # Hex color
	user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
	created_at = Column(DateTime(timezone=True), server_default=func.now())

	# Relationships
	user = relationship("User", back_populates="tags")
	todos = relationship("Todo", secondary=todo_tags, back_populates="tags")

	def __repr__(self):
		return f"<Tag(id={self.id}, name='{self.name}', user_id={self.user_id})>"


class Todo(Base):
	__tablename__ = "todos"

	id = Column(Integer, primary_key=True, index=True)
	name = Column(String(255), nullable=False)
	description = Column(Text, nullable=True)
	due_date = Column(Date, nullable=False, index=True)
	status = Column(
		Enum(TodoStatus, native_enum=False, length=50, values_callable=lambda x: [e.value for e in x]),
		nullable=False,
		default=TodoStatus.NOT_STARTED,
		index=True
	)
	priority = Column(
		Enum(TodoPriority, native_enum=False, length=20, values_callable=lambda x: [e.value for e in x]),
		nullable=False,
		default=TodoPriority.MEDIUM,
		index=True
	)
	list_id = Column(Integer, ForeignKey('todo_lists.id', ondelete='CASCADE'), nullable=False, index=True)
	created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
	created_at = Column(DateTime(timezone=True), server_default=func.now())
	updated_at = Column(DateTime(timezone=True), onupdate=func.now())
	completed_at = Column(DateTime(timezone=True), nullable=True, index=True)

	# Relationships
	todo_list = relationship("TodoList", back_populates="todos")
	creator = relationship("User", back_populates="created_todos", foreign_keys=[created_by])
	tags = relationship("Tag", secondary=todo_tags, back_populates="todos")

	def __repr__(self):
		return f"<Todo(id={self.id}, name='{self.name}', list_id={self.list_id}, status='{self.status}')>"


class ActivityLog(Base):
	__tablename__ = "activity_logs"

	id = Column(Integer, primary_key=True, index=True)
	user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
	list_id = Column(Integer, ForeignKey('todo_lists.id', ondelete='CASCADE'), nullable=True, index=True)
	todo_id = Column(Integer, ForeignKey('todos.id', ondelete='SET NULL'), nullable=True, index=True)
	action_type = Column(String(50), nullable=False, index=True)
	entity_type = Column(String(50), nullable=False, index=True)
	entity_id = Column(Integer, nullable=True)
	details = Column(Text, nullable=True)  # JSON stored as text
	created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

	# Relationships
	user = relationship("User", back_populates="activity_logs")
	todo_list = relationship("TodoList", back_populates="activity_logs")
	todo = relationship("Todo", foreign_keys=[todo_id])
	
	@property
	def details_dict(self):
		if self.details:
			import json
			try:
				return json.loads(self.details)
			except:
				return None
		return None

	def __repr__(self):
		return f"<ActivityLog(id={self.id}, user_id={self.user_id}, action='{self.action_type}', entity='{self.entity_type}')>"
