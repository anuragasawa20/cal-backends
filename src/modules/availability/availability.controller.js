// Availability Controller - HTTP request/response handling

import BaseController from '../../core/baseController.js';
import availabilityService from './availability.service.js';
import { availabilitySchema, updateAvailabilitySchema, intervalSchema, formatZodError } from '../../core/validationSchema.js';

class AvailabilityController extends BaseController {
    constructor() {
        super();
        this.availabilityService = availabilityService;
    }

    async getAllAvailabilities(req, res) {
        try {
            const availabilities = await this.availabilityService.getAllAvailabilities();
            return this.handleSuccess(res, availabilities, 'Availabilities fetched successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to get availabilities', error);
        }
    }

    async createAvailability(req, res) {
        try {
            // Validate request body
            const result = availabilitySchema.safeParse(req.body);
            if (!result.success) {
                const formattedError = formatZodError(result.error);
                return this.handleError(res, 'Validation failed', formattedError);
            }

            // Call service to create availability
            const availability = await this.availabilityService.createAvailability(result.data);
            return this.handleSuccess(res, availability, 'Availability created successfully', 201);
        } catch (error) {
            return this.handleError(res, 'Failed to create availability', error);
        }
    }

    async getAvailabilityById(req, res) {
        try {
            const { id } = req.params;

            // Validate id is a number
            const availabilityId = parseInt(id);
            if (isNaN(availabilityId)) {
                return this.handleError(res, 'Invalid availability ID', {
                    name: 'ValidationError',
                    message: 'Availability ID must be a valid number'
                });
            }

            const availability = await this.availabilityService.getAvailabilityById(availabilityId);
            return this.handleSuccess(res, availability, 'Availability fetched successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to get availability', error);
        }
    }

    async updateAvailability(req, res) {
        try {
            const { id } = req.params;

            // Validate id is a number
            const availabilityId = parseInt(id);
            if (isNaN(availabilityId)) {
                return this.handleError(res, 'Invalid availability ID', {
                    name: 'ValidationError',
                    message: 'Availability ID must be a valid number'
                });
            }

            // Validate request body
            const result = updateAvailabilitySchema.safeParse(req.body);
            if (!result.success) {
                const formattedError = formatZodError(result.error);
                return this.handleError(res, 'Validation failed', formattedError);
            }

            // Call service to update availability
            const availability = await this.availabilityService.updateAvailability(availabilityId, result.data);
            return this.handleSuccess(res, availability, 'Availability updated successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to update availability', error);
        }
    }

    async deleteAvailability(req, res) {
        try {
            const { id } = req.params;

            // Validate id is a number
            const availabilityId = parseInt(id);
            if (isNaN(availabilityId)) {
                return this.handleError(res, 'Invalid availability ID', {
                    name: 'ValidationError',
                    message: 'Availability ID must be a valid number'
                });
            }

            // Call service to delete availability
            const result = await this.availabilityService.deleteAvailability(availabilityId);
            return this.handleSuccess(res, result, 'Availability deleted successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to delete availability', error);
        }
    }

    async getDefaultAvailability(req, res) {
        try {
            const availability = await this.availabilityService.getDefaultAvailability();
            if (!availability) {
                return this.handleError(res, 'No availability found', {
                    name: 'NotFoundError',
                    message: 'No availability exists in the system'
                });
            }
            return this.handleSuccess(res, availability, 'Default availability fetched successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to get default availability', error);
        }
    }

    async addInterval(req, res) {
        try {
            const { id } = req.params;
            const { day_of_week, start_time, end_time } = req.body;

            // Validate id is a number
            const availabilityId = parseInt(id);
            if (isNaN(availabilityId)) {
                return this.handleError(res, 'Invalid availability ID', {
                    name: 'ValidationError',
                    message: 'Availability ID must be a valid number'
                });
            }

            // Validate interval data
            const intervalResult = intervalSchema.safeParse({
                day_of_week,
                start_time,
                end_time
            });
            if (!intervalResult.success) {
                const formattedError = formatZodError(intervalResult.error);
                return this.handleError(res, 'Validation failed', formattedError);
            }

            const interval = await this.availabilityService.addInterval(availabilityId, intervalResult.data);
            return this.handleSuccess(res, interval, 'Interval added successfully', 201);
        } catch (error) {
            return this.handleError(res, 'Failed to add interval', error);
        }
    }

    async updateInterval(req, res) {
        try {
            const { intervalId } = req.params;
            const intervalData = req.body;

            // Validate intervalId is a number
            const id = parseInt(intervalId);
            if (isNaN(id)) {
                return this.handleError(res, 'Invalid interval ID', {
                    name: 'ValidationError',
                    message: 'Interval ID must be a valid number'
                });
            }

            // Basic validation
            if (intervalData.day_of_week !== undefined && (intervalData.day_of_week < 1 || intervalData.day_of_week > 7)) {
                return this.handleError(res, 'Validation failed', {
                    name: 'ValidationError',
                    message: 'Day of week must be between 1 and 7'
                });
            }

            const interval = await this.availabilityService.updateInterval(id, intervalData);
            return this.handleSuccess(res, interval, 'Interval updated successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to update interval', error);
        }
    }

    async deleteInterval(req, res) {
        try {
            const { intervalId } = req.params;

            // Validate intervalId is a number
            const id = parseInt(intervalId);
            if (isNaN(id)) {
                return this.handleError(res, 'Invalid interval ID', {
                    name: 'ValidationError',
                    message: 'Interval ID must be a valid number'
                });
            }

            const result = await this.availabilityService.deleteInterval(id);
            return this.handleSuccess(res, result, 'Interval deleted successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to delete interval', error);
        }
    }
}

const availabilityController = new AvailabilityController();
export default availabilityController;
