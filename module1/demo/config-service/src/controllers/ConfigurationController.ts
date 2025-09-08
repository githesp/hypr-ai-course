import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { query } from '../database';
import {
  Configuration,
  CreateConfigurationRequest,
  UpdateConfigurationRequest,
  ConfigurationResponse,
  ConfigurationWithApplication
} from '../models/Configuration';

export class ConfigurationController {
  // Create a new configuration
  static async create(req: Request<{}, {}, CreateConfigurationRequest>, res: Response) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { application_id, key, value, environment } = req.body;

      // Check if application exists
      const appResult = await query('SELECT id FROM applications WHERE id = $1', [application_id]);
      if (appResult.rows.length === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const result = await query(
        'INSERT INTO configurations (application_id, key, value, environment) VALUES ($1, $2, $3, $4) RETURNING *',
        [application_id, key, value, environment]
      );

      const configuration: Configuration = result.rows[0];
      const response: ConfigurationResponse = {
        ...configuration,
        created_at: configuration.created_at.toISOString(),
        updated_at: configuration.updated_at.toISOString()
      };

      res.status(201).json(response);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        res.status(409).json({ error: 'Configuration with this key and environment already exists for this application' });
      } else if (error.code === '23503') { // Foreign key violation
        res.status(404).json({ error: 'Application not found' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Update an existing configuration
  static async update(req: Request<{ id: string }, {}, UpdateConfigurationRequest>, res: Response) {
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
      const { key, value, environment } = req.body;

      const result = await query(
        'UPDATE configurations SET key = COALESCE($1, key), value = COALESCE($2, value), environment = COALESCE($3, environment), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
        [key, value, environment, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      const configuration: Configuration = result.rows[0];
      const response: ConfigurationResponse = {
        ...configuration,
        created_at: configuration.created_at.toISOString(),
        updated_at: configuration.updated_at.toISOString()
      };

      res.json(response);
    } catch (error: any) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'Configuration with this key and environment already exists for this application' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Get a specific configuration by ID
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

      const result = await query(
        `SELECT c.*, a.name as application_name
         FROM configurations c
         JOIN applications a ON c.application_id = a.id
         WHERE c.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      const row = result.rows[0];
      const response: ConfigurationWithApplication = {
        id: row.id,
        application_id: row.application_id,
        key: row.key,
        value: row.value,
        environment: row.environment,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
        application_name: row.application_name
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get configurations by application ID and environment
  static async getByApplication(req: Request<{ applicationId: string }, {}, {}, { environment?: string; page?: string; limit?: string }>, res: Response) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { applicationId } = req.params;
      const { environment, page = '1', limit = '10' } = req.query;

      // Check if application exists
      const appResult = await query('SELECT id FROM applications WHERE id = $1', [applicationId]);
      if (appResult.rows.length === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      let queryText = `
        SELECT c.*, a.name as application_name
        FROM configurations c
        JOIN applications a ON c.application_id = a.id
        WHERE c.application_id = $1
      `;
      let params: any[] = [applicationId];

      if (environment) {
        queryText += ' AND c.environment = $2';
        params.push(environment);
      }

      queryText += ' ORDER BY c.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limitNum, offset);

      const result = await query(queryText, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM configurations WHERE application_id = $1';
      let countParams: any[] = [applicationId];

      if (environment) {
        countQuery += ' AND environment = $2';
        countParams.push(environment);
      }

      const countResult = await query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      const configurations: ConfigurationWithApplication[] = result.rows.map((row: any) => ({
        id: row.id,
        application_id: row.application_id,
        key: row.key,
        value: row.value,
        environment: row.environment,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
        application_name: row.application_name
      }));

      res.json({
        data: configurations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
