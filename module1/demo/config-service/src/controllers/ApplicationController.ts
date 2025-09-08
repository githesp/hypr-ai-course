import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { query } from '../database';
import {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApplicationResponse
} from '../models/Application';

export class ApplicationController {
  // Create a new application
  static async create(req: Request<{}, {}, CreateApplicationRequest>, res: Response) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { name, description } = req.body;

      const result = await query(
        'INSERT INTO applications (name, description) VALUES ($1, $2) RETURNING *',
        [name, description]
      );

      const application: Application = result.rows[0];
      const response: ApplicationResponse = {
        ...application,
        created_at: application.created_at.toISOString(),
        updated_at: application.updated_at.toISOString()
      };

      res.status(201).json(response);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        res.status(409).json({ error: 'Application with this name already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Update an existing application
  static async update(req: Request<{ id: string }, {}, UpdateApplicationRequest>, res: Response) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { name, description } = req.body;

      const result = await query(
        'UPDATE applications SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [name, description, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const application: Application = result.rows[0];
      const response: ApplicationResponse = {
        ...application,
        created_at: application.created_at.toISOString(),
        updated_at: application.updated_at.toISOString()
      };

      res.json(response);
    } catch (error: any) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'Application with this name already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Get a specific application by ID
  static async getById(req: Request<{ id: string }>, res: Response) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;

      const result = await query('SELECT * FROM applications WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const application: Application = result.rows[0];
      const response: ApplicationResponse = {
        ...application,
        created_at: application.created_at.toISOString(),
        updated_at: application.updated_at.toISOString()
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all applications with pagination
  static async getAll(req: Request<{}, {}, {}, { page?: string; limit?: string }>, res: Response) {
    try {
      const page = parseInt(req.query.page || '1');
      const limit = parseInt(req.query.limit || '10');
      const offset = (page - 1) * limit;

      const result = await query(
        'SELECT * FROM applications ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );

      const countResult = await query('SELECT COUNT(*) as total FROM applications');
      const total = parseInt(countResult.rows[0].total);

      const applications: ApplicationResponse[] = result.rows.map((app: Application) => ({
        ...app,
        created_at: app.created_at.toISOString(),
        updated_at: app.updated_at.toISOString()
      }));

      res.json({
        data: applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
