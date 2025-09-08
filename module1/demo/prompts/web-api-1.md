# Config Service Pre-prompt Planning

This document contains details necessary to create a REST Web API for managing the configuration of multiple applications. The applications will use this API to retrieve its configuration values when they start up.

## Tech Stack

| Area                 | Choice     | Version |
|----------------------|------------|---------|
| Language             | TypeScript | 5.9.2   |
| Database engine      | PostgreSQL | v16     |

## API Endpoints

**Applications**
  - POST `/applications`
  - PUT `/applications/{id}`
  - GET `/applications/{id}`
  - GET `/applications`

**Configurations**
  - POST `/configurations`
  - PUT `/configurations/{id}`
  - GET `/configurations/{id}`

## Service Configuration

Use a `.env` file to store environment variables, such as the database configuration string, logging level, etc.

## Automated Testing

- ALL code files MUST have an associated unit test that focuses on 80% of the most important scenarios in the file it is testing.
- ALL unit tests will have a `_test.ts` suffix and be located in the same folder as the unit under test.
- If we must have a `test/` folder, it should only contain test helpers, widely used mocks, and/or integration tests. Do not create this folder until it is needed.