"""Data access layer for applications and configurations."""

import json
from typing import List, Optional, Dict, Any
from pydantic_extra_types.ulid import ULID
from ulid import ULID as ULIDGenerator

from .database import db_manager
from .models import Application, ApplicationCreate, ApplicationUpdate
from .models import Configuration, ConfigurationCreate, ConfigurationUpdate


class ApplicationRepository:
    """Repository for application data access."""
    
    async def create(self, application_data: ApplicationCreate) -> Application:
        """Create a new application."""
        app_id = str(ULIDGenerator())
        
        query = """
            INSERT INTO applications (id, name, comments)
            VALUES (%s, %s, %s)
            RETURNING id, name, comments
        """
        
        result = await db_manager.execute_command_returning(
            query, (app_id, application_data.name, application_data.comments)
        )
        
        return Application(
            id=ULID(result['id']),
            name=result['name'],
            comments=result['comments']
        )
    
    async def get_by_id(self, app_id: ULID) -> Optional[Application]:
        """Get application by ID."""
        query = "SELECT id, name, comments FROM applications WHERE id = %s"
        
        results = await db_manager.execute_query(query, (str(app_id),))
        
        if not results:
            return None
        
        result = results[0]
        return Application(
            id=ULID(result['id']),
            name=result['name'],
            comments=result['comments']
        )
    
    async def get_all(self) -> List[Application]:
        """Get all applications."""
        query = "SELECT id, name, comments FROM applications ORDER BY name"
        
        results = await db_manager.execute_query(query)
        
        return [
            Application(
                id=ULID(result['id']),
                name=result['name'],
                comments=result['comments']
            )
            for result in results
        ]
    
    async def update(self, app_id: ULID, application_data: ApplicationUpdate) -> Optional[Application]:
        """Update an application."""
        query = """
            UPDATE applications 
            SET name = %s, comments = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, name, comments
        """
        
        result = await db_manager.execute_command_returning(
            query, (application_data.name, application_data.comments, str(app_id))
        )
        
        if not result:
            return None
        
        return Application(
            id=ULID(result['id']),
            name=result['name'],
            comments=result['comments']
        )
    
    async def delete(self, app_id: ULID) -> bool:
        """Delete an application."""
        query = "DELETE FROM applications WHERE id = %s"
        
        try:
            await db_manager.execute_command(query, (str(app_id),))
            return True
        except Exception:
            return False


class ConfigurationRepository:
    """Repository for configuration data access."""
    
    async def create(self, config_data: ConfigurationCreate) -> Configuration:
        """Create a new configuration."""
        config_id = str(ULIDGenerator())
        
        query = """
            INSERT INTO configurations (id, application_id, name, comments, config)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, application_id, name, comments, config
        """
        
        result = await db_manager.execute_command_returning(
            query, (
                config_id,
                str(config_data.application_id),
                config_data.name,
                config_data.comments,
                json.dumps(config_data.config)
            )
        )
        
        return Configuration(
            id=ULID(result['id']),
            application_id=ULID(result['application_id']),
            name=result['name'],
            comments=result['comments'],
            config=result['config']
        )
    
    async def get_by_id(self, config_id: ULID) -> Optional[Configuration]:
        """Get configuration by ID."""
        query = """
            SELECT id, application_id, name, comments, config 
            FROM configurations 
            WHERE id = %s
        """
        
        results = await db_manager.execute_query(query, (str(config_id),))
        
        if not results:
            return None
        
        result = results[0]
        return Configuration(
            id=ULID(result['id']),
            application_id=ULID(result['application_id']),
            name=result['name'],
            comments=result['comments'],
            config=result['config']
        )
    
    async def get_by_application_id(self, app_id: ULID) -> List[Configuration]:
        """Get all configurations for an application."""
        query = """
            SELECT id, application_id, name, comments, config 
            FROM configurations 
            WHERE application_id = %s 
            ORDER BY name
        """
        
        results = await db_manager.execute_query(query, (str(app_id),))
        
        return [
            Configuration(
                id=ULID(result['id']),
                application_id=ULID(result['application_id']),
                name=result['name'],
                comments=result['comments'],
                config=result['config']
            )
            for result in results
        ]
    
    async def update(self, config_id: ULID, config_data: ConfigurationUpdate) -> Optional[Configuration]:
        """Update a configuration."""
        query = """
            UPDATE configurations 
            SET application_id = %s, name = %s, comments = %s, config = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, application_id, name, comments, config
        """
        
        result = await db_manager.execute_command_returning(
            query, (
                str(config_data.application_id),
                config_data.name,
                config_data.comments,
                json.dumps(config_data.config),
                str(config_id)
            )
        )
        
        if not result:
            return None
        
        return Configuration(
            id=ULID(result['id']),
            application_id=ULID(result['application_id']),
            name=result['name'],
            comments=result['comments'],
            config=result['config']
        )
    
    async def delete(self, config_id: ULID) -> bool:
        """Delete a configuration."""
        query = "DELETE FROM configurations WHERE id = %s"
        
        try:
            await db_manager.execute_command(query, (str(config_id),))
            return True
        except Exception:
            return False


# Global repository instances
application_repository = ApplicationRepository()
configuration_repository = ConfigurationRepository()
