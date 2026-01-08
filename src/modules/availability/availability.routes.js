import express from 'express';
import availabilityController from './availability.controller.js';

const router = express.Router();

// Get all availabilities
router.get('/', availabilityController.getAllAvailabilities.bind(availabilityController));

// Get default availability
router.get('/default', availabilityController.getDefaultAvailability.bind(availabilityController));

// Get availability by ID
router.get('/:id', availabilityController.getAvailabilityById.bind(availabilityController));

// Create availability
router.post('/', availabilityController.createAvailability.bind(availabilityController));

// Update availability
router.put('/:id', availabilityController.updateAvailability.bind(availabilityController));

// Delete availability
router.delete('/:id', availabilityController.deleteAvailability.bind(availabilityController));

// Add interval to availability
router.post('/:id/intervals', availabilityController.addInterval.bind(availabilityController));

// Update interval
router.put('/intervals/:intervalId', availabilityController.updateInterval.bind(availabilityController));

// Delete interval
router.delete('/intervals/:intervalId', availabilityController.deleteInterval.bind(availabilityController));

export default router;
