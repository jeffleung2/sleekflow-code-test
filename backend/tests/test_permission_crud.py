"""
Unit tests for Share Permission (List Permission) CRUD operations.
Tests cover creation, reading, updating, and deleting list permissions.
"""
import pytest
from fastapi import HTTPException

from app import crud, schemas
from app.models import ListPermission, PermissionLevel


class TestGetListPermissions:
    """Tests for getting permissions of a list."""
    
    def test_get_permissions_as_owner(self, db_session, test_user1, test_list, test_permission_view):
        """Test owner can get all permissions for their list."""
        permissions = crud.get_list_permissions(db_session, test_list.id, test_user1.id)
        
        assert len(permissions) >= 1
        assert any(p.id == test_permission_view.id for p in permissions)
    
    def test_get_permissions_multiple_users(self, db_session, test_user1, test_user2, test_user3, test_list):
        """Test getting permissions when multiple users have access."""
        # Share with user2
        perm1 = crud.create_permission(
            db_session,
            test_list.id,
            schemas.ListPermissionCreate(
                user_identifier="user2",
                permission_level=PermissionLevel.VIEW
            ),
            test_user1.id
        )
        
        # Share with user3
        perm2 = crud.create_permission(
            db_session,
            test_list.id,
            schemas.ListPermissionCreate(
                user_identifier="user3",
                permission_level=PermissionLevel.UPDATE
            ),
            test_user1.id
        )
        
        permissions = crud.get_list_permissions(db_session, test_list.id, test_user1.id)
        
        assert len(permissions) == 2
        perm_ids = [p.id for p in permissions]
        assert perm1.id in perm_ids
        assert perm2.id in perm_ids
    
    def test_get_permissions_non_owner(self, db_session, test_user2, test_list):
        """Test non-owner cannot get permissions."""
        with pytest.raises(HTTPException) as exc_info:
            crud.get_list_permissions(db_session, test_list.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_get_permissions_shared_user_cannot_access(self, db_session, test_user2, test_list, test_permission_view):
        """Test user with permission cannot view permissions list."""
        with pytest.raises(HTTPException) as exc_info:
            crud.get_list_permissions(db_session, test_list.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_get_permissions_empty_list(self, db_session, test_user1, test_list):
        """Test getting permissions when no one has been granted access."""
        permissions = crud.get_list_permissions(db_session, test_list.id, test_user1.id)
        assert len(permissions) == 0
    
    def test_get_permissions_nonexistent_list(self, db_session, test_user1):
        """Test getting permissions for nonexistent list."""
        with pytest.raises(HTTPException) as exc_info:
            crud.get_list_permissions(db_session, 99999, test_user1.id)
        
        assert exc_info.value.status_code == 404


class TestCreatePermission:
    """Tests for creating list permissions (sharing)."""
    
    def test_share_with_username(self, db_session, test_user1, test_user2, test_list):
        """Test sharing list using username."""
        permission_data = schemas.ListPermissionCreate(
            user_identifier="user2",
            permission_level=PermissionLevel.VIEW
        )
        
        result = crud.create_permission(db_session, test_list.id, permission_data, test_user1.id)
        
        assert result.id is not None
        assert result.list_id == test_list.id
        assert result.user_id == test_user2.id
        assert result.permission_level == PermissionLevel.VIEW
        assert result.shared_by == test_user1.id
        assert result.shared_at is not None
    
    def test_share_with_email(self, db_session, test_user1, test_user2, test_list):
        """Test sharing list using email."""
        permission_data = schemas.ListPermissionCreate(
            user_identifier="user2@example.com",
            permission_level=PermissionLevel.UPDATE
        )
        
        result = crud.create_permission(db_session, test_list.id, permission_data, test_user1.id)
        
        assert result.user_id == test_user2.id
        assert result.permission_level == PermissionLevel.UPDATE
    
    def test_share_with_view_permission(self, db_session, test_user1, test_user2, test_list):
        """Test sharing with VIEW permission."""
        permission_data = schemas.ListPermissionCreate(
            user_identifier="user2",
            permission_level=PermissionLevel.VIEW
        )
        
        result = crud.create_permission(db_session, test_list.id, permission_data, test_user1.id)
        
        assert result.permission_level == PermissionLevel.VIEW
    
    def test_share_with_update_permission(self, db_session, test_user1, test_user2, test_list):
        """Test sharing with UPDATE permission."""
        permission_data = schemas.ListPermissionCreate(
            user_identifier="user2",
            permission_level=PermissionLevel.UPDATE
        )
        
        result = crud.create_permission(db_session, test_list.id, permission_data, test_user1.id)
        
        assert result.permission_level == PermissionLevel.UPDATE
    
    def test_share_with_nonexistent_user(self, db_session, test_user1, test_list):
        """Test sharing with user that doesn't exist."""
        permission_data = schemas.ListPermissionCreate(
            user_identifier="nonexistent_user",
            permission_level=PermissionLevel.VIEW
        )
        
        with pytest.raises(HTTPException) as exc_info:
            crud.create_permission(db_session, test_list.id, permission_data, test_user1.id)
        
        assert exc_info.value.status_code == 404
        assert "not found" in str(exc_info.value.detail).lower()
    
    def test_share_non_owner(self, db_session, test_user2, test_list):
        """Test non-owner cannot share list."""
        permission_data = schemas.ListPermissionCreate(
            user_identifier="user3",
            permission_level=PermissionLevel.VIEW
        )
        
        with pytest.raises(HTTPException) as exc_info:
            crud.create_permission(db_session, test_list.id, permission_data, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_share_with_update_permission_user_cannot_share(self, db_session, test_user1, test_user2, test_user3, test_list, test_permission_update):
        """Test user with update permission cannot share list."""
        permission_data = schemas.ListPermissionCreate(
            user_identifier="user3",
            permission_level=PermissionLevel.VIEW
        )
        
        with pytest.raises(HTTPException) as exc_info:
            crud.create_permission(db_session, test_list.id, permission_data, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_share_duplicate_updates_permission(self, db_session, test_user1, test_user2, test_list):
        """Test sharing with user who already has access updates permission level."""
        # First share with VIEW
        permission_data1 = schemas.ListPermissionCreate(
            user_identifier="user2",
            permission_level=PermissionLevel.VIEW
        )
        result1 = crud.create_permission(db_session, test_list.id, permission_data1, test_user1.id)
        
        # Share again with UPDATE
        permission_data2 = schemas.ListPermissionCreate(
            user_identifier="user2",
            permission_level=PermissionLevel.UPDATE
        )
        result2 = crud.create_permission(db_session, test_list.id, permission_data2, test_user1.id)
        
        # Should be same permission record, updated
        assert result1.id == result2.id
        assert result2.permission_level == PermissionLevel.UPDATE
        
        # Verify only one permission exists
        permissions = crud.get_list_permissions(db_session, test_list.id, test_user1.id)
        user2_perms = [p for p in permissions if p.user_id == test_user2.id]
        assert len(user2_perms) == 1
    
    def test_share_with_same_permission_level_no_duplicate(self, db_session, test_user1, test_user2, test_list):
        """Test sharing with same permission level doesn't create duplicate."""
        permission_data = schemas.ListPermissionCreate(
            user_identifier="user2",
            permission_level=PermissionLevel.VIEW
        )
        
        result1 = crud.create_permission(db_session, test_list.id, permission_data, test_user1.id)
        result2 = crud.create_permission(db_session, test_list.id, permission_data, test_user1.id)
        
        assert result1.id == result2.id
        
        # Verify only one permission exists
        permissions = crud.get_list_permissions(db_session, test_list.id, test_user1.id)
        assert len(permissions) == 1
    
    def test_share_nonexistent_list(self, db_session, test_user1, test_user2):
        """Test sharing nonexistent list."""
        permission_data = schemas.ListPermissionCreate(
            user_identifier="user2",
            permission_level=PermissionLevel.VIEW
        )
        
        with pytest.raises(HTTPException):
            crud.create_permission(db_session, 99999, permission_data, test_user1.id)


class TestUpdatePermission:
    """Tests for updating list permissions."""
    
    def test_update_permission_view_to_update(self, db_session, test_user1, test_list, test_permission_view):
        """Test upgrading permission from VIEW to UPDATE."""
        update_data = schemas.ListPermissionUpdate(
            permission_level=PermissionLevel.UPDATE
        )
        
        result = crud.update_permission(
            db_session,
            test_permission_view.id,
            update_data,
            test_user1.id
        )
        
        assert result.id == test_permission_view.id
        assert result.permission_level == PermissionLevel.UPDATE
    
    def test_update_permission_update_to_view(self, db_session, test_user1, test_list, test_permission_update):
        """Test downgrading permission from UPDATE to VIEW."""
        update_data = schemas.ListPermissionUpdate(
            permission_level=PermissionLevel.VIEW
        )
        
        result = crud.update_permission(
            db_session,
            test_permission_update.id,
            update_data,
            test_user1.id
        )
        
        assert result.permission_level == PermissionLevel.VIEW
    
    def test_update_permission_non_owner(self, db_session, test_user2, test_permission_view):
        """Test non-owner cannot update permission."""
        update_data = schemas.ListPermissionUpdate(
            permission_level=PermissionLevel.UPDATE
        )
        
        with pytest.raises(HTTPException) as exc_info:
            crud.update_permission(
                db_session,
                test_permission_view.id,
                update_data,
                test_user2.id
            )
        
        assert exc_info.value.status_code == 403
    
    def test_update_permission_shared_user_cannot_modify(self, db_session, test_user1, test_user2, test_user3, test_list, test_permission_update):
        """Test user with update permission cannot modify other permissions."""
        # Create permission for user3 (by the owner, user1)
        perm3 = crud.create_permission(
            db_session,
            test_list.id,
            schemas.ListPermissionCreate(
                user_identifier="user3",
                permission_level=PermissionLevel.VIEW
            ),
            test_user1.id  # Owner creates this permission
        )
        
        # Try to update as user2 (who has update permission but is not owner)
        update_data = schemas.ListPermissionUpdate(
            permission_level=PermissionLevel.UPDATE
        )
        
        with pytest.raises(HTTPException) as exc_info:
            crud.update_permission(db_session, perm3.id, update_data, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_update_nonexistent_permission(self, db_session, test_user1):
        """Test updating permission that doesn't exist."""
        update_data = schemas.ListPermissionUpdate(
            permission_level=PermissionLevel.UPDATE
        )
        
        with pytest.raises(HTTPException) as exc_info:
            crud.update_permission(db_session, 99999, update_data, test_user1.id)
        
        assert exc_info.value.status_code == 404
    
    def test_update_permission_maintains_other_fields(self, db_session, test_user1, test_list, test_permission_view):
        """Test updating permission doesn't change other fields."""
        original_user_id = test_permission_view.user_id
        original_list_id = test_permission_view.list_id
        original_shared_by = test_permission_view.shared_by
        original_shared_at = test_permission_view.shared_at
        
        update_data = schemas.ListPermissionUpdate(
            permission_level=PermissionLevel.UPDATE
        )
        
        result = crud.update_permission(
            db_session,
            test_permission_view.id,
            update_data,
            test_user1.id
        )
        
        assert result.user_id == original_user_id
        assert result.list_id == original_list_id
        assert result.shared_by == original_shared_by
        assert result.shared_at == original_shared_at


class TestDeletePermission:
    """Tests for deleting (revoking) list permissions."""
    
    def test_delete_permission_as_owner(self, db_session, test_user1, test_list, test_permission_view):
        """Test owner can delete permission."""
        permission_id = test_permission_view.id
        
        result = crud.delete_permission(db_session, permission_id, test_user1.id)
        
        assert result is True
        
        # Verify permission is deleted
        deleted = db_session.query(ListPermission).filter(
            ListPermission.id == permission_id
        ).first()
        assert deleted is None
    
    def test_delete_permission_revokes_access(self, db_session, test_user1, test_user2, test_list, test_permission_view):
        """Test deleting permission revokes user's access."""
        permission_id = test_permission_view.id
        
        # User2 can access list before deletion
        accessible = crud.get_list_by_id(db_session, test_list.id, test_user2.id)
        assert accessible is not None
        
        # Delete permission
        crud.delete_permission(db_session, permission_id, test_user1.id)
        
        # User2 can no longer access list
        with pytest.raises(HTTPException) as exc_info:
            crud.get_list_by_id(db_session, test_list.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_delete_permission_non_owner(self, db_session, test_user2, test_permission_view):
        """Test non-owner cannot delete permission."""
        with pytest.raises(HTTPException) as exc_info:
            crud.delete_permission(db_session, test_permission_view.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_delete_permission_shared_user_cannot_revoke(self, db_session, test_user1, test_user2, test_user3, test_list, test_permission_update):
        """Test user with update permission cannot revoke permissions."""
        # Create permission for user3 (by the owner, user1)
        perm3 = crud.create_permission(
            db_session,
            test_list.id,
            schemas.ListPermissionCreate(
                user_identifier="user3",
                permission_level=PermissionLevel.VIEW
            ),
            test_user1.id  # Owner creates this permission
        )
        
        # User2 (with update permission) tries to delete user3's permission
        with pytest.raises(HTTPException) as exc_info:
            crud.delete_permission(db_session, perm3.id, test_user2.id)
        
        assert exc_info.value.status_code == 403
    
    def test_delete_nonexistent_permission(self, db_session, test_user1):
        """Test deleting permission that doesn't exist."""
        with pytest.raises(HTTPException) as exc_info:
            crud.delete_permission(db_session, 99999, test_user1.id)
        
        assert exc_info.value.status_code == 404
    
    def test_delete_permission_does_not_affect_owner_access(self, db_session, test_user1, test_list, test_permission_view):
        """Test deleting a permission doesn't affect owner's access."""
        crud.delete_permission(db_session, test_permission_view.id, test_user1.id)
        
        # Owner can still access their list
        accessible = crud.get_list_by_id(db_session, test_list.id, test_user1.id)
        assert accessible is not None
        assert accessible.id == test_list.id
    
    def test_delete_multiple_permissions_independently(self, db_session, test_user1, test_user2, test_user3, test_list):
        """Test deleting one permission doesn't affect others."""
        # Share with user2 and user3
        perm2 = crud.create_permission(
            db_session,
            test_list.id,
            schemas.ListPermissionCreate(
                user_identifier="user2",
                permission_level=PermissionLevel.VIEW
            ),
            test_user1.id
        )
        
        perm3 = crud.create_permission(
            db_session,
            test_list.id,
            schemas.ListPermissionCreate(
                user_identifier="user3",
                permission_level=PermissionLevel.VIEW
            ),
            test_user1.id
        )
        
        # Delete user2's permission
        crud.delete_permission(db_session, perm2.id, test_user1.id)
        
        # User3 still has access
        accessible = crud.get_list_by_id(db_session, test_list.id, test_user3.id)
        assert accessible is not None
        
        # User2 no longer has access
        with pytest.raises(HTTPException):
            crud.get_list_by_id(db_session, test_list.id, test_user2.id)


class TestPermissionIntegration:
    """Integration tests for permission workflows."""
    
    def test_full_share_workflow(self, db_session, test_user1, test_user2, test_list):
        """Test complete sharing workflow: share, update, revoke."""
        # 1. Share with VIEW permission
        perm_data = schemas.ListPermissionCreate(
            user_identifier="user2",
            permission_level=PermissionLevel.VIEW
        )
        perm = crud.create_permission(db_session, test_list.id, perm_data, test_user1.id)
        assert perm.permission_level == PermissionLevel.VIEW
        
        # 2. User2 can view but not update
        todos = crud.get_list_todos(db_session, test_list.id, test_user2.id)
        assert todos is not None
        
        # 3. Upgrade to UPDATE permission
        update_data = schemas.ListPermissionUpdate(permission_level=PermissionLevel.UPDATE)
        updated_perm = crud.update_permission(db_session, perm.id, update_data, test_user1.id)
        assert updated_perm.permission_level == PermissionLevel.UPDATE
        
        # 4. User2 can now create todos
        todo_data = schemas.TodoCreate(
            name="Shared Todo",
            due_date=pytest.importorskip("datetime").date.today()
        )
        from datetime import date
        todo_data.due_date = date.today()
        new_todo = crud.create_todo(db_session, test_list.id, todo_data, test_user2.id)
        assert new_todo is not None
        
        # 5. Revoke permission
        crud.delete_permission(db_session, perm.id, test_user1.id)
        
        # 6. User2 no longer has access
        with pytest.raises(HTTPException):
            crud.get_list_by_id(db_session, test_list.id, test_user2.id)
    
    def test_permission_hierarchy(self, db_session, test_user1, test_user2, test_list):
        """Test that UPDATE permission includes VIEW capabilities."""
        # Share with UPDATE permission
        perm_data = schemas.ListPermissionCreate(
            user_identifier="user2",
            permission_level=PermissionLevel.UPDATE
        )
        crud.create_permission(db_session, test_list.id, perm_data, test_user1.id)
        
        # User2 can view (included in UPDATE)
        list_view = crud.get_list_by_id(db_session, test_list.id, test_user2.id)
        assert list_view is not None
        
        # User2 can also update todos
        from datetime import date
        todo_data = schemas.TodoCreate(
            name="Test Todo",
            due_date=date.today()
        )
        new_todo = crud.create_todo(db_session, test_list.id, todo_data, test_user2.id)
        assert new_todo is not None
