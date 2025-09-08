import { Router } from 'express';
import { ConfigurationController } from '../controllers/ConfigurationController';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation middleware
const createConfigurationValidation = [
  body('application_id').isInt({ min: 1 }).withMessage('Application ID must be a positive integer'),
  body('key').isString().isLength({ min: 1, max: 255 }).withMessage('Key must be a string between 1 and 255 characters'),
  body('value').optional().isString().withMessage('Value must be a string'),
  body('environment').isString().isLength({ min: 1, max: 50 }).withMessage('Environment must be a string between 1 and 50 characters')
];

const updateConfigurationValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  body('key').optional().isString().isLength({ min: 1, max: 255 }).withMessage('Key must be a string between 1 and 255 characters'),
  body('value').optional().isString().withMessage('Value must be a string'),
  body('environment').optional().isString().isLength({ min: 1, max: 50 }).withMessage('Environment must be a string between 1 and 50 characters')
];

const getConfigurationValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

const getByApplicationValidation = [
  param('applicationId').isInt({ min: 1 }).withMessage('Application ID must be a positive integer'),
  query('environment').optional().isString().withMessage('Environment must be a string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Routes
router.post('/', createConfigurationValidation, ConfigurationController.create);
router.put('/:id', updateConfigurationValidation, ConfigurationController.update);
router.get('/:id', getConfigurationValidation, ConfigurationController.getById);
router.get('/application/:applicationId', getByApplicationValidation, ConfigurationController.getByApplication);

export default router;
