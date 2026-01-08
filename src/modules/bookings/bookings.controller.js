// Bookings Controller - HTTP request/response handling

import BaseController from '../../core/baseController.js';
import bookingsService from './bookings.service.js';
import { bookingSchema, updateBookingSchema, formatZodError } from '../../core/validationSchema.js';

class BookingsController extends BaseController {
    constructor() {
        super();
        this.bookingsService = bookingsService;
    }

    async getAllBookings(req, res) {
        try {
            const filters = {
                event_type_id: req.query.event_type_id ? parseInt(req.query.event_type_id) : undefined,
                date: req.query.date,
                booking_status: req.query.booking_status,
                client_email: req.query.client_email
            };

            // Remove undefined values
            Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

            const bookings = await this.bookingsService.getAllBookings(filters);
            return this.handleSuccess(res, bookings, 'Bookings fetched successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to get bookings', error);
        }
    }

    async createBooking(req, res) {
        try {
            // Validate request body
            const result = bookingSchema.safeParse(req.body);
            if (!result.success) {
                const formattedError = formatZodError(result.error);
                return this.handleError(res, 'Validation failed', formattedError);
            }

            // Call service to create booking
            const booking = await this.bookingsService.createBooking(result.data);
            return this.handleSuccess(res, booking, 'Booking created successfully', 201);
        } catch (error) {
            return this.handleError(res, 'Failed to create booking', error);
        }
    }

    async getBookingById(req, res) {
        try {
            const { id } = req.params;

            // Validate id is a number
            const bookingId = parseInt(id);
            if (isNaN(bookingId)) {
                return this.handleError(res, 'Invalid booking ID', {
                    name: 'ValidationError',
                    message: 'Booking ID must be a valid number'
                });
            }

            const booking = await this.bookingsService.getBookingById(bookingId);
            return this.handleSuccess(res, booking, 'Booking fetched successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to get booking', error);
        }
    }

    async getBookingsByEventTypeId(req, res) {
        try {
            const { eventTypeId } = req.params;

            // Validate eventTypeId is a number
            const id = parseInt(eventTypeId);
            if (isNaN(id)) {
                return this.handleError(res, 'Invalid event type ID', {
                    name: 'ValidationError',
                    message: 'Event type ID must be a valid number'
                });
            }

            const filters = {
                date: req.query.date,
                booking_status: req.query.booking_status
            };

            // Remove undefined values
            Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

            const bookings = await this.bookingsService.getBookingsByEventTypeId(id, filters);
            return this.handleSuccess(res, bookings, 'Bookings fetched successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to get bookings', error);
        }
    }

    async updateBooking(req, res) {
        try {
            const { id } = req.params;

            // Validate id is a number
            const bookingId = parseInt(id);
            if (isNaN(bookingId)) {
                return this.handleError(res, 'Invalid booking ID', {
                    name: 'ValidationError',
                    message: 'Booking ID must be a valid number'
                });
            }

            // Validate request body
            const result = updateBookingSchema.safeParse(req.body);
            if (!result.success) {
                const formattedError = formatZodError(result.error);
                return this.handleError(res, 'Validation failed', formattedError);
            }

            // Call service to update booking
            const booking = await this.bookingsService.updateBooking(bookingId, result.data);
            return this.handleSuccess(res, booking, 'Booking updated successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to update booking', error);
        }
    }

    async deleteBooking(req, res) {
        try {
            const { id } = req.params;

            // Validate id is a number
            const bookingId = parseInt(id);
            if (isNaN(bookingId)) {
                return this.handleError(res, 'Invalid booking ID', {
                    name: 'ValidationError',
                    message: 'Booking ID must be a valid number'
                });
            }

            // Call service to delete booking
            const result = await this.bookingsService.deleteBooking(bookingId);
            return this.handleSuccess(res, result, 'Booking deleted successfully');
        } catch (error) {
            return this.handleError(res, 'Failed to delete booking', error);
        }
    }
}

const bookingsController = new BookingsController();
export default bookingsController;
