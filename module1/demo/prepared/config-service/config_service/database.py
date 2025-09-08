"""Database connection and management."""

import asyncio
import logging
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor
from typing import Generator, Dict, Any, List, Optional
import psycopg2
import psycopg2.pool
from psycopg2.extras import RealDictCursor
from pydantic_extra_types.ulid import ULID

from .settings import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages database connections and operations."""
    
    def __init__(self):
        """Initialize the database manager."""
        self.connection_pool: Optional[psycopg2.pool.ThreadedConnectionPool] = None
        self.executor: Optional[ThreadPoolExecutor] = None
    
    def initialize(self) -> None:
        """Initialize the database connection pool and executor."""
        try:
            self.connection_pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=settings.database_min_connections,
                maxconn=settings.database_max_connections,
                dsn=settings.database_url,
                cursor_factory=RealDictCursor
            )
            self.executor = ThreadPoolExecutor(max_workers=settings.database_max_connections)
            logger.info("Database connection pool initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database connection pool: {e}")
            raise
    
    def close(self) -> None:
        """Close the database connection pool and executor."""
        if self.connection_pool:
            self.connection_pool.closeall()
            logger.info("Database connection pool closed")
        
        if self.executor:
            self.executor.shutdown(wait=True)
            logger.info("Database executor shutdown")
    
    @contextmanager
    def get_connection(self) -> Generator[psycopg2.extensions.connection, None, None]:
        """Get a database connection from the pool."""
        if not self.connection_pool:
            raise RuntimeError("Database connection pool not initialized")
        
        connection = None
        try:
            connection = self.connection_pool.getconn()
            yield connection
        finally:
            if connection:
                self.connection_pool.putconn(connection)
    
    async def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """Execute a SELECT query and return results."""
        if not self.executor:
            raise RuntimeError("Database executor not initialized")
        
        def _execute():
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, params)
                    return cursor.fetchall()
        
        return await asyncio.get_event_loop().run_in_executor(self.executor, _execute)
    
    async def execute_command(self, command: str, params: Optional[tuple] = None) -> None:
        """Execute an INSERT, UPDATE, or DELETE command."""
        if not self.executor:
            raise RuntimeError("Database executor not initialized")
        
        def _execute():
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(command, params)
                    conn.commit()
        
        await asyncio.get_event_loop().run_in_executor(self.executor, _execute)
    
    async def execute_command_returning(self, command: str, params: Optional[tuple] = None) -> Dict[str, Any]:
        """Execute an INSERT or UPDATE command and return the result."""
        if not self.executor:
            raise RuntimeError("Database executor not initialized")
        
        def _execute():
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(command, params)
                    result = cursor.fetchone()
                    conn.commit()
                    return result
        
        return await asyncio.get_event_loop().run_in_executor(self.executor, _execute)


# Global database manager instance
db_manager = DatabaseManager()
