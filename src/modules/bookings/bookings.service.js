// Bookings Service - Business logic
import bookingsModel from './bookings.model.js';
import eventTypeModel from '../eventType/eventType.model.js';
import availabilityModel from '../availability/availability.model.js';
import CustomError from '../../core/customError.js';

class BookingsService {
    constructor() {
        this.bookingsModel = bookingsModel;
        this.eventTypeModel = eventTypeModel;
        this.availabilityModel = availabilityModel;
    }

    // Helper method to enrich booking with event type and availability data
    async enrichBooking(booking) {
        try {
            if (!booking || !booking.event_type_id) {
                return booking;
            }

            // Fetch event type
            const eventType = await this.eventTypeModel.findById(booking.event_type_id);
            if (!eventType) {
                return booking;
            }

            // Fetch availability if available
            let availability = null;
            if (eventType.availability_id) {
                availability = await this.availabilityModel.findById(eventType.availability_id);
            }

            // Return enriched booking
            return {
                ...booking,
                event_type: {
                    id: eventType.id,
                    name: eventType.name,
                    description: eventType.description,
                    duration: eventType.duration,
                    url_slug: eventType.url_slug
                },
                timezone: availability?.timezone || 'UTC',
                location: 'Cal Video', // Default location
                meeting_link: booking.meeting_link || 'https://cal.com/video'
            };
        } catch (error) {
            console.error('Error enriching booking:', error);
            // Return original booking if enrichment fails
            return booking;
        }
    }

    // Helper method to enrich array of bookings
    async enrichBookings(bookings) {
        try {
            return await Promise.all(
                bookings.map(booking => this.enrichBooking(booking))
            );
        } catch (error) {
            console.error('Error enriching bookings:', error);
            return bookings;
        }
    }

    async createBooking(data) {
        try {
            // Validate event type exists
            const eventType = await this.eventTypeModel.findById(data.event_type_id);
            if (!eventType) {
                throw new CustomError(
                    `Event type with id ${data.event_type_id} not found`,
                    404
                );
            }

            // Check for booking conflicts
            const hasConflict = await this.bookingsModel.checkConflict(
                data.event_type_id,
                data.date,
                data.start_time,
                data.end_time
            );

            if (hasConflict) {
                throw new CustomError(
                    'Booking time conflicts with an existing booking',
                    409
                );
            }

            // Validate that end_time is after start_time
            if (new Date(data.start_time) >= new Date(data.end_time)) {
                throw new CustomError(
                    'Start time must be before end time',
                    400
                );
            }

            const booking = await this.bookingsModel.createBooking(data);
            return await this.enrichBooking(booking);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to create booking: ${error.message}`,
                500,
                error
            );
        }
    }

    async getAllBookings(filters = {}) {
        try {
            const bookings = await this.bookingsModel.findAll(filters);
            return await this.enrichBookings(bookings);
        } catch (error) {
            throw new CustomError(
                `Failed to fetch bookings: ${error.message}`,
                500
            );
        }
    }

    async getBookingById(id) {
        try {
            const booking = await this.bookingsModel.findById(id);
            if (!booking) {
                throw new CustomError(
                    `Booking with id ${id} not found`,
                    404
                );
            }
            return await this.enrichBooking(booking);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to fetch booking: ${error.message}`,
                500
            );
        }
    }

    async getBookingsByEventTypeId(eventTypeId, filters = {}) {
        try {
            // Validate event type exists
            const eventType = await this.eventTypeModel.findById(eventTypeId);
            if (!eventType) {
                throw new CustomError(
                    `Event type with id ${eventTypeId} not found`,
                    404
                );
            }

            const bookings = await this.bookingsModel.findByEventTypeId(eventTypeId, filters);
            return await this.enrichBookings(bookings);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to fetch bookings: ${error.message}`,
                500
            );
        }
    }

    async updateBooking(id, data) {
        try {
            // Check if booking exists
            const existing = await this.bookingsModel.findById(id);
            if (!existing) {
                throw new CustomError(
                    `Booking with id ${id} not found`,
                    404
                );
            }

            // Check for conflicts if time is being updated
            if (data.start_time || data.end_time || data.date || data.event_type_id) {
                const eventTypeId = data.event_type_id || existing.event_type_id;
                const date = data.date || existing.date;
                const startTime = data.start_time || existing.start_time;
                const endTime = data.end_time || existing.end_time;

                const hasConflict = await this.bookingsModel.checkConflict(
                    eventTypeId,
                    date,
                    startTime,
                    endTime,
                    id // Exclude current booking
                );

                if (hasConflict) {
                    throw new CustomError(
                        'Updated booking time conflicts with an existing booking',
                        409
                    );
                }
            }

            // Validate that end_time is after start_time if both are provided
            if (data.start_time && data.end_time) {
                if (new Date(data.start_time) >= new Date(data.end_time)) {
                    throw new CustomError(
                        'Start time must be before end time',
                        400
                    );
                }
            } else if (data.start_time && existing.end_time) {
                if (new Date(data.start_time) >= new Date(existing.end_time)) {
                    throw new CustomError(
                        'Start time must be before end time',
                        400
                    );
                }
            } else if (data.end_time && existing.start_time) {
                if (new Date(existing.start_time) >= new Date(data.end_time)) {
                    throw new CustomError(
                        'Start time must be before end time',
                        400
                    );
                }
            }

            const updated = await this.bookingsModel.updateBooking(id, data);
            if (!updated) {
                throw new CustomError(
                    `Failed to update booking`,
                    500
                );
            }

            return await this.enrichBooking(updated);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to update booking: ${error.message}`,
                500
            );
        }
    }

    async deleteBooking(id) {
        try {
            const existing = await this.bookingsModel.findById(id);
            if (!existing) {
                throw new CustomError(
                    `Booking with id ${id} not found`,
                    404
                );
            }

            const deleted = await this.bookingsModel.deleteBooking(id);
            if (!deleted) {
                throw new CustomError(
                    `Failed to delete booking`,
                    500
                );
            }

            return {
                message: 'Booking deleted successfully',
                deletedBooking: deleted
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                `Failed to delete booking: ${error.message}`,
                500
            );
        }
    }
}

const bookingsService = new BookingsService();
export default bookingsService;
