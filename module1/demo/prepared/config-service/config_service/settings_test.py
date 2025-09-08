"""Tests for settings module."""

import pytest
from unittest.mock import patch
from pydantic import ValidationError

from .settings import Settings


class TestSettings:
    """Test cases for Settings class."""
    
    def test_settings_with_required_fields(self):
        """Test settings creation with required fields."""
        with patch.dict('os.environ', {
            'DATABASE_URL': 'postgresql://user:pass@localhost:5432/testdb'
        }, clear=True):
            # Create a new Settings instance with no env file to avoid loading .env
            class TestSettings(Settings):
                model_config = Settings.model_config.copy()
                model_config.update({"env_file": None})
            
            settings = TestSettings()
            assert settings.database_url == 'postgresql://user:pass@localhost:5432/testdb'
            assert settings.database_min_connections == 1
            assert settings.database_max_connections == 20
            assert settings.log_level == 'INFO'
            assert settings.host == '0.0.0.0'
            assert settings.port == 8000
            assert settings.debug is False
            assert settings.api_prefix == '/api/v1'
    
    def test_settings_with_custom_values(self):
        """Test settings with custom environment values."""
        with patch.dict('os.environ', {
            'DATABASE_URL': 'postgresql://custom:pass@localhost:5432/customdb',
            'DATABASE_MIN_CONNECTIONS': '5',
            'DATABASE_MAX_CONNECTIONS': '50',
            'LOG_LEVEL': 'DEBUG',
            'HOST': '127.0.0.1',
            'PORT': '9000',
            'DEBUG': 'true',
            'API_PREFIX': '/api/v2'
        }):
            settings = Settings()
            assert settings.database_url == 'postgresql://custom:pass@localhost:5432/customdb'
            assert settings.database_min_connections == 5
            assert settings.database_max_connections == 50
            assert settings.log_level == 'DEBUG'
            assert settings.host == '127.0.0.1'
            assert settings.port == 9000
            assert settings.debug is True
            assert settings.api_prefix == '/api/v2'
    
    def test_settings_missing_required_field(self):
        """Test settings validation with missing required field."""
        with patch.dict('os.environ', {}, clear=True):
            # Also need to patch the Settings class to not use .env file
            with patch.object(Settings, 'model_config', {'env_file': None}):
                with pytest.raises(ValidationError) as exc_info:
                    Settings()
                
                errors = exc_info.value.errors()
                assert len(errors) == 1
                assert errors[0]['type'] == 'missing'
                assert 'database_url' in errors[0]['loc']
    
    def test_settings_invalid_port(self):
        """Test settings validation with invalid port."""
        with patch.dict('os.environ', {
            'DATABASE_URL': 'postgresql://user:pass@localhost:5432/testdb',
            'PORT': 'invalid_port'
        }):
            with pytest.raises(ValidationError) as exc_info:
                Settings()
            
            errors = exc_info.value.errors()
            assert len(errors) == 1
            assert errors[0]['type'] == 'int_parsing'
            assert 'port' in errors[0]['loc']
    
    def test_settings_case_insensitive(self):
        """Test that settings are case insensitive."""
        with patch.dict('os.environ', {
            'database_url': 'postgresql://user:pass@localhost:5432/testdb',
            'log_level': 'warning'
        }):
            settings = Settings()
            assert settings.database_url == 'postgresql://user:pass@localhost:5432/testdb'
            assert settings.log_level == 'warning'
