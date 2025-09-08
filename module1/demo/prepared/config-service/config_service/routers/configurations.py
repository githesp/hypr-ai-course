"""API endpoints for configurations."""

from typing import List
from fastapi import APIRouter, HTTPException, status

from ..models import Configuration, ConfigurationCreate, ConfigurationUpdate
from ..repositories import configuration_repository

router = APIRouter(prefix="/configurations", tags=["configurations"])


@router.post("/", response_model=Configuration, status_code=status.HTTP_201_CREATED)
async def create_configuration(config_data: ConfigurationCreate) -> Configuration:
    """Create a new configuration."""
    try:
        return await configuration_repository.create(config_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create configuration: {str(e)}"
        )


@router.get("/{config_id}", response_model=Configuration)
async def get_configuration(config_id: str) -> Configuration:
    """Get a configuration by ID."""
    configuration = await configuration_repository.get_by_id(config_id)
    
    if not configuration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
    
    return configuration


@router.put("/{config_id}", response_model=Configuration)
async def update_configuration(config_id: str, config_data: ConfigurationUpdate) -> Configuration:
    """Update a configuration."""
    configuration = await configuration_repository.update(config_id, config_data)
    
    if not configuration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
    
    return configuration


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_configuration(config_id: str) -> None:
    """Delete a configuration."""
    success = await configuration_repository.delete(config_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
