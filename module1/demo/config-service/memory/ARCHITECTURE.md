# Configuration Service Architecture

## Service Architecture

### System Overview
The Configuration Service is a REST API built with TypeScript and Express.js, designed to provide centralized configuration management for applications using PostgreSQL as the data store.

### Core Components

#### API Layer
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful HTTP API with consistent endpoint structure
- **Middleware Stack**:
  - Helmet for security headers
  - CORS for cross-origin requests
  - Express JSON/URL-encoded body parsing
  - Request logging with Winston
  - Input validation with express-validator
- **Error Handling**: Global error handler with environment-specific stack traces

#### Database Layer
- **Database**: PostgreSQL with traditional relational schema
- **Connection Management**:
  - Connection pooling using pg library
  - Configurable pool size (max 20 connections)
  - Environment-based connection parameters
  - Helper functions for query execution
- **Schema Design**: Normalized relational structure with foreign key constraints

#### Controller Layer
1. **ApplicationController**
   - Handles CRUD operations for applications
   - Input validation and response formatting
   - Error handling for business logic

2. **ConfigurationController**
   - Manages configuration key-value pairs
   - Environment-specific configuration handling
   - Application-specific configuration retrieval

#### Model Layer
- **TypeScript Interfaces**: Strongly typed data models
- **Request/Response Types**: Separate interfaces for API contracts
- **Database Types**: Interfaces matching PostgreSQL schema

#### Route Layer
- **Modular Routing**: Separate route files for applications and configurations
- **Middleware Integration**: Validation and error handling per route
- **RESTful Design**: Standard HTTP methods and status codes

### Key Technical Decisions
- **TypeScript Over JavaScript**: Full type safety and better developer experience
- **Express.js**: Lightweight, flexible web framework
- **PostgreSQL**: Robust, ACID-compliant database
- **Connection Pooling**: Efficient database connection management
- **Winston Logging**: Structured logging with multiple transports
- **express-validator**: Server-side input validation
- **MVC Pattern**: Separation of concerns with models, views (routes), controllers

### Database Schema
- **applications** table
  - Primary key with SERIAL auto-increment
  - Unique constraint on name
  - Optional description field
  - Automatic timestamp tracking

- **configurations** table
  - Primary key with SERIAL auto-increment
  - Foreign key to applications with CASCADE delete
  - Composite unique constraint (application_id, key, environment)
  - Environment field for multi-environment support
  - Automatic timestamp tracking

### API Endpoints
- `POST /api/applications` - Create application
- `PUT /api/applications/{id}` - Update application
- `GET /api/applications/{id}` - Get application by ID
- `GET /api/applications` - List all applications
- `POST /api/configurations` - Create configuration
- `PUT /api/configurations/{id}` - Update configuration
- `GET /api/configurations/{id}` - Get configuration by ID
- `GET /api/configurations/application/{applicationId}` - Get configurations by application
- `GET /health` - Health check endpoint

### Error Handling
- Consistent error response format
- HTTP status codes: 400 (validation), 404 (not found), 500 (server error)
- Validation error details from express-validator
- Development vs production error details
- Winston error logging

### Security Considerations
- Helmet for security headers
- CORS configuration
- Input validation and sanitization
- SQL injection prevention via parameterized queries
- Environment variable management for secrets

### Scalability Considerations
- Database connection pooling
- Stateless API design
- Horizontal scaling potential
- Database indexing on frequently queried fields
- Pagination for large result sets

### Development Workflow
- TypeScript compilation to JavaScript
- Jest testing framework with ts-jest
- Development server with ts-node
- Docker support for PostgreSQL
- Environment-based configuration
- Linting and formatting (implied by TypeScript)

### Deployment Architecture
- Node.js runtime environment
- PostgreSQL database (can be containerized)
- Environment variable configuration
- Docker Compose for local development
- Production build process with npm run build
- Static file serving capability (though not currently used)

This architecture provides a solid foundation for configuration management with room for future enhancements like authentication, caching, and advanced querying features.
