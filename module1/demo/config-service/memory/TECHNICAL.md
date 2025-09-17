# Technical Implementation Details

## Dependencies
**Production:**
- express: ^4.18.2 (Web framework)
- pg: ^8.11.3 (PostgreSQL client)
- winston: ^3.8.2 (Logging)
- helmet: ^6.0.1 (Security headers)
- cors: ^2.8.5 (CORS support)
- express-validator: ^7.0.1 (Input validation)
- dotenv: ^16.0.3 (Environment variables)

**Development:**
- typescript: ^5.0.4
- jest: ^29.6.1 (Testing)
- ts-node: ^10.9.1 (TypeScript execution)
- supertest: ^6.3.3 (API testing)

## Database Schema
```sql
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE configurations (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value TEXT,
  environment VARCHAR(50) NOT NULL DEFAULT 'dev',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(application_id, key, environment)
);
```

## API Endpoints
**Applications:**
- POST /api/applications - Create application
- PUT /api/applications/{id} - Update application
- GET /api/applications/{id} - Get application
- GET /api/applications - List applications (paginated)

**Configurations:**
- POST /api/configurations - Create configuration
- PUT /api/configurations/{id} - Update configuration
- GET /api/configurations/{id} - Get configuration
- GET /api/configurations/application/{applicationId} - Get configs by application

## Environment Variables
- PORT: 3000
- NODE_ENV: development
- DB_HOST: localhost
- DB_PORT: 5432
- DB_NAME: config_db
- DB_USER: postgres
- DB_PASSWORD: password

## Build Scripts
- npm run build: tsc (compile TypeScript)
- npm start: node dist/server.js (production)
- npm run dev: ts-node src/server.ts (development)
- npm test: jest (run tests)

## Project Structure
```
src/
├── controllers/     # ApplicationController.ts, ConfigurationController.ts
├── models/         # Application.ts, Configuration.ts
├── routes/         # applications.ts, configurations.ts
├── app.ts          # Express setup with middleware
├── server.ts       # Server startup
└── database.ts     # PostgreSQL connection
```

## Implementation Details
- Database connection pooling with max 20 connections
- Winston logging to error.log, combined.log, and console (dev only)
- Express middleware: helmet, cors, json parsing, request logging
- Validation middleware using express-validator
- Global error handler with development stack traces
- Health check endpoint at /health

## Docker Setup
PostgreSQL service with:
- Image: postgres:15
- Port: 5432
- Database: config_db
- User: postgres
- Password: password

## Testing Configuration
- Jest with ts-jest preset
- Test environment: node
- Setup file: tests/setup.ts
- Test roots: src/, tests/
- Test match: **/__tests__/**/*.ts, **/?(*.)+(spec|test).ts

## Quick Start
1. npm install
2. cp .env.example .env
3. docker-compose up -d postgres
4. npm run dev
