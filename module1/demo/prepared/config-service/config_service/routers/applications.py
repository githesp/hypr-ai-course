"""API endpoints for applications."""

from typing import List
from fastapi import APIRouter, HTTPException, status

from ..models import Application, ApplicationCreate, ApplicationUpdate
from ..repositories import application_repository

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("/", response_model=Application, status_code=status.HTTP_201_CREATED)
async def create_application(application_data: ApplicationCreate) -> Application:
    """Create a new application."""
    try:
        return await application_repository.create(application_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create application: {str(e)}"
        )


@router.get("/{app_id}", response_model=Application)
async def get_application(app_id: str) -> Application:
    """Get an application by ID."""
    application = await application_repository.get_by_id(app_id)
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    return application


@router.get("/", response_model=List[Application])
async def get_applications() -> List[Application]:
    """Get all applications."""
    return await application_repository.get_all()


@router.put("/{app_id}", response_model=Application)
async def update_application(app_id: str, application_data: ApplicationUpdate) -> Application:
    """Update an application."""
    application = await application_repository.update(app_id, application_data)
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    return application


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(app_id: str) -> None:
    """Delete an application."""
    success = await application_repository.delete(app_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
