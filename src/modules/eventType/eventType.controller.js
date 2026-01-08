// EventType Controller - HTTP request/response handling

import BaseController from '../../core/baseController.js';
import eventTypeService from "./eventType.service.js";
import { eventTypeSchema, updateEventTypeSchema, formatZodError } from '../../core/validationSchema.js';

class EventTypeController extends BaseController {

    constructor() {
        super();
        this.eventTypeService = eventTypeService;
    }

    async getAllEventTypes(req, res) {
        try {
            const eventTypes = await this.eventTypeService.getAllEventTypes();
            return this.handleSuccess(res, eventTypes, 'Event types fetched successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to get event types', error);
        }
    }

    async createEventType(req, res) {
        try {
            // Validate request body
            const result = eventTypeSchema.safeParse(req.body);
            if (!result.success) {
                const formattedError = formatZodError(result.error);
                return this.handleError(res, 'Validation failed', formattedError);
            }

            // Call service to create event type
            const eventType = await this.eventTypeService.createEventType(result.data);
            return this.handleSuccess(res, eventType, 'Event type created successfully', 201);
        }
        catch (error) {
            return this.handleError(res, 'Failed to create event type', error);
        }
    }

    async getEventTypeById(req, res) {
        try {
            const { id } = req.params;

            // Validate id is a number
            const eventTypeId = parseInt(id);
            if (isNaN(eventTypeId)) {
                return this.handleError(res, 'Invalid event type ID', {
                    name: 'ValidationError',
                    message: 'Event type ID must be a valid number'
                });
            }

            const eventType = await this.eventTypeService.getEventTypeById(eventTypeId);
            return this.handleSuccess(res, eventType, 'Event type fetched successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to get event type', error);
        }
    }

    async getEventTypeBySlug(req, res) {
        try {
            const { slug } = req.params;

            if (!slug || slug.trim() === '') {
                return this.handleError(res, 'Invalid slug', {
                    name: 'ValidationError',
                    message: 'Slug is required'
                });
            }

            const eventType = await this.eventTypeService.getEventTypeBySlug(slug.trim());
            return this.handleSuccess(res, eventType, 'Event type fetched successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to get event type', error);
        }
    }

    async updateEventType(req, res) {
        try {
            const { id } = req.params;

            // Validate id is a number
            const eventTypeId = parseInt(id);
            if (isNaN(eventTypeId)) {
                return this.handleError(res, 'Invalid event type ID', {
                    name: 'ValidationError',
                    message: 'Event type ID must be a valid number'
                });
            }

            // Validate request body
            const result = updateEventTypeSchema.safeParse(req.body);
            if (!result.success) {
                const formattedError = formatZodError(result.error);
                return this.handleError(res, 'Validation failed', formattedError);
            }

            // Call service to update event type
            const eventType = await this.eventTypeService.updateEventType(eventTypeId, result.data);
            return this.handleSuccess(res, eventType, 'Event type updated successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to update event type', error);
        }
    }

    async deleteEventType(req, res) {
        try {
            const { id } = req.params;

            // Validate id is a number
            const eventTypeId = parseInt(id);
            if (isNaN(eventTypeId)) {
                return this.handleError(res, 'Invalid event type ID', {
                    name: 'ValidationError',
                    message: 'Event type ID must be a valid number'
                });
            }

            // Call service to delete event type
            const result = await this.eventTypeService.deleteEventType(eventTypeId);
            return this.handleSuccess(res, result, 'Event type deleted successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to delete event type', error);
        }
    }

}

const eventTypeController = new EventTypeController();

export default eventTypeController;
