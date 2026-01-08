// API Endpoint Tests for Bookings
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { setupDatabase, dropTables } from '../../src/core/setupDatabase.js';
import { waitForDB } from '../testUtils.js';

describe('Bookings API Endpoints', () => {
    let eventTypeId;
    let bookingId;

    beforeAll(async () => {
        await dropTables();
        await waitForDB();
        await setupDatabase();
        await waitForDB();

        // Create an event type for booking tests
        const eventTypeResponse = await request(app)
            .post('/event-type')
            .send({
                name: 'booking-test-event',
                description: 'Event for booking tests',
                duration: 30
            });
        eventTypeId = eventTypeResponse.body.data.id;
    });

    afterAll(async () => {
        await dropTables();
    });

    describe('POST /bookings - Create Booking', () => {
        it('should create booking successfully', async () => {
            const bookingDate = new Date();
            bookingDate.setDate(bookingDate.getDate() + 1); // Tomorrow
            const startTime = new Date(bookingDate);
            startTime.setHours(10, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 30);

            const response = await request(app)
                .post('/bookings')
                .send({
                    event_type_id: eventTypeId,
                    client_email: 'test@example.com',
                    name: 'John Doe',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    date: bookingDate.toISOString().split('T')[0],
                    booking_status: 'confirmed'
                })
                .expect(201);

            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.client_email).toBe('test@example.com');
            expect(response.body.data.name).toBe('John Doe');
            bookingId = response.body.data.id;
        });

        it('should return 400 for invalid email', async () => {
            const bookingDate = new Date();
            bookingDate.setDate(bookingDate.getDate() + 1);
            const startTime = new Date(bookingDate);
            startTime.setHours(11, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 30);

            const response = await request(app)
                .post('/bookings')
                .send({
                    event_type_id: eventTypeId,
                    client_email: 'invalid-email',
                    name: 'Test User',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    date: bookingDate.toISOString().split('T')[0]
                })
                .expect(400);
        });

        it('should return 400 when start_time is after end_time', async () => {
            const bookingDate = new Date();
            bookingDate.setDate(bookingDate.getDate() + 1);
            const startTime = new Date(bookingDate);
            startTime.setHours(12, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setHours(11, 0, 0, 0); // End before start

            const response = await request(app)
                .post('/bookings')
                .send({
                    event_type_id: eventTypeId,
                    client_email: 'test@example.com',
                    name: 'Test User',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    date: bookingDate.toISOString().split('T')[0]
                })
                .expect(400);
        });

        it('should return 404 for non-existent event_type_id', async () => {
            const bookingDate = new Date();
            bookingDate.setDate(bookingDate.getDate() + 1);
            const startTime = new Date(bookingDate);
            startTime.setHours(10, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 30);

            const response = await request(app)
                .post('/bookings')
                .send({
                    event_type_id: 99999,
                    client_email: 'test@example.com',
                    name: 'Test User',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    date: bookingDate.toISOString().split('T')[0]
                })
                .expect(404);
        });

        it('should return 409 for conflicting booking times', async () => {
            const bookingDate = new Date();
            bookingDate.setDate(bookingDate.getDate() + 1);
            const startTime = new Date(bookingDate);
            startTime.setHours(14, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 30);

            // Create first booking
            await request(app)
                .post('/bookings')
                .send({
                    event_type_id: eventTypeId,
                    client_email: 'first@example.com',
                    name: 'First User',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    date: bookingDate.toISOString().split('T')[0]
                })
                .expect(201);

            // Try to create conflicting booking
            const response = await request(app)
                .post('/bookings')
                .send({
                    event_type_id: eventTypeId,
                    client_email: 'second@example.com',
                    name: 'Second User',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    date: bookingDate.toISOString().split('T')[0]
                })
                .expect(409);
        });

        it('should allow booking with meeting_link', async () => {
            const bookingDate = new Date();
            bookingDate.setDate(bookingDate.getDate() + 2);
            const startTime = new Date(bookingDate);
            startTime.setHours(15, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 30);

            const response = await request(app)
                .post('/bookings')
                .send({
                    event_type_id: eventTypeId,
                    client_email: 'zoom@example.com',
                    name: 'Zoom User',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    date: bookingDate.toISOString().split('T')[0],
                    meeting_link: 'https://zoom.us/j/123456789'
                })
                .expect(201);

            expect(response.body.data.meeting_link).toBe('https://zoom.us/j/123456789');
        });
    });

    describe('GET /bookings - Get All Bookings', () => {
        it('should get all bookings', async () => {
            const response = await request(app)
                .get('/bookings')
                .expect(200);

            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should filter bookings by event_type_id', async () => {
            const response = await request(app)
                .get(`/bookings?event_type_id=${eventTypeId}`)
                .expect(200);

            expect(response.body.data).toBeInstanceOf(Array);
            if (response.body.data.length > 0) {
                expect(response.body.data[0].event_type_id).toBe(eventTypeId);
            }
        });

        it('should filter bookings by booking_status', async () => {
            const response = await request(app)
                .get('/bookings?booking_status=confirmed')
                .expect(200);

            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    describe('GET /bookings/:id - Get Booking by ID', () => {
        it('should get booking by valid ID', async () => {
            if (!bookingId) {
                // Create a booking first
                const bookingDate = new Date();
                bookingDate.setDate(bookingDate.getDate() + 3);
                const startTime = new Date(bookingDate);
                startTime.setHours(10, 0, 0, 0);
                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + 30);

                const createResponse = await request(app)
                    .post('/bookings')
                    .send({
                        event_type_id: eventTypeId,
                        client_email: 'get@example.com',
                        name: 'Get Test User',
                        start_time: startTime.toISOString(),
                        end_time: endTime.toISOString(),
                        date: bookingDate.toISOString().split('T')[0]
                    });
                bookingId = createResponse.body.data.id;
            }

            const response = await request(app)
                .get(`/bookings/${bookingId}`)
                .expect(200);

            expect(response.body.data.id).toBe(bookingId);
        });

        it('should return 404 for non-existent ID', async () => {
            const response = await request(app)
                .get('/bookings/99999')
                .expect(404);
        });
    });

    describe('GET /bookings/event-type/:eventTypeId - Get Bookings by Event Type', () => {
        it('should get bookings for event type', async () => {
            const response = await request(app)
                .get(`/bookings/event-type/${eventTypeId}`)
                .expect(200);

            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should return 404 for non-existent event type', async () => {
            const response = await request(app)
                .get('/bookings/event-type/99999')
                .expect(404);
        });
    });

    describe('PUT /bookings/:id - Update Booking', () => {
        it('should update booking successfully', async () => {
            if (!bookingId) {
                const bookingDate = new Date();
                bookingDate.setDate(bookingDate.getDate() + 4);
                const startTime = new Date(bookingDate);
                startTime.setHours(10, 0, 0, 0);
                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + 30);

                const createResponse = await request(app)
                    .post('/bookings')
                    .send({
                        event_type_id: eventTypeId,
                        client_email: 'update@example.com',
                        name: 'Update Test',
                        start_time: startTime.toISOString(),
                        end_time: endTime.toISOString(),
                        date: bookingDate.toISOString().split('T')[0]
                    });
                bookingId = createResponse.body.data.id;
            }

            const response = await request(app)
                .put(`/bookings/${bookingId}`)
                .send({
                    name: 'Updated Name',
                    booking_status: 'cancelled'
                })
                .expect(200);

            expect(response.body.data.name).toBe('Updated Name');
            expect(response.body.data.booking_status).toBe('cancelled');
        });

        it('should return 404 for non-existent ID', async () => {
            const response = await request(app)
                .put('/bookings/99999')
                .send({
                    name: 'Test'
                })
                .expect(404);
        });
    });

    describe('DELETE /bookings/:id - Delete Booking', () => {
        it('should delete booking successfully', async () => {
            // Create a booking to delete
            const bookingDate = new Date();
            bookingDate.setDate(bookingDate.getDate() + 5);
            const startTime = new Date(bookingDate);
            startTime.setHours(10, 0, 0, 0);
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 30);

            const createResponse = await request(app)
                .post('/bookings')
                .send({
                    event_type_id: eventTypeId,
                    client_email: 'delete@example.com',
                    name: 'Delete Test',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    date: bookingDate.toISOString().split('T')[0]
                });
            const deleteBookingId = createResponse.body.data.id;

            const response = await request(app)
                .delete(`/bookings/${deleteBookingId}`)
                .expect(200);

            expect(response.body.message).toContain('deleted successfully');
        });

        it('should return 404 for non-existent ID', async () => {
            const response = await request(app)
                .delete('/bookings/99999')
                .expect(404);
        });
    });
});

