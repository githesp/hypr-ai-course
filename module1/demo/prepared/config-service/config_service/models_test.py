"""Tests for models module."""

import pytest
from pydantic import ValidationError
from pydantic_extra_types.ulid import ULID
from ulid import ULID as ULIDGenerator

from .models import (
    ApplicationBase, ApplicationCreate, ApplicationUpdate, Application,
    ConfigurationBase, ConfigurationCreate, ConfigurationUpdate, Configuration
)


class TestApplicationModels:
    """Test cases for Application models."""
    
    def test_application_base_valid(self):
        """Test ApplicationBase with valid data."""
        app_data = ApplicationBase(
            name="test-app",
            comments="Test application"
        )
        assert app_data.name == "test-app"
        assert app_data.comments == "Test application"
    
    def test_application_base_without_comments(self):
        """Test ApplicationBase without comments."""
        app_data = ApplicationBase(name="test-app")
        assert app_data.name == "test-app"
        assert app_data.comments is None
    
    def test_application_base_name_too_long(self):
        """Test ApplicationBase with name too long."""
        with pytest.raises(ValidationError) as exc_info:
            ApplicationBase(name="x" * 257)
        
        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]['type'] == 'string_too_long'
        assert 'name' in errors[0]['loc']
    
    def test_application_base_comments_too_long(self):
        """Test ApplicationBase with comments too long."""
        with pytest.raises(ValidationError) as exc_info:
            ApplicationBase(name="test-app", comments="x" * 1025)
        
        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]['type'] == 'string_too_long'
        assert 'comments' in errors[0]['loc']
    
    def test_application_create_inheritance(self):
        """Test ApplicationCreate inherits from ApplicationBase."""
        app_data = ApplicationCreate(name="test-app", comments="Test")
        assert isinstance(app_data, ApplicationBase)
        assert app_data.name == "test-app"
        assert app_data.comments == "Test"
    
    def test_application_update_inheritance(self):
        """Test ApplicationUpdate inherits from ApplicationBase."""
        app_data = ApplicationUpdate(name="updated-app")
        assert isinstance(app_data, ApplicationBase)
        assert app_data.name == "updated-app"
        assert app_data.comments is None
    
    def test_application_with_id(self):
        """Test Application model with ID."""
        test_ulid_str = str(ULIDGenerator())
        app = Application(
            id=test_ulid_str,
            name="test-app",
            comments="Test application"
        )
        assert str(app.id) == test_ulid_str
        assert app.name == "test-app"
        assert app.comments == "Test application"


class TestConfigurationModels:
    """Test cases for Configuration models."""
    
    def test_configuration_base_valid(self):
        """Test ConfigurationBase with valid data."""
        app_id_str = str(ULIDGenerator())
        config_data = ConfigurationBase(
            application_id=app_id_str,
            name="database",
            comments="Database configuration",
            config={"host": "localhost", "port": 5432}
        )
        assert str(config_data.application_id) == app_id_str
        assert config_data.name == "database"
        assert config_data.comments == "Database configuration"
        assert config_data.config == {"host": "localhost", "port": 5432}
    
    def test_configuration_base_without_comments(self):
        """Test ConfigurationBase without comments."""
        app_id_str = str(ULIDGenerator())
        config_data = ConfigurationBase(
            application_id=app_id_str,
            name="api",
            config={"timeout": 30}
        )
        assert str(config_data.application_id) == app_id_str
        assert config_data.name == "api"
        assert config_data.comments is None
        assert config_data.config == {"timeout": 30}
    
    def test_configuration_base_name_too_long(self):
        """Test ConfigurationBase with name too long."""
        app_id_str = str(ULIDGenerator())
        with pytest.raises(ValidationError) as exc_info:
            ConfigurationBase(
                application_id=app_id_str,
                name="x" * 257,
                config={}
            )
        
        errors = exc_info.value.errors()
        # Should have only the name validation error
        name_errors = [e for e in errors if 'name' in e['loc']]
        assert len(name_errors) == 1
        assert name_errors[0]['type'] == 'string_too_long'
    
    def test_configuration_base_comments_too_long(self):
        """Test ConfigurationBase with comments too long."""
        app_id_str = str(ULIDGenerator())
        with pytest.raises(ValidationError) as exc_info:
            ConfigurationBase(
                application_id=app_id_str,
                name="test-config",
                comments="x" * 1025,
                config={}
            )
        
        errors = exc_info.value.errors()
        # Should have only the comments validation error
        comment_errors = [e for e in errors if 'comments' in e['loc']]
        assert len(comment_errors) == 1
        assert comment_errors[0]['type'] == 'string_too_long'
    
    def test_configuration_base_missing_required_fields(self):
        """Test ConfigurationBase with missing required fields."""
        with pytest.raises(ValidationError) as exc_info:
            ConfigurationBase()
        
        errors = exc_info.value.errors()
        assert len(errors) == 3  # application_id, name, config
        error_fields = {error['loc'][0] for error in errors}
        assert 'application_id' in error_fields
        assert 'name' in error_fields
        assert 'config' in error_fields
    
    def test_configuration_create_inheritance(self):
        """Test ConfigurationCreate inherits from ConfigurationBase."""
        app_id_str = str(ULIDGenerator())
        config_data = ConfigurationCreate(
            application_id=app_id_str,
            name="test-config",
            config={"key": "value"}
        )
        assert isinstance(config_data, ConfigurationBase)
        assert str(config_data.application_id) == app_id_str
        assert config_data.name == "test-config"
        assert config_data.config == {"key": "value"}
    
    def test_configuration_update_inheritance(self):
        """Test ConfigurationUpdate inherits from ConfigurationBase."""
        app_id_str = str(ULIDGenerator())
        config_data = ConfigurationUpdate(
            application_id=app_id_str,
            name="updated-config",
            config={"updated": True}
        )
        assert isinstance(config_data, ConfigurationBase)
        assert str(config_data.application_id) == app_id_str
        assert config_data.name == "updated-config"
        assert config_data.config == {"updated": True}
    
    def test_configuration_with_id(self):
        """Test Configuration model with ID."""
        config_id_str = str(ULIDGenerator())
        app_id_str = str(ULIDGenerator())
        config = Configuration(
            id=config_id_str,
            application_id=app_id_str,
            name="test-config",
            comments="Test configuration",
            config={"test": True}
        )
        assert str(config.id) == config_id_str
        assert str(config.application_id) == app_id_str
        assert config.name == "test-config"
        assert config.comments == "Test configuration"
        assert config.config == {"test": True}
    
    def test_configuration_complex_config_data(self):
        """Test Configuration with complex config data."""
        app_id_str = str(ULIDGenerator())
        complex_config = {
            "database": {
                "host": "localhost",
                "port": 5432,
                "credentials": {
                    "username": "user",
                    "password": "pass"
                }
            },
            "features": ["feature1", "feature2"],
            "settings": {
                "debug": True,
                "timeout": 30.5
            }
        }
        
        config_data = ConfigurationBase(
            application_id=app_id_str,
            name="complex-config",
            config=complex_config
        )
        
        assert config_data.config == complex_config
        assert config_data.config["database"]["port"] == 5432
        assert config_data.config["features"] == ["feature1", "feature2"]
        assert config_data.config["settings"]["timeout"] == 30.5
