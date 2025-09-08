"""Database migration system."""

import logging
import os
from pathlib import Path
from typing import List, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

from .settings import settings

logger = logging.getLogger(__name__)


class MigrationManager:
    """Manages database migrations."""
    
    def __init__(self, migrations_dir: str = "migrations"):
        """Initialize the migration manager."""
        self.migrations_dir = Path(migrations_dir)
        self.connection_string = settings.database_url
    
    def get_connection(self) -> psycopg2.extensions.connection:
        """Get a database connection."""
        return psycopg2.connect(self.connection_string, cursor_factory=RealDictCursor)
    
    def get_applied_migrations(self) -> List[str]:
        """Get list of applied migration versions."""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    # First, ensure migrations table exists
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS migrations (
                            id SERIAL PRIMARY KEY,
                            version VARCHAR(255) NOT NULL UNIQUE,
                            description TEXT,
                            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )
                    """)
                    conn.commit()
                    
                    # Get applied migrations
                    cursor.execute("SELECT version FROM migrations ORDER BY version")
                    return [row['version'] for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Failed to get applied migrations: {e}")
            raise
    
    def get_available_migrations(self) -> List[Dict[str, str]]:
        """Get list of available migration files."""
        migrations = []
        if not self.migrations_dir.exists():
            logger.warning(f"Migrations directory {self.migrations_dir} does not exist")
            return migrations
        
        for file_path in sorted(self.migrations_dir.glob("*.sql")):
            version = file_path.stem.split('_')[0]
            description = '_'.join(file_path.stem.split('_')[1:])
            migrations.append({
                'version': version,
                'description': description,
                'file_path': str(file_path)
            })
        
        return migrations
    
    def apply_migration(self, migration: Dict[str, str]) -> None:
        """Apply a single migration."""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    # Read migration file
                    with open(migration['file_path'], 'r') as f:
                        sql_content = f.read()
                    
                    # Execute migration
                    cursor.execute(sql_content)
                    
                    # Record migration as applied (if not already recorded by the migration itself)
                    cursor.execute("""
                        INSERT INTO migrations (version, description) 
                        VALUES (%s, %s)
                        ON CONFLICT (version) DO NOTHING
                    """, (migration['version'], migration['description']))
                    
                    conn.commit()
                    logger.info(f"Applied migration {migration['version']}: {migration['description']}")
        except Exception as e:
            logger.error(f"Failed to apply migration {migration['version']}: {e}")
            raise
    
    def run_migrations(self) -> None:
        """Run all pending migrations."""
        applied_migrations = set(self.get_applied_migrations())
        available_migrations = self.get_available_migrations()
        
        pending_migrations = [
            migration for migration in available_migrations
            if migration['version'] not in applied_migrations
        ]
        
        if not pending_migrations:
            logger.info("No pending migrations to apply")
            return
        
        logger.info(f"Applying {len(pending_migrations)} pending migrations")
        
        for migration in pending_migrations:
            self.apply_migration(migration)
        
        logger.info("All migrations applied successfully")
    
    def get_migration_status(self) -> Dict[str, Any]:
        """Get current migration status."""
        applied_migrations = set(self.get_applied_migrations())
        available_migrations = self.get_available_migrations()
        
        pending_migrations = [
            migration for migration in available_migrations
            if migration['version'] not in applied_migrations
        ]
        
        return {
            'applied_count': len(applied_migrations),
            'available_count': len(available_migrations),
            'pending_count': len(pending_migrations),
            'applied_migrations': sorted(list(applied_migrations)),
            'pending_migrations': [m['version'] for m in pending_migrations]
        }


# Global migration manager instance
migration_manager = MigrationManager()
