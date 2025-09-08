"""Pydantic models for API requests and responses."""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from pydantic_extra_types.ulid import ULID


class ApplicationBase(BaseModel):
    """Base model for Application."""
    name: str = Field(..., max_length=256, description="Application name")
    comments: Optional[str] = Field(None, max_length=1024, description="Application comments")


class ApplicationCreate(ApplicationBase):
    """Model for creating a new application."""
    pass


class ApplicationUpdate(ApplicationBase):
    """Model for updating an existing application."""
    pass


class Application(ApplicationBase):
    """Model for application response."""
    id: ULID = Field(..., description="Application ID")
    
    model_config = ConfigDict(from_attributes=True)


class ConfigurationBase(BaseModel):
    """Base model for Configuration."""
    application_id: ULID = Field(..., description="Application ID")
    name: str = Field(..., max_length=256, description="Configuration name")
    comments: Optional[str] = Field(None, max_length=1024, description="Configuration comments")
    config: Dict[str, Any] = Field(..., description="Configuration key-value pairs")


class ConfigurationCreate(ConfigurationBase):
    """Model for creating a new configuration."""
    pass


class ConfigurationUpdate(ConfigurationBase):
    """Model for updating an existing configuration."""
    pass


class Configuration(ConfigurationBase):
    """Model for configuration response."""
    id: ULID = Field(..., description="Configuration ID")
    
    model_config = ConfigDict(from_attributes=True)
