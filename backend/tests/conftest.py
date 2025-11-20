"""
Test configuration and fixtures for the todo application.
"""
import pytest
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from passlib.context import CryptContext

from app.database import Base
from app.models import User, TodoList, Todo, Tag, ListPermission, TodoStatus, TodoPriority, PermissionLevel

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def password_hash():
    """Return a function to hash passwords - using a simple hash for testing."""
    def _hash(password: str) -> str:
        # For testing, use a simple deterministic hash to avoid bcrypt compatibility issues
        # In production, the app uses proper bcrypt hashing
        return f"$2b$12$test_hash_{password}"
    return _hash


@pytest.fixture
def test_user1(db_session, password_hash):
    """Create a test user (owner)."""
    user = User(
        email="user1@example.com",
        username="user1",
        password_hash=password_hash("password123"),
        full_name="Test User One",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user2(db_session, password_hash):
    """Create a second test user (for sharing)."""
    user = User(
        email="user2@example.com",
        username="user2",
        password_hash=password_hash("password123"),
        full_name="Test User Two",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user3(db_session, password_hash):
    """Create a third test user (for additional testing)."""
    user = User(
        email="user3@example.com",
        username="user3",
        password_hash=password_hash("password123"),
        full_name="Test User Three",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_list(db_session, test_user1):
    """Create a test todo list owned by user1."""
    todo_list = TodoList(
        name="Test List",
        description="A test todo list",
        color="#3B82F6",
        owner_id=test_user1.id,
        is_archived=False
    )
    db_session.add(todo_list)
    db_session.commit()
    db_session.refresh(todo_list)
    return todo_list


@pytest.fixture
def test_list2(db_session, test_user2):
    """Create a second test todo list owned by user2."""
    todo_list = TodoList(
        name="Test List 2",
        description="Another test todo list",
        color="#10B981",
        owner_id=test_user2.id,
        is_archived=False
    )
    db_session.add(todo_list)
    db_session.commit()
    db_session.refresh(todo_list)
    return todo_list


@pytest.fixture
def test_todo(db_session, test_list, test_user1):
    """Create a test todo item in test_list."""
    todo = Todo(
        name="Test Todo",
        description="A test todo item",
        due_date=date(2024, 12, 31),
        status=TodoStatus.NOT_STARTED,
        priority=TodoPriority.MEDIUM,
        list_id=test_list.id,
        created_by=test_user1.id
    )
    db_session.add(todo)
    db_session.commit()
    db_session.refresh(todo)
    return todo


@pytest.fixture
def test_tag(db_session, test_user1):
    """Create a test tag."""
    tag = Tag(
        name="Important",
        color="#EF4444",
        user_id=test_user1.id
    )
    db_session.add(tag)
    db_session.commit()
    db_session.refresh(tag)
    return tag


@pytest.fixture
def test_permission_view(db_session, test_list, test_user2, test_user1):
    """Create a view permission for user2 on test_list."""
    permission = ListPermission(
        list_id=test_list.id,
        user_id=test_user2.id,
        permission_level=PermissionLevel.VIEW,
        shared_by=test_user1.id
    )
    db_session.add(permission)
    db_session.commit()
    db_session.refresh(permission)
    return permission


@pytest.fixture
def test_permission_update(db_session, test_list, test_user2, test_user1):
    """Create an update permission for user2 on test_list."""
    permission = ListPermission(
        list_id=test_list.id,
        user_id=test_user2.id,
        permission_level=PermissionLevel.UPDATE,
        shared_by=test_user1.id
    )
    db_session.add(permission)
    db_session.commit()
    db_session.refresh(permission)
    return permission
