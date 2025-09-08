import { Router } from 'express';
import { ApplicationController } from '../controllers/ApplicationController';
import { body, param } from 'express-validator';

const router = Router();

// Validation middleware
const createApplicationValidation = [
  body('name').isString().isLength({ min: 1, max: 255 }).withMessage('Name must be a string between 1 and 255 characters'),
  body('description').optional().isString().withMessage('Description must be a string')
];

const updateApplicationValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  body('name').optional().isString().isLength({ min: 1, max: 255 }).withMessage('Name must be a string between 1 and 255 characters'),
  body('description').optional().isString().withMessage('Description must be a string')
];

const getApplicationValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

// Routes
router.post('/', createApplicationValidation, ApplicationController.create);
router.put('/:id', updateApplicationValidation, ApplicationController.update);
router.get('/:id', getApplicationValidation, ApplicationController.getById);
router.get('/', ApplicationController.getAll);

export default router;
