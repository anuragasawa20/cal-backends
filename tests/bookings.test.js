// Bookings Tests
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import bookingsModel from '../src/modules/bookings/bookings.model.js';
import bookingsService from '../src/modules/bookings/bookings.service.js';
import eventTypeModel from '../src/modules/eventType/eventType.model.js';
import { setupDatabase, dropTables } from '../src/core/setupDatabase.js';
import { waitForDB } from './testUtils.js';

describe('Bookings Module', () => {
    let eventTypeId;

    beforeEach(async () => {
        await dropTables();
        await waitForDB();
        await setupDatabase();
        await waitForDB();

        // Create an event type for testing
        const eventType = await eventTypeModel.createEventType({
            name: 'test-event',
            description: 'Test event',
            duration: 30
        });
        eventTypeId = eventType.id;
        await waitForDB();
    });

    afterEach(async () => {
        await dropTables();
        await waitForDB();
    });

    describe('Bookings Model', () => {
        it('should create booking', async () => {
            const bookingData = {
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20',
                booking_status: 'confirmed'
            };

            const result = await bookingsModel.createBooking(bookingData);
            expect(result).toBeDefined();
            expect(result.client_email).toBe('test@example.com');
            expect(result.name).toBe('Test User');
            expect(result.booking_status).toBe('confirmed');
        });

        it('should find all bookings', async () => {
            await bookingsModel.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            });

            const bookings = await bookingsModel.findAll();
            expect(bookings.length).toBeGreaterThan(0);
        });

        it('should find bookings with filters', async () => {
            await bookingsModel.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20',
                booking_status: 'confirmed'
            });

            const bookings = await bookingsModel.findAll({
                event_type_id: eventTypeId,
                booking_status: 'confirmed'
            });
            expect(bookings.length).toBeGreaterThan(0);
        });

        it('should find booking by ID', async () => {
            const created = await bookingsModel.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            });

            const found = await bookingsModel.findById(created.id);
            expect(found).toBeDefined();
            expect(found.id).toBe(created.id);
        });

        it('should update booking', async () => {
            const created = await bookingsModel.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            });

            const updated = await bookingsModel.updateBooking(created.id, {
                name: 'Updated User',
                booking_status: 'cancelled'
            });

            expect(updated.name).toBe('Updated User');
            expect(updated.booking_status).toBe('cancelled');
        });

        it('should delete booking', async () => {
            const created = await bookingsModel.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            });

            const deleted = await bookingsModel.deleteBooking(created.id);
            expect(deleted).toBeDefined();

            const found = await bookingsModel.findById(created.id);
            expect(found).toBeNull();
        });

        it('should check for booking conflicts', async () => {
            await bookingsModel.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            });

            const hasConflict = await bookingsModel.checkConflict(
                eventTypeId,
                '2024-12-20',
                new Date('2024-12-20T10:00:00Z'),
                new Date('2024-12-20T10:30:00Z')
            );

            expect(hasConflict).toBe(true);
        });
    });

    describe('Bookings Service', () => {
        it('should create booking with validation', async () => {
            const bookingData = {
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            };

            const result = await bookingsService.createBooking(bookingData);
            expect(result).toBeDefined();
            expect(result.client_email).toBe('test@example.com');
        });

        it('should throw error for non-existent event type', async () => {
            const bookingData = {
                event_type_id: 99999,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            };

            await expect(bookingsService.createBooking(bookingData))
                .rejects.toThrow();
        });

        it('should throw error for conflicting bookings', async () => {
            await bookingsService.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            });

            await expect(bookingsService.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test2@example.com',
                name: 'Test User 2',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            })).rejects.toThrow();
        });

        it('should get all bookings', async () => {
            await bookingsService.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            });

            const bookings = await bookingsService.getAllBookings();
            expect(bookings.length).toBeGreaterThan(0);
        });

        it('should get bookings by event type ID', async () => {
            await bookingsService.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            });

            const bookings = await bookingsService.getBookingsByEventTypeId(eventTypeId);
            expect(bookings.length).toBeGreaterThan(0);
        });

        it('should update booking', async () => {
            const created = await bookingsService.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            });

            const updated = await bookingsService.updateBooking(created.id, {
                name: 'Updated User'
            });

            expect(updated.name).toBe('Updated User');
        });

        it('should delete booking', async () => {
            const created = await bookingsService.createBooking({
                event_type_id: eventTypeId,
                client_email: 'test@example.com',
                name: 'Test User',
                start_time: new Date('2024-12-20T10:00:00Z'),
                end_time: new Date('2024-12-20T10:30:00Z'),
                date: '2024-12-20'
            });

            const result = await bookingsService.deleteBooking(created.id);
            expect(result).toBeDefined();
            expect(result.message).toBe('Booking deleted successfully');
        });
    });
});

