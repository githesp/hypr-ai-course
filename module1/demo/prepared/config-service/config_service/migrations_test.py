"""Tests for migrations module."""

import pytest
from unittest.mock import Mock, MagicMock, patch, mock_open
from pathlib import Path
from psycopg2.extras import RealDictCursor

from .migrations import MigrationManager


class TestMigrationManager:
    """Test cases for MigrationManager class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.migration_manager = MigrationManager("test_migrations")
    
    @patch('config_service.migrations.psycopg2.connect')
    def test_get_connection(self, mock_connect):
        """Test database connection creation."""
        mock_conn = Mock()
        mock_connect.return_value = mock_conn
        
        connection = self.migration_manager.get_connection()
        
        mock_connect.assert_called_once_with(
            self.migration_manager.connection_string,
            cursor_factory=RealDictCursor
        )
        assert connection == mock_conn
    
    @patch('config_service.migrations.psycopg2.connect')
    def test_get_applied_migrations_empty(self, mock_connect):
        """Test getting applied migrations when none exist."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_cursor.fetchall.return_value = []
        mock_connect.return_value = mock_conn
        
        applied = self.migration_manager.get_applied_migrations()
        
        assert applied == []
        mock_cursor.execute.assert_any_call("""
                        CREATE TABLE IF NOT EXISTS migrations (
                            id SERIAL PRIMARY KEY,
                            version VARCHAR(255) NOT NULL UNIQUE,
                            description TEXT,
                            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )
                    """)
        mock_cursor.execute.assert_any_call("SELECT version FROM migrations ORDER BY version")
    
    @patch('config_service.migrations.psycopg2.connect')
    def test_get_applied_migrations_with_data(self, mock_connect):
        """Test getting applied migrations with existing data."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [
            {'version': '001'},
            {'version': '002'}
        ]
        mock_connect.return_value = mock_conn
        
        applied = self.migration_manager.get_applied_migrations()
        
        assert applied == ['001', '002']
    
    def test_get_available_migrations_no_directory(self):
        """Test getting available migrations when directory doesn't exist."""
        with patch.object(Path, 'exists', return_value=False):
            migrations = self.migration_manager.get_available_migrations()
            assert migrations == []
    
    def test_get_available_migrations_with_files(self):
        """Test getting available migrations with files."""
        # Create mock Path objects that can be sorted
        mock_file1 = MagicMock()
        mock_file1.stem = '001_initial_schema'
        mock_file1.__str__ = MagicMock(return_value='/path/001_initial_schema.sql')
        mock_file1.__lt__ = lambda self, other: self.stem < other.stem
        
        mock_file2 = MagicMock()
        mock_file2.stem = '002_add_indexes'
        mock_file2.__str__ = MagicMock(return_value='/path/002_add_indexes.sql')
        mock_file2.__lt__ = lambda self, other: self.stem < other.stem
        
        mock_files = [mock_file2, mock_file1]  # Intentionally out of order to test sorting
        
        with patch.object(Path, 'exists', return_value=True), \
             patch.object(Path, 'glob', return_value=mock_files):
            
            migrations = self.migration_manager.get_available_migrations()
            
            assert len(migrations) == 2
            assert migrations[0]['version'] == '001'
            assert migrations[0]['description'] == 'initial_schema'
            assert migrations[1]['version'] == '002'
            assert migrations[1]['description'] == 'add_indexes'
    
    @patch('config_service.migrations.psycopg2.connect')
    @patch('builtins.open', new_callable=mock_open, read_data="CREATE TABLE test;")
    def test_apply_migration_success(self, mock_file, mock_connect):
        """Test successful migration application."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_connect.return_value = mock_conn
        
        migration = {
            'version': '001',
            'description': 'test_migration',
            'file_path': '/path/to/001_test_migration.sql'
        }
        
        self.migration_manager.apply_migration(migration)
        
        mock_file.assert_called_once_with('/path/to/001_test_migration.sql', 'r')
        mock_cursor.execute.assert_any_call("CREATE TABLE test;")
        mock_cursor.execute.assert_any_call("""
                        INSERT INTO migrations (version, description) 
                        VALUES (%s, %s)
                        ON CONFLICT (version) DO NOTHING
                    """, ('001', 'test_migration'))
        mock_conn.commit.assert_called()
    
    @patch('config_service.migrations.psycopg2.connect')
    def test_apply_migration_failure(self, mock_connect):
        """Test migration application failure."""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_cursor.execute.side_effect = Exception("Database error")
        mock_connect.return_value = mock_conn
        
        migration = {
            'version': '001',
            'description': 'test_migration',
            'file_path': '/path/to/001_test_migration.sql'
        }
        
        with patch('builtins.open', mock_open(read_data="CREATE TABLE test;")):
            with pytest.raises(Exception, match="Database error"):
                self.migration_manager.apply_migration(migration)
    
    def test_run_migrations_no_pending(self):
        """Test running migrations when none are pending."""
        with patch.object(self.migration_manager, 'get_applied_migrations', return_value=['001']), \
             patch.object(self.migration_manager, 'get_available_migrations', return_value=[
                 {'version': '001', 'description': 'initial', 'file_path': '/path/001.sql'}
             ]):
            
            self.migration_manager.run_migrations()
            # Should complete without error and not apply any migrations
    
    def test_run_migrations_with_pending(self):
        """Test running migrations with pending migrations."""
        with patch.object(self.migration_manager, 'get_applied_migrations', return_value=['001']), \
             patch.object(self.migration_manager, 'get_available_migrations', return_value=[
                 {'version': '001', 'description': 'initial', 'file_path': '/path/001.sql'},
                 {'version': '002', 'description': 'add_indexes', 'file_path': '/path/002.sql'}
             ]), \
             patch.object(self.migration_manager, 'apply_migration') as mock_apply:
            
            self.migration_manager.run_migrations()
            
            mock_apply.assert_called_once_with({
                'version': '002',
                'description': 'add_indexes',
                'file_path': '/path/002.sql'
            })
    
    def test_get_migration_status(self):
        """Test getting migration status."""
        with patch.object(self.migration_manager, 'get_applied_migrations', return_value=['001', '002']), \
             patch.object(self.migration_manager, 'get_available_migrations', return_value=[
                 {'version': '001', 'description': 'initial', 'file_path': '/path/001.sql'},
                 {'version': '002', 'description': 'add_indexes', 'file_path': '/path/002.sql'},
                 {'version': '003', 'description': 'add_data', 'file_path': '/path/003.sql'}
             ]):
            
            status = self.migration_manager.get_migration_status()
            
            assert status['applied_count'] == 2
            assert status['available_count'] == 3
            assert status['pending_count'] == 1
            assert status['applied_migrations'] == ['001', '002']
            assert status['pending_migrations'] == ['003']
