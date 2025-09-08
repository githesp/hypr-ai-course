import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { validationResult } from 'express-validator';
import winston from 'winston';
import { Pool } from '../../node_modules/@types/pg';
import applicationsRouter from '../../src/routes/applications';
import configurationsRouter from '../../src/routes/configurations';
import { setupTestDatabase, teardownTestDatabase, cleanTables } from '../setup';
import { setPool } from '../../src/database';

// Create a separate test app instance
let testApp: express.Application;
let testPool: Pool;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Set up test database
    testPool = await setupTestDatabase();

    // Set the global pool to use the test database
    setPool(testPool);

    // Create a test app instance with its own database connection
    testApp = express();

    // Override the database connection for this test app
    // We'll need to create routes that use the test database
    const testApplicationsRouter = express.Router();
    const testConfigurationsRouter = express.Router();

    // Logger setup for tests (minimal)
    const logger = winston.createLogger({
      level: 'error', // Only log errors in tests
      transports: [new winston.transports.Console()],
    });

    // Middleware
    testApp.use(helmet());
    testApp.use(cors());
    testApp.use(express.json({ limit: '10mb' }));
    testApp.use(express.urlencoded({ extended: true }));

    // Routes - we'll use the same route handlers but they'll use the test database
    testApp.use('/api/applications', applicationsRouter);
    testApp.use('/api/configurations', configurationsRouter);

    // Validation error handling middleware
    testApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }
      next();
    });

    // Health check endpoint
    testApp.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // 404 handler
    testApp.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Global error handler
    testApp.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', { error: err.message, stack: err.stack });
      res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean all tables before each test
    await cleanTables();
  });

  describe('Applications API', () => {
    describe('POST /api/applications', () => {
      it('should create a new application', async () => {
        const response = await request(testApp)
          .post('/api/applications')
          .send({
            name: 'TestApp',
            description: 'A test application'
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('TestApp');
        expect(response.body.description).toBe('A test application');
        expect(response.body).toHaveProperty('created_at');
        expect(response.body).toHaveProperty('updated_at');
      });

      it('should return 400 for invalid data', async () => {
        const response = await request(testApp)
          .post('/api/applications')
          .send({
            name: '', // Invalid: empty name
            description: 'A test application'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.details).toBeDefined();
      });

      it('should return 409 for duplicate application name', async () => {
        // Create first application
        await request(testApp)
          .post('/api/applications')
          .send({
            name: 'TestApp',
            description: 'A test application'
          });

        // Try to create duplicate
        const response = await request(testApp)
          .post('/api/applications')
          .send({
            name: 'TestApp',
            description: 'Another test application'
          })
          .expect(409);

        expect(response.body.error).toBe('Application with this name already exists');
      });
    });

    describe('GET /api/applications/:id', () => {
      it('should return application by ID', async () => {
        const createResponse = await request(testApp)
          .post('/api/applications')
          .send({
            name: 'TestApp',
            description: 'A test application'
          });

        const appId = createResponse.body.id;

        const response = await request(testApp)
          .get(`/api/applications/${appId}`)
          .expect(200);

        expect(response.body.id).toBe(appId);
        expect(response.body.name).toBe('TestApp');
        expect(response.body.description).toBe('A test application');
      });

      it('should return 404 for non-existent application', async () => {
        const response = await request(testApp)
          .get('/api/applications/999')
          .expect(404);

        expect(response.body.error).toBe('Application not found');
      });
    });

    describe('PUT /api/applications/:id', () => {
      it('should update an application', async () => {
        const createResponse = await request(testApp)
          .post('/api/applications')
          .send({
            name: 'TestApp',
            description: 'A test application'
          });

        const appId = createResponse.body.id;

        const response = await request(testApp)
          .put(`/api/applications/${appId}`)
          .send({
            name: 'UpdatedApp',
            description: 'Updated description'
          })
          .expect(200);

        expect(response.body.id).toBe(appId);
        expect(response.body.name).toBe('UpdatedApp');
        expect(response.body.description).toBe('Updated description');
      });

      it('should return 404 for non-existent application', async () => {
        const response = await request(testApp)
          .put('/api/applications/999')
          .send({
            name: 'UpdatedApp',
            description: 'Updated description'
          })
          .expect(404);

        expect(response.body.error).toBe('Application not found');
      });
    });

    describe('GET /api/applications', () => {
      it('should return paginated applications', async () => {
        // Create multiple applications
        await request(testApp)
          .post('/api/applications')
          .send({ name: 'App1', description: 'Description 1' });

        await request(testApp)
          .post('/api/applications')
          .send({ name: 'App2', description: 'Description 2' });

        const response = await request(testApp)
          .get('/api/applications')
          .expect(200);

        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 10);
        expect(response.body.pagination).toHaveProperty('total', 2);
        expect(response.body.pagination).toHaveProperty('totalPages', 1);
      });
    });
  });

  describe('Configurations API', () => {
    let appId: number;

    beforeEach(async () => {
      const createResponse = await request(testApp)
        .post('/api/applications')
        .send({
          name: 'TestApp',
          description: 'A test application'
        });
      appId = createResponse.body.id;
    });

    describe('POST /api/configurations', () => {
      it('should create a new configuration', async () => {
        const response = await request(testApp)
          .post('/api/configurations')
          .send({
            application_id: appId,
            key: 'database_url',
            value: 'postgresql://localhost:5432/test',
            environment: 'development'
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.application_id).toBe(appId);
        expect(response.body.key).toBe('database_url');
        expect(response.body.value).toBe('postgresql://localhost:5432/test');
        expect(response.body.environment).toBe('development');
      });

      it('should return 404 for non-existent application', async () => {
        const response = await request(testApp)
          .post('/api/configurations')
          .send({
            application_id: 999,
            key: 'database_url',
            value: 'postgresql://localhost:5432/test',
            environment: 'development'
          })
          .expect(404);

        expect(response.body.error).toBe('Application not found');
      });

      it('should return 409 for duplicate configuration', async () => {
        // Create first configuration
        await request(testApp)
          .post('/api/configurations')
          .send({
            application_id: appId,
            key: 'database_url',
            value: 'postgresql://localhost:5432/test',
            environment: 'development'
          });

        // Try to create duplicate
        const response = await request(testApp)
          .post('/api/configurations')
          .send({
            application_id: appId,
            key: 'database_url',
            value: 'postgresql://localhost:5432/test2',
            environment: 'development'
          })
          .expect(409);

        expect(response.body.error).toBe('Configuration with this key and environment already exists for this application');
      });
    });

    describe('GET /api/configurations/:id', () => {
      it('should return configuration by ID with application name', async () => {
        const createResponse = await request(testApp)
          .post('/api/configurations')
          .send({
            application_id: appId,
            key: 'database_url',
            value: 'postgresql://localhost:5432/test',
            environment: 'development'
          });

        const configId = createResponse.body.id;

        const response = await request(testApp)
          .get(`/api/configurations/${configId}`)
          .expect(200);

        expect(response.body.id).toBe(configId);
        expect(response.body.key).toBe('database_url');
        expect(response.body.value).toBe('postgresql://localhost:5432/test');
        expect(response.body.environment).toBe('development');
        expect(response.body.application_name).toBe('TestApp');
      });

      it('should return 404 for non-existent configuration', async () => {
        const response = await request(testApp)
          .get('/api/configurations/999')
          .expect(404);

        expect(response.body.error).toBe('Configuration not found');
      });
    });

    describe('GET /api/configurations/application/:applicationId', () => {
      it('should return configurations for application', async () => {
        await request(testApp)
          .post('/api/configurations')
          .send({
            application_id: appId,
            key: 'database_url',
            value: 'postgresql://localhost:5432/test',
            environment: 'development'
          });

        await request(testApp)
          .post('/api/configurations')
          .send({
            application_id: appId,
            key: 'redis_url',
            value: 'redis://localhost:6379',
            environment: 'development'
          });

        const response = await request(testApp)
          .get(`/api/configurations/application/${appId}`)
          .expect(200);

        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination.total).toBe(2);
        expect(response.body.data[0]).toHaveProperty('application_name', 'TestApp');
      });

      it('should filter by environment', async () => {
        await request(testApp)
          .post('/api/configurations')
          .send({
            application_id: appId,
            key: 'database_url',
            value: 'postgresql://localhost:5432/dev',
            environment: 'development'
          });

        await request(testApp)
          .post('/api/configurations')
          .send({
            application_id: appId,
            key: 'database_url',
            value: 'postgresql://localhost:5432/prod',
            environment: 'production'
          });

        const response = await request(testApp)
          .get(`/api/configurations/application/${appId}?environment=development`)
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].environment).toBe('development');
        expect(response.body.data[0].value).toBe('postgresql://localhost:5432/dev');
      });

      it('should return 404 for non-existent application', async () => {
        const response = await request(testApp)
          .get('/api/configurations/application/999')
          .expect(404);

        expect(response.body.error).toBe('Application not found');
      });
    });
  });

  describe('Health Check', () => {
    it('should return OK status', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
