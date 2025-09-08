# Config Service

A REST Web API for managing application configurations built with FastAPI, PostgreSQL, and Python.

## Features

- **RESTful API** for managing applications and their configurations
- **PostgreSQL** database with JSONB support for flexible configuration storage
- **Database migrations** system for schema management
- **Connection pooling** for optimal database performance
- **Comprehensive testing** with pytest
- **Type safety** with Pydantic models and type hints
- **ULID** primary keys for better performance and sortability

## Tech Stack

- **Language**: Python 3.13.5
- **Web Framework**: FastAPI 0.116.1
- **Validation**: Pydantic 2.11.7
- **Database**: PostgreSQL v16
- **DB Adapter**: psycopg2 2.9.10
- **Testing**: pytest 8.4.1
- **HTTP Client**: httpx 0.28.1

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Applications

- `POST /applications` - Create a new application
- `GET /applications/{id}` - Get application by ID
- `GET /applications` - Get all applications
- `PUT /applications/{id}` - Update an application

### Configurations

- `POST /configurations` - Create a new configuration
- `GET /configurations/{id}` - Get configuration by ID
- `PUT /configurations/{id}` - Update a configuration

### Health Check

- `GET /health` - Health check endpoint

## Data Models

### Application
- `id`: ULID (Primary Key)
- `name`: String (256 chars, unique)
- `comments`: String (1024 chars, optional)

### Configuration
- `id`: ULID (Primary Key)
- `application_id`: ULID (Foreign Key)
- `name`: String (256 chars, unique per application)
- `comments`: String (1024 chars, optional)
- `config`: JSONB (Key-value configuration data)

## Quick Start

### Prerequisites

- Python 3.13.5+
- PostgreSQL 16+
- uv (for dependency management)

### Installation

1. Clone the repository and navigate to the config-service directory:
```bash
cd config-service
```

2. Set up the development environment:
```bash
make dev-setup
```

3. Edit the `.env` file with your database configuration:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/config_service
```

4. Install dependencies:
```bash
make install
```

5. Run database migrations:
```bash
make migrate
```

6. Start the development server:
```bash
make run
```

The API will be available at `http://localhost:8000` with interactive documentation at `http://localhost:8000/docs`.

## Development

### Available Make Commands

```bash
make help           # Show available commands
make install        # Install dependencies
make test           # Run tests
make test-coverage  # Run tests with coverage
make run            # Run development server
make run-prod       # Run production server
make migrate        # Run database migrations
make migrate-status # Check migration status
make clean          # Clean temporary files
make lint           # Run linting
make format         # Format code
make dev-setup      # Set up development environment
```

### Running Tests

```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Run specific test file
uv run python -m pytest config_service/models_test.py -v
```

### Database Migrations

The project includes a custom migration system:

```bash
# Run pending migrations
make migrate

# Check migration status
make migrate-status
```

Migration files are stored in the `migrations/` directory and follow the naming convention: `{version}_{description}.sql`.

### Code Quality

```bash
# Format code
make format

# Run linting
make lint
```

## Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and adjust the values:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/config_service
DATABASE_MIN_CONNECTIONS=1
DATABASE_MAX_CONNECTIONS=20

# Application Configuration
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
DEBUG=false

# API Configuration
API_PREFIX=/api/v1
```

## API Usage Examples

### Create an Application

```bash
curl -X POST "http://localhost:8000/api/v1/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-web-app",
    "comments": "Main web application"
  }'
```

### Create a Configuration

```bash
curl -X POST "http://localhost:8000/api/v1/configurations" \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "name": "database",
    "comments": "Database configuration",
    "config": {
      "host": "localhost",
      "port": 5432,
      "database": "myapp",
      "pool_size": 10
    }
  }'
```

### Get All Applications

```bash
curl "http://localhost:8000/api/v1/applications"
```

### Get Configuration by ID

```bash
curl "http://localhost:8000/api/v1/configurations/01ARZ3NDEKTSV4RRFFQ69G5FAV"
```

## Architecture

The application follows a layered architecture:

- **API Layer** (`routers/`): FastAPI routers handling HTTP requests
- **Service Layer** (`repositories/`): Business logic and data access
- **Data Layer** (`database.py`): Database connection and query execution
- **Models** (`models.py`): Pydantic models for validation and serialization
- **Configuration** (`settings.py`): Application settings and environment variables

## Database Schema

The database uses PostgreSQL with the following tables:

- `migrations`: Tracks applied database migrations
- `applications`: Stores application metadata
- `configurations`: Stores configuration data with JSONB for flexible key-value storage

Indexes are created for optimal query performance, including GIN indexes on JSONB columns.

## Testing

The project includes comprehensive unit tests for all modules:

- `settings_test.py`: Tests for configuration settings
- `models_test.py`: Tests for Pydantic models
- `migrations_test.py`: Tests for migration system
- Additional test files for repositories and API endpoints

Tests use pytest with mocking for database operations and external dependencies.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite and ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
