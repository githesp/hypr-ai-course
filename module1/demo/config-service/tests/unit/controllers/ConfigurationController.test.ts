import { Request, Response } from 'express';
import { ConfigurationController } from '../../../src/controllers/ConfigurationController';
import { QueryResult } from '../../../node_modules/@types/pg';

// Mock the database query function
jest.mock('../../../src/database', () => ({
  query: jest.fn(),
}));

import { query } from '../../../src/database';

const mockQuery = query as jest.MockedFunction<typeof query>;

// Helper function to create mock QueryResult
const createMockQueryResult = <T extends Record<string, any>>(rows: T[]): QueryResult<T> => ({
  rows,
  command: 'SELECT',
  rowCount: rows.length,
  oid: 0,
  fields: [],
} as QueryResult<T>);

describe('ConfigurationController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new configuration successfully', async () => {
      const configData = {
        application_id: 1,
        key: 'database_url',
        value: 'postgresql://localhost:5432/test',
        environment: 'development',
      };

      const mockConfiguration = {
        id: 1,
        ...configData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.body = configData;
      mockQuery
        .mockResolvedValueOnce(createMockQueryResult([{ id: 1 }])) // Application exists check
        .mockResolvedValueOnce(createMockQueryResult([mockConfiguration]));

      await ConfigurationController.create(mockRequest as Request, mockResponse as Response);

      expect(mockQuery).toHaveBeenNthCalledWith(1, 'SELECT id FROM applications WHERE id = $1', [1]);
      expect(mockQuery).toHaveBeenNthCalledWith(2,
        'INSERT INTO configurations (application_id, key, value, environment) VALUES ($1, $2, $3, $4) RETURNING *',
        [configData.application_id, configData.key, configData.value, configData.environment]
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          key: 'database_url',
          value: 'postgresql://localhost:5432/test',
        })
      );
    });

    it('should return 404 if application does not exist', async () => {
      const configData = {
        application_id: 999,
        key: 'database_url',
        value: 'postgresql://localhost:5432/test',
        environment: 'development',
      };

      mockRequest.body = configData;
      mockQuery.mockResolvedValueOnce(createMockQueryResult([])); // Application not found

      await ConfigurationController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Application not found',
      });
    });

    it('should return 409 for duplicate configuration key and environment', async () => {
      const configData = {
        application_id: 1,
        key: 'database_url',
        value: 'postgresql://localhost:5432/test',
        environment: 'development',
      };

      mockRequest.body = configData;
      const error = new Error('duplicate key value violates unique constraint');
      (error as any).code = '23505';
      mockQuery
        .mockResolvedValueOnce(createMockQueryResult([{ id: 1 }])) // Application exists
        .mockRejectedValueOnce(error);

      await ConfigurationController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Configuration with this key and environment already exists for this application',
      });
    });
  });

  describe('getById', () => {
    it('should return configuration by ID with application name', async () => {
      const mockConfiguration = {
        id: 1,
        application_id: 1,
        key: 'database_url',
        value: 'postgresql://localhost:5432/test',
        environment: 'development',
        created_at: new Date(),
        updated_at: new Date(),
        application_name: 'TestApp',
      };

      (mockRequest as any).params = { id: '1' };
      mockQuery.mockResolvedValueOnce(createMockQueryResult([mockConfiguration]));

      await ConfigurationController.getById(mockRequest as any, mockResponse as Response);

      expect(mockQuery).toHaveBeenCalledWith(
        `SELECT c.*, a.name as application_name
         FROM configurations c
         JOIN applications a ON c.application_id = a.id
         WHERE c.id = $1`,
        ['1']
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          key: 'database_url',
          application_name: 'TestApp',
        })
      );
    });

    it('should return 404 for non-existent configuration', async () => {
      (mockRequest as any).params = { id: '999' };
      mockQuery.mockResolvedValueOnce(createMockQueryResult([]));

      await ConfigurationController.getById(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Configuration not found',
      });
    });
  });

  describe('getByApplication', () => {
    it('should return configurations for application with pagination', async () => {
      const mockConfigurations = [
        {
          id: 1,
          application_id: 1,
          key: 'database_url',
          value: 'postgresql://localhost:5432/test',
          environment: 'development',
          created_at: new Date(),
          updated_at: new Date(),
          application_name: 'TestApp',
        },
      ];

      (mockRequest as any).params = { applicationId: '1' };
      mockRequest.query = { environment: 'development' };
      mockQuery
        .mockResolvedValueOnce(createMockQueryResult([{ id: 1 }])) // Application exists
        .mockResolvedValueOnce(createMockQueryResult(mockConfigurations))
        .mockResolvedValueOnce(createMockQueryResult([{ total: '1' }]));

      await ConfigurationController.getByApplication(mockRequest as any, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          }),
        })
      );
    });

    it('should return 404 if application does not exist', async () => {
      (mockRequest as any).params = { applicationId: '999' };
      mockRequest.query = {};
      mockQuery.mockResolvedValueOnce(createMockQueryResult([])); // Application not found

      await ConfigurationController.getByApplication(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Application not found',
      });
    });
  });
});
