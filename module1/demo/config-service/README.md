# Configuration Management API

A REST API for managing project configurations using TypeScript, Express.js, and PostgreSQL.

## Features

- **Applications Management**: Create, read, update applications
- **Configurations Management**: Manage key-value configurations per application and environment
- **PostgreSQL Database**: Robust data storage with proper indexing
- **TypeScript**: Full type safety
- **Validation**: Input validation using express-validator
- **Logging**: Winston-based logging
- **Security**: Helmet for security headers, CORS support
- **Testing**: Jest for unit and integration tests
- **Docker Support**: Easy deployment with Docker Compose

## API Endpoints

### Applications

- `POST /api/applications` - Create a new application
- `PUT /api/applications/{id}` - Update an application
- `GET /api/applications/{id}` - Get application by ID
- `GET /api/applications` - Get all applications (paginated)

### Configurations

- `POST /api/configurations` - Create a new configuration
- `PUT /api/configurations/{id}` - Update a configuration
- `GET /api/configurations/{id}` - Get configuration by ID
- `GET /api/configurations/application/{applicationId}` - Get configurations by application

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your database credentials.

4. Start PostgreSQL:
   ```bash
   docker-compose up -d postgres
   ```

5. Run database migrations:
   ```bash
   # The migrations are automatically run when the server starts
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## Usage Examples

### Create an Application

```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp", "description": "My awesome application"}'
```

### Create a Configuration

```bash
curl -X POST http://localhost:3000/api/configurations \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": 1,
    "key": "database_url",
    "value": "postgresql://localhost:5432/myapp",
    "environment": "production"
  }'
```

### Get Configurations for an Application

```bash
curl "http://localhost:3000/api/configurations/application/1?environment=production"
```

## Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── ApplicationController.ts
│   └── ConfigurationController.ts
├── models/              # TypeScript interfaces
│   ├── Application.ts
│   └── Configuration.ts
├── routes/              # Route definitions
│   ├── applications.ts
│   └── configurations.ts
├── app.ts               # Express app setup
├── server.ts            # Server startup
└── database.ts          # Database connection

tests/
├── unit/controllers/    # Unit tests
└── setup.ts            # Test configuration

migrations/              # Database migrations
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Docker Deployment

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `config_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `password` |

## Development

### Building

```bash
npm run build
```

### Running in production

```bash
npm start
```

## License

ISC
