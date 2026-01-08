import express from 'express';
import bookingsController from './bookings.controller.js';

const router = express.Router();

// Get all bookings (with optional filters via query params)
router.get('/', bookingsController.getAllBookings.bind(bookingsController));

// Get bookings by event type ID
router.get('/event-type/:eventTypeId', bookingsController.getBookingsByEventTypeId.bind(bookingsController));

// Get booking by ID
router.get('/:id', bookingsController.getBookingById.bind(bookingsController));

// Create booking
router.post('/', bookingsController.createBooking.bind(bookingsController));

// Update booking
router.put('/:id', bookingsController.updateBooking.bind(bookingsController));

// Delete booking
router.delete('/:id', bookingsController.deleteBooking.bind(bookingsController));

export default router;
