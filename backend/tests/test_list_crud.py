"""
Unit tests for Todo List CRUD operations.
Tests cover creation, reading, updating, and deleting todo lists with proper authorization.
"""
import pytest
from datetime import datetime
from fastapi import HTTPException

from app import crud, schemas
from app.models import TodoList, PermissionLevel


class TestGetUserLists:
    """Tests for getting user's todo lists."""
    
    def test_get_owned_lists(self, db_session, test_user1, test_list):
        """Test getting lists owned by user."""
        lists = crud.get_user_lists(db_session, test_user1.id)
        
        assert len(lists) == 1
        assert lists[0].id == test_list.id
        assert lists[0].name == "Test List"
        assert lists[0].owner_id == test_user1.id
    
    def test_get_shared_lists(self, db_session, test_user2, test_list, test_permission_view):
        """Test getting lists shared with user."""
        lists = crud.get_user_lists(db_session, test_user2.id)
        
        assert len(lists) >= 1
        shared_list_ids = [l.id for l in lists]
        assert test_list.id in shared_list_ids
    
    def test_get_owned_and_shared_lists(self, db_session, test_user1, test_user2, test_list, test_list2):
        """Test getting both owned and shared lists."""
        # Share user2's list with user1
        permission = crud.create_permission(
            db_session,
            test_list2.id,
            schemas.ListPermissionCreate(
                user_identifier="user1",
                permission_level=PermissionLevel.VIEW
            ),
            test_user2.id
        )
        
        lists = crud.get_user_lists(db_session, test_user1.id)
        list_ids = [l.id for l in lists]
        
        assert test_list.id in list_ids  # owned
        assert test_list2.id in list_ids  # shared
    
    def test_get_lists_with_pagination(self, db_session, test_user1):
        """Test pagination of lists."""
        # Create multiple lists
        for i in range(5):
            list_data = schemas.TodoListCreate(
                name=f"List {i}",
                description=f"Description {i}",
                color="#3B82F6"
            )
            crud.create_list(db_session, list_data, test_user1.id)
        
        # Test pagination
        lists_page1 = crud.get_user_lists(db_session, test_user1.id, skip=0, limit=3)
        lists_page2 = crud.get_user_lists(db_session, test_user1.id, skip=3, limit=3)
        
        assert len(lists_page1) == 3
        assert len(lists_page2) == 2
    
    def test_get_lists_empty(self, db_session, test_user3):
        """Test getting lists when user has no lists."""
        lists = crud.get_user_lists(db_session, test_user3.id)
        assert len(lists) == 0


class TestGetListById:
    """Tests for getting a specific todo list by ID."""
    
    def test_get_own_list(self, db_session, test_user1, test_list):
        """Test owner can get their own list."""
        result = crud.get_list_by_id(db_session, test_list.id, test_user1.id)
        
        assert result.id == test_list.id
        assert result.name == "Test List"
        assert result.owner_id == test_user1.id
    
    def test_get_shared_list_with_view_permission(self, db_session, test_user2, test_list, test_permission_view):
        """Test user with view permission can get list."""
        result = crud.get_list_by_id(db_session, test_list.id, test_user2.id)
        
        assert result.id == test_list.id
        assert result.name == "Test List"
    
    def test_get_shared_list_with_update_permission(self, db_session, test_user2, test_list, test_permission_update):
        """Test user with update permission can get list."""
        result = crud.get_list_by_id(db_session, test_list.id, test_user2.id)
        
        assert result.id == test_list.id
        assert result.name == "Test List"
    
    def test_get_list_without_permission(self, db_session, test_user2, test_list):
        """Test user without permission cannot get list."""
        with pytest.raises(HTTPException) as exc_info:
            crud.get_list_by_id(db_session, test_list.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
        assert "permission" in str(exc_info.value.detail).lower()
    
    def test_get_nonexistent_list(self, db_session, test_user1):
        """Test getting a list that doesn't exist."""
        with pytest.raises(HTTPException) as exc_info:
            crud.get_list_by_id(db_session, 99999, test_user1.id)
        
        assert exc_info.value.status_code == 404


class TestCreateList:
    """Tests for creating todo lists."""
    
    def test_create_list_success(self, db_session, test_user1):
        """Test successful list creation."""
        list_data = schemas.TodoListCreate(
            name="New List",
            description="A brand new list",
            color="#10B981"
        )
        
        result = crud.create_list(db_session, list_data, test_user1.id)
        
        assert result.id is not None
        assert result.name == "New List"
        assert result.description == "A brand new list"
        assert result.color == "#10B981"
        assert result.owner_id == test_user1.id
        assert result.is_archived is False
        assert result.created_at is not None
    
    def test_create_list_minimal(self, db_session, test_user1):
        """Test creating list with minimal required fields."""
        list_data = schemas.TodoListCreate(
            name="Minimal List"
        )
        
        result = crud.create_list(db_session, list_data, test_user1.id)
        
        assert result.id is not None
        assert result.name == "Minimal List"
        assert result.description is None
        assert result.color == "#3B82F6"  # default color
        assert result.owner_id == test_user1.id
    
    def test_create_multiple_lists(self, db_session, test_user1):
        """Test creating multiple lists for same user."""
        list1_data = schemas.TodoListCreate(name="List 1")
        list2_data = schemas.TodoListCreate(name="List 2")
        
        result1 = crud.create_list(db_session, list1_data, test_user1.id)
        result2 = crud.create_list(db_session, list2_data, test_user1.id)
        
        assert result1.id != result2.id
        assert result1.name == "List 1"
        assert result2.name == "List 2"
        
        all_lists = crud.get_user_lists(db_session, test_user1.id)
        assert len(all_lists) == 2


class TestUpdateList:
    """Tests for updating todo lists."""
    
    def test_update_list_name(self, db_session, test_user1, test_list):
        """Test updating list name."""
        update_data = schemas.TodoListUpdate(name="Updated List Name")
        
        result = crud.update_list(db_session, test_list.id, update_data, test_user1.id)
        
        assert result.id == test_list.id
        assert result.name == "Updated List Name"
        assert result.description == test_list.description  # unchanged
        assert result.color == test_list.color  # unchanged
    
    def test_update_list_description(self, db_session, test_user1, test_list):
        """Test updating list description."""
        update_data = schemas.TodoListUpdate(description="New description")
        
        result = crud.update_list(db_session, test_list.id, update_data, test_user1.id)
        
        assert result.description == "New description"
        assert result.name == test_list.name  # unchanged
    
    def test_update_list_color(self, db_session, test_user1, test_list):
        """Test updating list color."""
        update_data = schemas.TodoListUpdate(color="#EF4444")
        
        result = crud.update_list(db_session, test_list.id, update_data, test_user1.id)
        
        assert result.color == "#EF4444"
    
    def test_update_list_archive_status(self, db_session, test_user1, test_list):
        """Test archiving a list."""
        update_data = schemas.TodoListUpdate(is_archived=True)
        
        result = crud.update_list(db_session, test_list.id, update_data, test_user1.id)
        
        assert result.is_archived is True
    
    def test_update_list_multiple_fields(self, db_session, test_user1, test_list):
        """Test updating multiple fields at once."""
        update_data = schemas.TodoListUpdate(
            name="Completely Updated",
            description="All new description",
            color="#8B5CF6",
            is_archived=True
        )
        
        result = crud.update_list(db_session, test_list.id, update_data, test_user1.id)
        
        assert result.name == "Completely Updated"
        assert result.description == "All new description"
        assert result.color == "#8B5CF6"
        assert result.is_archived is True
    
    def test_update_list_non_owner(self, db_session, test_user2, test_list):
        """Test that non-owner cannot update list."""
        update_data = schemas.TodoListUpdate(name="Unauthorized Update")
        
        with pytest.raises(HTTPException) as exc_info:
            crud.update_list(db_session, test_list.id, update_data, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_update_list_with_update_permission_fails(self, db_session, test_user2, test_list, test_permission_update):
        """Test that even UPDATE permission doesn't allow list metadata changes."""
        update_data = schemas.TodoListUpdate(name="Should Fail")
        
        with pytest.raises(HTTPException) as exc_info:
            crud.update_list(db_session, test_list.id, update_data, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_update_nonexistent_list(self, db_session, test_user1):
        """Test updating a list that doesn't exist."""
        update_data = schemas.TodoListUpdate(name="Updated")
        
        with pytest.raises(HTTPException) as exc_info:
            crud.update_list(db_session, 99999, update_data, test_user1.id)
        
        assert exc_info.value.status_code == 404


class TestDeleteList:
    """Tests for deleting todo lists."""
    
    def test_delete_own_list(self, db_session, test_user1, test_list):
        """Test owner can delete their list."""
        list_id = test_list.id
        
        result = crud.delete_list(db_session, list_id, test_user1.id)
        
        assert result is True
        
        # Verify list is deleted
        with pytest.raises(HTTPException):
            crud.get_list_by_id(db_session, list_id, test_user1.id)
    
    def test_delete_list_with_todos(self, db_session, test_user1, test_list, test_todo):
        """Test deleting list also deletes associated todos."""
        list_id = test_list.id
        todo_id = test_todo.id
        
        crud.delete_list(db_session, list_id, test_user1.id)
        
        # Verify todos are deleted
        from app.models import Todo
        deleted_todo = db_session.query(Todo).filter(Todo.id == todo_id).first()
        assert deleted_todo is None
    
    def test_delete_list_with_permissions(self, db_session, test_user1, test_list, test_permission_view):
        """Test deleting list also deletes associated permissions."""
        list_id = test_list.id
        permission_id = test_permission_view.id
        
        crud.delete_list(db_session, list_id, test_user1.id)
        
        # Verify permissions are deleted
        from app.models import ListPermission
        deleted_perm = db_session.query(ListPermission).filter(
            ListPermission.id == permission_id
        ).first()
        assert deleted_perm is None
    
    def test_delete_list_non_owner(self, db_session, test_user2, test_list):
        """Test that non-owner cannot delete list."""
        with pytest.raises(HTTPException) as exc_info:
            crud.delete_list(db_session, test_list.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_delete_list_with_update_permission_fails(self, db_session, test_user2, test_list, test_permission_update):
        """Test that even UPDATE permission doesn't allow deletion."""
        with pytest.raises(HTTPException) as exc_info:
            crud.delete_list(db_session, test_list.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_delete_nonexistent_list(self, db_session, test_user1):
        """Test deleting a list that doesn't exist."""
        with pytest.raises(HTTPException) as exc_info:
            crud.delete_list(db_session, 99999, test_user1.id)
        
        assert exc_info.value.status_code == 404
