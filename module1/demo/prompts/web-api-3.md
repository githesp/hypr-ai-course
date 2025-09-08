__Prompt:__

Create a complete REST web API in TypeScript using Express.js for managing the configuration of multiple projects. The API will be used by applications to retrieve their configuration values when they start up. Use PostgreSQL as the database engine and include automated tests for each relevant file. Put the project in the config-service directory.

__Requirements:__

1. __Database Schema:__

   - Use PostgreSQL
   - Applications table: id (primary key), name (string), description (text), created_at (timestamp), updated_at (timestamp)
   - Configurations table: id (primary key), application_id (foreign key to applications), key (string), value (text), environment (string, e.g., 'dev', 'prod'), created_at (timestamp), updated_at (timestamp)
   - Include database connection setup and migration scripts

2. __API Endpoints:__

   - __Applications:__

     - POST /applications: Create a new application (request body: {name, description})
     - PUT /applications/{id}: Update an existing application (request body: {name?, description?})
     - GET /applications/{id}: Retrieve a specific application by ID
     - GET /applications: Retrieve all applications (support pagination if needed)

   - __Configurations:__

     - POST /configurations: Create a new configuration (request body: {application_id, key, value, environment})
     - PUT /configurations/{id}: Update an existing configuration (request body: {key?, value?, environment?})
     - GET /configurations/{id}: Retrieve a specific configuration by ID

3. __Project Structure:__

   - src/

     - models/ (Application.ts, Configuration.ts)
     - controllers/ (ApplicationController.ts, ConfigurationController.ts)
     - routes/ (applications.ts, configurations.ts)
     - database.ts (connection setup)
     - app.ts (Express app setup)
     - server.ts (server startup)

   - tests/

     - unit/controllers/ (tests for each controller)
     - integration/ (API endpoint tests)
     - setup.ts (test configuration)

   - Configuration files: package.json, tsconfig.json, jest.config.js, docker-compose.yml (.env for DB connection)

4. __Implementation Details:__

   - Do not use an ORM for database interactions, just use raw SQL
   - Implement proper error handling and validation (use a library like Joi or express-validator)
   - Add middleware for JSON parsing, CORS, logging
   - Use async/await throughout
   - Include TypeScript interfaces/types for request/response bodies
   - Handle database connection pooling and environment variables for DB config

5. __Testing:__

   - Use Jest for testing framework
   - Unit tests for controllers (mock database interactions)
   - Integration tests for API endpoints (use supertest)
   - Include test database setup (use testcontainers or in-memory DB for tests)
   - Aim for good test coverage

6. __Additional Features:__

   - Proper HTTP status codes and error responses
   - Input sanitization and validation
   - Logging (use winston or similar)
   - Documentation (consider adding Swagger/OpenAPI)

Generate the complete codebase with all files, ensuring it's production-ready and follows TypeScript and Node.js best practices.
