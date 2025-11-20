"""
Unit tests for Todo Item CRUD operations.
Tests cover creation, reading, updating, and deleting todo items with proper authorization.
"""
import pytest
from datetime import date, timedelta
from fastapi import HTTPException

from app import crud, schemas
from app.models import Todo, TodoStatus, TodoPriority


class TestGetListTodos:
    """Tests for getting todos in a list."""
    
    def test_get_todos_as_owner(self, db_session, test_user1, test_list, test_todo):
        """Test owner can get todos from their list."""
        todos = crud.get_list_todos(db_session, test_list.id, test_user1.id)
        
        assert len(todos) == 1
        assert todos[0].id == test_todo.id
        assert todos[0].name == "Test Todo"
    
    def test_get_todos_with_view_permission(self, db_session, test_user2, test_list, test_todo, test_permission_view):
        """Test user with view permission can get todos."""
        todos = crud.get_list_todos(db_session, test_list.id, test_user2.id)
        
        assert len(todos) == 1
        assert todos[0].id == test_todo.id
    
    def test_get_todos_with_update_permission(self, db_session, test_user2, test_list, test_todo, test_permission_update):
        """Test user with update permission can get todos."""
        todos = crud.get_list_todos(db_session, test_list.id, test_user2.id)
        
        assert len(todos) == 1
        assert todos[0].id == test_todo.id
    
    def test_get_todos_without_permission(self, db_session, test_user2, test_list):
        """Test user without permission cannot get todos."""
        with pytest.raises(HTTPException) as exc_info:
            crud.get_list_todos(db_session, test_list.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_get_todos_pagination(self, db_session, test_user1, test_list):
        """Test pagination of todos."""
        # Create multiple todos
        for i in range(5):
            todo_data = schemas.TodoCreate(
                name=f"Todo {i}",
                description=f"Description {i}",
                due_date=date.today() + timedelta(days=i),
                status=TodoStatus.NOT_STARTED,
                priority=TodoPriority.MEDIUM
            )
            crud.create_todo(db_session, test_list.id, todo_data, test_user1.id)
        
        # Test pagination
        todos_page1 = crud.get_list_todos(db_session, test_list.id, test_user1.id, skip=0, limit=3)
        todos_page2 = crud.get_list_todos(db_session, test_list.id, test_user1.id, skip=3, limit=3)
        
        assert len(todos_page1) == 3
        assert len(todos_page2) == 2
    
    def test_get_todos_empty_list(self, db_session, test_user1, test_list):
        """Test getting todos from empty list."""
        todos = crud.get_list_todos(db_session, test_list.id, test_user1.id)
        assert len(todos) == 0


class TestGetTodoById:
    """Tests for getting a specific todo by ID."""
    
    def test_get_own_todo(self, db_session, test_user1, test_todo):
        """Test owner can get their own todo."""
        result = crud.get_todo_by_id(db_session, test_todo.id, test_user1.id)
        
        assert result.id == test_todo.id
        assert result.name == "Test Todo"
        assert result.status == TodoStatus.NOT_STARTED
    
    def test_get_todo_with_view_permission(self, db_session, test_user2, test_list, test_todo, test_permission_view):
        """Test user with view permission can get todo."""
        result = crud.get_todo_by_id(db_session, test_todo.id, test_user2.id)
        
        assert result.id == test_todo.id
        assert result.name == "Test Todo"
    
    def test_get_todo_with_update_permission(self, db_session, test_user2, test_list, test_todo, test_permission_update):
        """Test user with update permission can get todo."""
        result = crud.get_todo_by_id(db_session, test_todo.id, test_user2.id)
        
        assert result.id == test_todo.id
    
    def test_get_todo_without_permission(self, db_session, test_user2, test_todo):
        """Test user without permission cannot get todo."""
        with pytest.raises(HTTPException) as exc_info:
            crud.get_todo_by_id(db_session, test_todo.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_get_nonexistent_todo(self, db_session, test_user1):
        """Test getting a todo that doesn't exist."""
        with pytest.raises(HTTPException) as exc_info:
            crud.get_todo_by_id(db_session, 99999, test_user1.id)
        
        assert exc_info.value.status_code == 404


class TestCreateTodo:
    """Tests for creating todo items."""
    
    def test_create_todo_as_owner(self, db_session, test_user1, test_list):
        """Test owner can create todo in their list."""
        todo_data = schemas.TodoCreate(
            name="New Todo",
            description="A brand new todo",
            due_date=date(2024, 12, 31),
            status=TodoStatus.NOT_STARTED,
            priority=TodoPriority.HIGH
        )
        
        result = crud.create_todo(db_session, test_list.id, todo_data, test_user1.id)
        
        assert result.id is not None
        assert result.name == "New Todo"
        assert result.description == "A brand new todo"
        assert result.due_date == date(2024, 12, 31)
        assert result.status == TodoStatus.NOT_STARTED
        assert result.priority == TodoPriority.HIGH
        assert result.list_id == test_list.id
        assert result.created_by == test_user1.id
        assert result.created_at is not None
    
    def test_create_todo_with_update_permission(self, db_session, test_user2, test_list, test_permission_update):
        """Test user with update permission can create todo."""
        todo_data = schemas.TodoCreate(
            name="Shared Todo",
            due_date=date.today(),
            status=TodoStatus.NOT_STARTED,
            priority=TodoPriority.MEDIUM
        )
        
        result = crud.create_todo(db_session, test_list.id, todo_data, test_user2.id)
        
        assert result.id is not None
        assert result.name == "Shared Todo"
        assert result.created_by == test_user2.id
    
    def test_create_todo_with_view_permission_fails(self, db_session, test_user2, test_list, test_permission_view):
        """Test user with only view permission cannot create todo."""
        todo_data = schemas.TodoCreate(
            name="Should Fail",
            due_date=date.today(),
            status=TodoStatus.NOT_STARTED,
            priority=TodoPriority.MEDIUM
        )
        
        with pytest.raises(HTTPException) as exc_info:
            crud.create_todo(db_session, test_list.id, todo_data, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_create_todo_without_permission(self, db_session, test_user2, test_list):
        """Test user without permission cannot create todo."""
        todo_data = schemas.TodoCreate(
            name="Unauthorized Todo",
            due_date=date.today(),
            status=TodoStatus.NOT_STARTED,
            priority=TodoPriority.MEDIUM
        )
        
        with pytest.raises(HTTPException) as exc_info:
            crud.create_todo(db_session, test_list.id, todo_data, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_create_todo_with_tags(self, db_session, test_user1, test_list, test_tag):
        """Test creating todo with tags."""
        todo_data = schemas.TodoCreate(
            name="Tagged Todo",
            due_date=date.today(),
            status=TodoStatus.NOT_STARTED,
            priority=TodoPriority.MEDIUM,
            tag_ids=[test_tag.id]
        )
        
        result = crud.create_todo(db_session, test_list.id, todo_data, test_user1.id)
        
        assert len(result.tags) == 1
        assert result.tags[0].id == test_tag.id
    
    def test_create_todo_minimal_fields(self, db_session, test_user1, test_list):
        """Test creating todo with minimal required fields."""
        todo_data = schemas.TodoCreate(
            name="Minimal Todo",
            due_date=date.today()
        )
        
        result = crud.create_todo(db_session, test_list.id, todo_data, test_user1.id)
        
        assert result.name == "Minimal Todo"
        assert result.status == TodoStatus.NOT_STARTED
        assert result.priority == TodoPriority.MEDIUM
    
    def test_create_todo_in_nonexistent_list(self, db_session, test_user1):
        """Test creating todo in list that doesn't exist."""
        todo_data = schemas.TodoCreate(
            name="Orphan Todo",
            due_date=date.today()
        )
        
        with pytest.raises(HTTPException):
            crud.create_todo(db_session, 99999, todo_data, test_user1.id)


class TestUpdateTodo:
    """Tests for updating todo items."""
    
    def test_update_todo_as_owner(self, db_session, test_user1, test_todo):
        """Test owner can update their todo."""
        update_data = schemas.TodoUpdate(
            name="Updated Todo Name",
            status=TodoStatus.IN_PROGRESS
        )
        
        result = crud.update_todo(db_session, test_todo.id, update_data, test_user1.id)
        
        assert result.name == "Updated Todo Name"
        assert result.status == TodoStatus.IN_PROGRESS
        assert result.description == test_todo.description  # unchanged
    
    def test_update_todo_with_update_permission(self, db_session, test_user2, test_list, test_todo, test_permission_update):
        """Test user with update permission can update todo."""
        update_data = schemas.TodoUpdate(
            status=TodoStatus.COMPLETED,
            priority=TodoPriority.HIGHEST
        )
        
        result = crud.update_todo(db_session, test_todo.id, update_data, test_user2.id)
        
        assert result.status == TodoStatus.COMPLETED
        assert result.priority == TodoPriority.HIGHEST
    
    def test_update_todo_with_view_permission_fails(self, db_session, test_user2, test_list, test_todo, test_permission_view):
        """Test user with view permission cannot update todo."""
        update_data = schemas.TodoUpdate(name="Should Fail")
        
        with pytest.raises(HTTPException) as exc_info:
            crud.update_todo(db_session, test_todo.id, update_data, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_update_todo_without_permission(self, db_session, test_user2, test_todo):
        """Test user without permission cannot update todo."""
        update_data = schemas.TodoUpdate(name="Unauthorized")
        
        with pytest.raises(HTTPException) as exc_info:
            crud.update_todo(db_session, test_todo.id, update_data, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_update_todo_all_fields(self, db_session, test_user1, test_todo):
        """Test updating all todo fields."""
        update_data = schemas.TodoUpdate(
            name="Completely Updated",
            description="New description",
            status=TodoStatus.COMPLETED,
            priority=TodoPriority.LOWEST
        )
        
        result = crud.update_todo(db_session, test_todo.id, update_data, test_user1.id)
        
        assert result.name == "Completely Updated"
        assert result.description == "New description"
        assert result.status == TodoStatus.COMPLETED
        assert result.priority == TodoPriority.LOWEST
    
    def test_update_todo_tags(self, db_session, test_user1, test_todo, test_tag):
        """Test updating todo tags."""
        # Create another tag
        tag2 = crud.create_tag(
            db_session,
            schemas.TagCreate(name="Urgent", color="#F59E0B"),
            test_user1.id
        )
        
        update_data = schemas.TodoUpdate(tag_ids=[test_tag.id, tag2.id])
        
        result = crud.update_todo(db_session, test_todo.id, update_data, test_user1.id)
        
        assert len(result.tags) == 2
        tag_ids = [t.id for t in result.tags]
        assert test_tag.id in tag_ids
        assert tag2.id in tag_ids
    
    def test_update_todo_clear_tags(self, db_session, test_user1, test_todo, test_tag):
        """Test clearing todo tags."""
        # First add a tag
        test_todo.tags.append(test_tag)
        db_session.commit()
        
        # Now clear tags
        update_data = schemas.TodoUpdate(tag_ids=[])
        result = crud.update_todo(db_session, test_todo.id, update_data, test_user1.id)
        
        assert len(result.tags) == 0
    
    def test_update_nonexistent_todo(self, db_session, test_user1):
        """Test updating a todo that doesn't exist."""
        update_data = schemas.TodoUpdate(name="Ghost Todo")
        
        with pytest.raises(HTTPException) as exc_info:
            crud.update_todo(db_session, 99999, update_data, test_user1.id)
        
        assert exc_info.value.status_code == 404


class TestDeleteTodo:
    """Tests for deleting todo items."""
    
    def test_delete_own_todo(self, db_session, test_user1, test_todo):
        """Test owner can delete their todo."""
        todo_id = test_todo.id
        
        result = crud.delete_todo(db_session, todo_id, test_user1.id)
        
        assert result is True
        
        # Verify todo is deleted
        with pytest.raises(HTTPException):
            crud.get_todo_by_id(db_session, todo_id, test_user1.id)
    
    def test_delete_todo_with_update_permission(self, db_session, test_user2, test_list, test_todo, test_permission_update):
        """Test user with update permission can delete todo."""
        todo_id = test_todo.id
        
        result = crud.delete_todo(db_session, todo_id, test_user2.id)
        
        assert result is True
        
        # Verify deletion
        deleted_todo = db_session.query(Todo).filter(Todo.id == todo_id).first()
        assert deleted_todo is None
    
    def test_delete_todo_with_view_permission_fails(self, db_session, test_user2, test_list, test_todo, test_permission_view):
        """Test user with view permission cannot delete todo."""
        with pytest.raises(HTTPException) as exc_info:
            crud.delete_todo(db_session, test_todo.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_delete_todo_without_permission(self, db_session, test_user2, test_todo):
        """Test user without permission cannot delete todo."""
        with pytest.raises(HTTPException) as exc_info:
            crud.delete_todo(db_session, test_todo.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_delete_nonexistent_todo(self, db_session, test_user1):
        """Test deleting a todo that doesn't exist."""
        with pytest.raises(HTTPException) as exc_info:
            crud.delete_todo(db_session, 99999, test_user1.id)
        
        assert exc_info.value.status_code == 404
    
    def test_delete_todo_with_tags(self, db_session, test_user1, test_todo, test_tag):
        """Test deleting todo with tags removes associations."""
        # Add tag to todo
        test_todo.tags.append(test_tag)
        db_session.commit()
        
        todo_id = test_todo.id
        
        # Delete todo
        crud.delete_todo(db_session, todo_id, test_user1.id)
        
        # Verify todo is deleted but tag still exists
        deleted_todo = db_session.query(Todo).filter(Todo.id == todo_id).first()
        assert deleted_todo is None
        
        # Tag should still exist
        from app.models import Tag
        existing_tag = db_session.query(Tag).filter(Tag.id == test_tag.id).first()
        assert existing_tag is not None
