import express from 'express';
import eventTypeController from './eventType.controller.js';

const router = express.Router();

// Get all event types
router.get('/', eventTypeController.getAllEventTypes.bind(eventTypeController));

// Get single event type by slug (must be before /:id route)
router.get('/slug/:slug', eventTypeController.getEventTypeBySlug.bind(eventTypeController));

// Get single event type by ID
router.get('/:id', eventTypeController.getEventTypeById.bind(eventTypeController));

// Create new event type
router.post('/', eventTypeController.createEventType.bind(eventTypeController));

// Update event type by ID
router.put('/:id', eventTypeController.updateEventType.bind(eventTypeController));

// Delete event type by ID
router.delete('/:id', eventTypeController.deleteEventType.bind(eventTypeController));

export default router;

