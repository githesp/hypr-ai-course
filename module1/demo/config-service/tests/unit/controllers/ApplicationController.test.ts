import { Request, Response } from 'express';
import { ApplicationController } from '../../../src/controllers/ApplicationController';
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

describe('ApplicationController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new application successfully', async () => {
      const applicationData = {
        name: 'Test App',
        description: 'Test Description',
      };

      const mockApplication = {
        id: 1,
        ...applicationData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.body = applicationData;
      mockQuery.mockResolvedValueOnce(createMockQueryResult([mockApplication]));

      await ApplicationController.create(mockRequest as Request, mockResponse as Response);

      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO applications (name, description) VALUES ($1, $2) RETURNING *',
        [applicationData.name, applicationData.description]
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'Test App',
          description: 'Test Description',
        })
      );
    });

    it('should return 409 for duplicate application name', async () => {
      const applicationData = {
        name: 'Test App',
        description: 'Test Description',
      };

      mockRequest.body = applicationData;
      const error = new Error('duplicate key value violates unique constraint');
      (error as any).code = '23505';
      mockQuery.mockRejectedValueOnce(error);

      await ApplicationController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Application with this name already exists',
      });
    });
  });

  describe('getById', () => {
    it('should return application by ID', async () => {
      const mockApplication = {
        id: 1,
        name: 'Test App',
        description: 'Test Description',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockRequest as any).params = { id: '1' };
      mockQuery.mockResolvedValueOnce(createMockQueryResult([mockApplication]));

      await ApplicationController.getById(mockRequest as any, mockResponse as Response);

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM applications WHERE id = $1', ['1']);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'Test App',
        })
      );
    });

    it('should return 404 for non-existent application', async () => {
      (mockRequest as any).params = { id: '999' };
      mockQuery.mockResolvedValueOnce(createMockQueryResult([]));

      await ApplicationController.getById(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Application not found',
      });
    });
  });

  describe('getAll', () => {
    it('should return paginated applications', async () => {
      const mockApplications = [
        {
          id: 1,
          name: 'App 1',
          description: 'Description 1',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: 'App 2',
          description: 'Description 2',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockRequest.query = {};
      mockQuery
        .mockResolvedValueOnce(createMockQueryResult(mockApplications))
        .mockResolvedValueOnce(createMockQueryResult([{ total: '2' }]));

      await ApplicationController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockQuery).toHaveBeenNthCalledWith(1,
        'SELECT * FROM applications ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [10, 0]
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          }),
        })
      );
    });
  });
});
