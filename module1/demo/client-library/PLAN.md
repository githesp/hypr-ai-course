# TypeScript Client Library for Configuration Service API

## Overview

This document outlines the plan for creating a comprehensive TypeScript client library for the Configuration Service REST API. The client will provide type-safe, easy-to-use methods for managing applications and configurations.

## Current API Understanding

### Core Entities
- **Applications**: Manage application registrations with name and description
- **Configurations**: Key-value pairs with environment support, linked to applications

### API Endpoints
**Applications:**
- `POST /api/applications` - Create application
- `PUT /api/applications/{id}` - Update application
- `GET /api/applications/{id}` - Get application by ID
- `GET /api/applications` - List all applications

**Configurations:**
- `POST /api/configurations` - Create configuration
- `PUT /api/configurations/{id}` - Update configuration
- `GET /api/configurations/{id}` - Get configuration by ID
- `GET /api/configurations/application/{applicationId}` - Get configurations by application

### Data Models
**Applications:**
```typescript
interface Application {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}
```

**Configurations:**
```typescript
interface Configuration {
  id: number;
  application_id: number;
  key: string;
  value?: string;
  environment: string;
  created_at: Date;
  updated_at: Date;
}
```

## Proposed Client Library Architecture

### Project Structure
```
client-library/
├── src/
│   ├── client.ts           # Main client class
│   ├── types.ts            # TypeScript interfaces and types
│   ├── applications.ts     # Application API methods
│   ├── configurations.ts   # Configuration API methods
│   ├── errors.ts           # Custom error classes
│   └── utils.ts            # Helper functions
├── tests/
│   ├── client.test.ts
│   ├── applications.test.ts
│   └── configurations.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Core Features

#### 1. Type Safety
- Full TypeScript support with strict typing
- Generated interfaces matching API responses
- Request/response type validation

#### 2. Error Handling
- Custom error classes for different HTTP status codes
- Detailed error messages and context
- Retry logic for transient failures

#### 3. Authentication Support
- API key authentication
- Bearer token support
- Custom authentication headers

#### 4. Advanced Features
- **Pagination**: Built-in support for paginated responses
- **Environment Filtering**: Get configurations for specific environments
- **Batch Operations**: Bulk create/update configurations
- **Caching**: Optional caching layer for frequently accessed configs
- **Retry Logic**: Configurable retry attempts with exponential backoff

### Client Interface Design

```typescript
interface ConfigClientOptions {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

class ConfigServiceClient {
  constructor(options: ConfigClientOptions);

  // Applications API
  createApplication(data: CreateApplicationRequest): Promise<ApplicationResponse>;
  updateApplication(id: number, data: UpdateApplicationRequest): Promise<ApplicationResponse>;
  getApplication(id: number): Promise<ApplicationResponse>;
  listApplications(): Promise<ApplicationResponse[]>;

  // Configurations API
  createConfiguration(data: CreateConfigurationRequest): Promise<ConfigurationResponse>;
  updateConfiguration(id: number, data: UpdateConfigurationRequest): Promise<ConfigurationResponse>;
  getConfiguration(id: number): Promise<ConfigurationResponse>;
  getConfigurationsByApplication(
    appId: number,
    options?: {
      environment?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ConfigurationResponse[]>;
}
```

### Usage Examples

#### Basic Usage
```typescript
import { ConfigServiceClient } from 'config-service-client';

const client = new ConfigServiceClient({
  baseUrl: 'http://localhost:3000/api',
  apiKey: 'your-api-key'
});

// Create an application
const app = await client.createApplication({
  name: 'my-web-app',
  description: 'My web application'
});

console.log('Created application:', app.name);
```

#### Configuration Management
```typescript
// Add configurations
await client.createConfiguration({
  application_id: app.id,
  key: 'database_url',
  value: 'postgresql://localhost:5432/myapp',
  environment: 'production'
});

await client.createConfiguration({
  application_id: app.id,
  key: 'api_endpoint',
  value: 'https://api.example.com',
  environment: 'production'
});

// Retrieve configurations
const configs = await client.getConfigurationsByApplication(app.id, {
  environment: 'production'
});

console.log('Production configs:', configs);
```

#### Error Handling
```typescript
try {
  const app = await client.getApplication(999);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Application not found');
  } else if (error instanceof ValidationError) {
    console.log('Validation failed:', error.details);
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

### Implementation Plan

#### Phase 1: Core Infrastructure
- [ ] Set up project structure and build configuration
- [ ] Define TypeScript interfaces and types
- [ ] Implement basic HTTP client with fetch
- [ ] Create error handling system

#### Phase 2: API Methods
- [ ] Implement Applications API methods
- [ ] Implement Configurations API methods
- [ ] Add request/response validation
- [ ] Implement pagination support

#### Phase 3: Advanced Features
- [ ] Add authentication support
- [ ] Implement retry logic
- [ ] Add caching layer
- [ ] Create batch operations

#### Phase 4: Testing & Documentation
- [ ] Write comprehensive unit tests
- [ ] Create integration tests
- [ ] Write API documentation
- [ ] Create usage examples

### Dependencies

**Runtime Dependencies:**
- `node-fetch` or native `fetch` (Node 18+)

**Development Dependencies:**
- `typescript`
- `jest`
- `@types/node`
- `@types/jest`
- `ts-jest`

### Configuration Options

The client will support various configuration options:

```typescript
interface ConfigClientOptions {
  baseUrl: string;           // API base URL
  apiKey?: string;           // API key for authentication
  timeout?: number;          // Request timeout in milliseconds
  retryAttempts?: number;    // Number of retry attempts
  retryDelay?: number;       // Delay between retries
  headers?: Record<string, string>; // Custom headers
}
```

### Error Types

Custom error classes for different scenarios:
- `ConfigServiceError` - Base error class
- `ValidationError` - Request validation failures
- `NotFoundError` - Resource not found
- `UnauthorizedError` - Authentication failures
- `RateLimitError` - Rate limiting
- `NetworkError` - Network/connectivity issues

### Testing Strategy

- **Unit Tests**: Test individual methods and utilities
- **Integration Tests**: Test against actual API endpoints
- **Mock Tests**: Test error scenarios and edge cases
- **Coverage**: Aim for >90% code coverage

### Future Enhancements

- **WebSocket Support**: Real-time configuration updates
- **GraphQL Client**: Alternative query interface
- **SDK Generation**: Auto-generate client from OpenAPI spec
- **Multi-tenant Support**: Organization/workspace isolation
- **Audit Logging**: Track configuration changes
- **Backup/Restore**: Configuration backup and restore functionality

This plan provides a solid foundation for a production-ready TypeScript client library that will make it easy for developers to integrate with the Configuration Service API.
