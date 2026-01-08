// EventType Service - Business logic
import eventTypeModel from './eventType.model.js';
import availabilityModel from '../availability/availability.model.js';
import CustomError from '../../core/customError.js';
import pool from '../../core/db.js';

class EventTypeService {

    async createEventType(data) {
        try {
            // Business logic: Check if name already exists
            const existing = await eventTypeModel.findByName(data.name);
            if (existing) {
                throw new CustomError(
                    `Event type with name "${data.name}" already exists`,
                    409, // Conflict status code
                    { name: data.name }
                );
            }

            // Business logic: If no availability_id provided, use default availability
            let availabilityId = data.availability_id;
            if (!availabilityId) {
                const defaultAvailability = await availabilityModel.getDefaultAvailability();
                if (defaultAvailability) {
                    availabilityId = defaultAvailability.id;
                } else {
                    // Create default availability (2PM-10PM for all days) if none exists
                    const client = await pool.connect();
                    try {
                        await client.query('BEGIN');

                        // Create default availability
                        const availabilityResult = await client.query(
                            `INSERT INTO availability (name, timezone) 
                             VALUES ('Default Availability', 'UTC') 
                             RETURNING id`
                        );
                        availabilityId = availabilityResult.rows[0].id;

                        // Create intervals for all 7 days (2PM to 10PM)
                        for (let day = 1; day <= 7; day++) {
                            await client.query(
                                `INSERT INTO availability_interval (availability_id, day_of_week, start_time, end_time) 
                                 VALUES ($1, $2, $3::TIME, $4::TIME)`,
                                [availabilityId, day, '14:00:00', '22:00:00']
                            );
                        }

                        await client.query('COMMIT');
                    } catch (error) {
                        await client.query('ROLLBACK');
                        throw error;
                    } finally {
                        client.release();
                    }
                }
            }

            // Call model to insert with availability_id
            const eventTypeData = {
                ...data,
                availability_id: availabilityId
            };
            const newEventType = await eventTypeModel.createEventType(eventTypeData);

            // Business logic: Add booking URL based on name or url_slug
            return {
                ...newEventType,
                bookingUrl: `/book/${newEventType.url_slug || newEventType.name}`
            };
        }
        catch (error) {
            // Re-throw CustomError as-is
            if (error instanceof CustomError) {
                throw error;
            }
            // Wrap other errors
            throw new CustomError(
                `Failed to create event type: ${error.message}`,
                500,
                error
            );
        }
    }

    async getAllEventTypes() {
        try {
            const eventTypes = await eventTypeModel.findAll();
            return eventTypes;
        } catch (error) {
            throw new CustomError(
                `Failed to fetch event types: ${error.message}`,
                500
            );
        }
    }

    async getEventTypeById(id) {
        try {
            const eventType = await eventTypeModel.findById(id);
            if (!eventType) {
                throw new CustomError(
                    `Event type with id ${id} not found`,
                    404
                );
            }
            return {
                ...eventType,
                bookingUrl: `/book/${eventType.url_slug || eventType.name}`
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to fetch event type: ${error.message}`,
                500
            );
        }
    }

    async getEventTypeBySlug(slug) {
        try {
            const eventType = await eventTypeModel.findBySlug(slug);
            if (!eventType) {
                throw new CustomError(
                    `Event type with slug "${slug}" not found`,
                    404
                );
            }
            return {
                ...eventType,
                bookingUrl: `/book/${eventType.url_slug || eventType.name}`
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to fetch event type: ${error.message}`,
                500
            );
        }
    }

    async updateEventType(id, data) {
        try {
            // Business logic: Check if event type exists
            const existing = await eventTypeModel.findById(id);
            if (!existing) {
                throw new CustomError(
                    `Event type with id ${id} not found`,
                    404
                );
            }

            // Business logic: If name is being updated, check if new name already exists
            if (data.name && data.name !== existing.name) {
                const nameExists = await eventTypeModel.findByName(data.name);
                if (nameExists) {
                    throw new CustomError(
                        `Event type with name "${data.name}" already exists`,
                        409
                    );
                }
            }

            // Call model to update
            const updated = await eventTypeModel.updateEventType(id, data);
            if (!updated) {
                throw new CustomError(
                    `Failed to update event type`,
                    500
                );
            }

            // Business logic: Add booking URL based on name or url_slug
            return {
                ...updated,
                bookingUrl: `/book/${updated.url_slug || updated.name}`
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to update event type: ${error.message}`,
                500
            );
        }
    }

    async deleteEventType(id) {
        try {
            // Business logic: Check if event type exists
            const existing = await eventTypeModel.findById(id);
            if (!existing) {
                throw new CustomError(
                    `Event type with id ${id} not found`,
                    404
                );
            }

            // Call model to delete
            const deleted = await eventTypeModel.deleteEventType(id);
            if (!deleted) {
                throw new CustomError(
                    `Failed to delete event type`,
                    500
                );
            }

            return {
                message: 'Event type deleted successfully',
                deletedEventType: deleted
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to delete event type: ${error.message}`,
                500
            );
        }
    }
}

const eventTypeService = new EventTypeService();
export default eventTypeService;

