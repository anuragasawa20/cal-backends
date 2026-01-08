// Availability Service - Business logic
import availabilityModel from './availability.model.js';
import CustomError from '../../core/customError.js';

class AvailabilityService {
    constructor() {
        this.availabilityModel = availabilityModel;
    }

    async createAvailability(data) {
        try {
            // Validate intervals if provided
            if (data.intervals && Array.isArray(data.intervals)) {
                for (const interval of data.intervals) {
                    if (interval.day_of_week < 1 || interval.day_of_week > 7) {
                        throw new CustomError(
                            'Day of week must be between 1 and 7',
                            400
                        );
                    }
                    if (interval.start_time >= interval.end_time) {
                        throw new CustomError(
                            'Start time must be before end time',
                            400
                        );
                    }
                }
            }

            const availability = await this.availabilityModel.createAvailability(data);
            return availability;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to create availability: ${error.message}`,
                500,
                error
            );
        }
    }

    async getAllAvailabilities() {
        try {
            const availabilities = await this.availabilityModel.findAll();
            return availabilities;
        } catch (error) {
            throw new CustomError(
                `Failed to fetch availabilities: ${error.message}`,
                500
            );
        }
    }

    async getAvailabilityById(id) {
        try {
            const availability = await this.availabilityModel.findById(id);
            if (!availability) {
                throw new CustomError(
                    `Availability with id ${id} not found`,
                    404
                );
            }
            return availability;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to fetch availability: ${error.message}`,
                500
            );
        }
    }

    async updateAvailability(id, data) {
        try {
            // Check if availability exists
            const existing = await this.availabilityModel.findById(id);
            if (!existing) {
                throw new CustomError(
                    `Availability with id ${id} not found`,
                    404
                );
            }

            // Validate intervals if provided
            if (data.intervals && Array.isArray(data.intervals)) {
                for (const interval of data.intervals) {
                    if (interval.day_of_week < 1 || interval.day_of_week > 7) {
                        throw new CustomError(
                            'Day of week must be between 1 and 7',
                            400
                        );
                    }
                    if (interval.start_time >= interval.end_time) {
                        throw new CustomError(
                            'Start time must be before end time',
                            400
                        );
                    }
                }
            }

            const updated = await this.availabilityModel.updateAvailability(id, data);
            if (!updated) {
                throw new CustomError(
                    `Failed to update availability`,
                    500
                );
            }

            return updated;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to update availability: ${error.message}`,
                500
            );
        }
    }

    async deleteAvailability(id) {
        try {
            const existing = await this.availabilityModel.findById(id);
            if (!existing) {
                throw new CustomError(
                    `Availability with id ${id} not found`,
                    404
                );
            }

            const deleted = await this.availabilityModel.deleteAvailability(id);
            if (!deleted) {
                throw new CustomError(
                    `Failed to delete availability`,
                    500
                );
            }

            return {
                message: 'Availability deleted successfully',
                deletedAvailability: deleted
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to delete availability: ${error.message}`,
                500
            );
        }
    }

    async getDefaultAvailability() {
        try {
            return await this.availabilityModel.getDefaultAvailability();
        } catch (error) {
            throw new CustomError(
                `Failed to get default availability: ${error.message}`,
                500
            );
        }
    }

    async addInterval(availabilityId, interval) {
        try {
            const availability = await this.availabilityModel.findById(availabilityId);
            if (!availability) {
                throw new CustomError(
                    `Availability with id ${availabilityId} not found`,
                    404
                );
            }

            if (interval.day_of_week < 1 || interval.day_of_week > 7) {
                throw new CustomError(
                    'Day of week must be between 1 and 7',
                    400
                );
            }

            if (interval.start_time >= interval.end_time) {
                throw new CustomError(
                    'Start time must be before end time',
                    400
                );
            }

            return await this.availabilityModel.addInterval(availabilityId, interval);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to add interval: ${error.message}`,
                500
            );
        }
    }

    async updateInterval(intervalId, interval) {
        try {
            if (interval.day_of_week !== undefined && (interval.day_of_week < 1 || interval.day_of_week > 7)) {
                throw new CustomError(
                    'Day of week must be between 1 and 7',
                    400
                );
            }

            if (interval.start_time !== undefined && interval.end_time !== undefined) {
                if (interval.start_time >= interval.end_time) {
                    throw new CustomError(
                        'Start time must be before end time',
                        400
                    );
                }
            }

            const updated = await this.availabilityModel.updateInterval(intervalId, interval);
            if (!updated) {
                throw new CustomError(
                    `Interval with id ${intervalId} not found`,
                    404
                );
            }

            return updated;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to update interval: ${error.message}`,
                500
            );
        }
    }

    async deleteInterval(intervalId) {
        try {
            const deleted = await this.availabilityModel.deleteInterval(intervalId);
            if (!deleted) {
                throw new CustomError(
                    `Interval with id ${intervalId} not found`,
                    404
                );
            }

            return {
                message: 'Interval deleted successfully',
                deletedInterval: deleted
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to delete interval: ${error.message}`,
                500
            );
        }
    }
}

const availabilityService = new AvailabilityService();
export default availabilityService;
