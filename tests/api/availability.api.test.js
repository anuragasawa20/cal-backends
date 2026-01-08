// API Endpoint Tests for Availability
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { setupDatabase, dropTables } from '../../src/core/setupDatabase.js';
import { waitForDB } from '../testUtils.js';

describe('Availability API Endpoints', () => {
    let createdAvailabilityId;
    let createdIntervalId;

    beforeAll(async () => {
        await dropTables();
        await waitForDB();
        await setupDatabase();
        await waitForDB();
    });

    afterAll(async () => {
        await dropTables();
    });

    describe('POST /availability - Create Availability', () => {
        it('should create availability successfully', async () => {
            const response = await request(app)
                .post('/availability')
                .send({
                    name: 'Business Hours',
                    timezone: 'America/New_York',
                    intervals: [
                        { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' },
                        { day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00' }
                    ]
                })
                .expect(201);

            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.name).toBe('Business Hours');
            expect(response.body.data.timezone).toBe('America/New_York');
            expect(response.body.data.intervals).toHaveLength(2);

            createdAvailabilityId = response.body.data.id;
        });

        it('should create availability without intervals', async () => {
            const response = await request(app)
                .post('/availability')
                .send({
                    name: 'Empty Availability',
                    timezone: 'UTC'
                })
                .expect(201);

            expect(response.body.data.intervals).toHaveLength(0);
        });

        it('should return 400 for invalid day_of_week', async () => {
            const response = await request(app)
                .post('/availability')
                .send({
                    name: 'Invalid',
                    intervals: [
                        { day_of_week: 8, start_time: '09:00:00', end_time: '17:00:00' }
                    ]
                })
                .expect(400);
        });

        it('should return 400 when start_time is after end_time', async () => {
            const response = await request(app)
                .post('/availability')
                .send({
                    name: 'Invalid',
                    intervals: [
                        { day_of_week: 1, start_time: '17:00:00', end_time: '09:00:00' }
                    ]
                })
                .expect(400);
        });

        it('should return 400 for missing name', async () => {
            const response = await request(app)
                .post('/availability')
                .send({
                    timezone: 'UTC'
                })
                .expect(400);
        });
    });

    describe('GET /availability - Get All Availabilities', () => {
        it('should get all availabilities', async () => {
            const response = await request(app)
                .get('/availability')
                .expect(200);

            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should return availabilities with intervals', async () => {
            const response = await request(app)
                .get('/availability')
                .expect(200);

            if (response.body.data.length > 0) {
                expect(response.body.data[0]).toHaveProperty('intervals');
            }
        });
    });

    describe('GET /availability/default - Get Default Availability', () => {
        it('should get default availability', async () => {
            const response = await request(app)
                .get('/availability/default')
                .expect(200);

            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('intervals');
        });
    });

    describe('GET /availability/:id - Get Availability by ID', () => {
        it('should get availability by valid ID', async () => {
            if (!createdAvailabilityId) {
                const createResponse = await request(app)
                    .post('/availability')
                    .send({
                        name: 'Test Availability',
                        timezone: 'UTC'
                    });
                createdAvailabilityId = createResponse.body.data.id;
            }

            const response = await request(app)
                .get(`/availability/${createdAvailabilityId}`)
                .expect(200);

            expect(response.body.data.id).toBe(createdAvailabilityId);
        });

        it('should return 404 for non-existent ID', async () => {
            const response = await request(app)
                .get('/availability/99999')
                .expect(404);
        });
    });

    describe('PUT /availability/:id - Update Availability', () => {
        it('should update availability successfully', async () => {
            if (!createdAvailabilityId) {
                const createResponse = await request(app)
                    .post('/availability')
                    .send({
                        name: 'Update Test',
                        timezone: 'UTC'
                    });
                createdAvailabilityId = createResponse.body.data.id;
            }

            const response = await request(app)
                .put(`/availability/${createdAvailabilityId}`)
                .send({
                    name: 'Updated Name',
                    timezone: 'Europe/London'
                })
                .expect(200);

            expect(response.body.data.name).toBe('Updated Name');
            expect(response.body.data.timezone).toBe('Europe/London');
        });

        it('should update intervals', async () => {
            if (!createdAvailabilityId) {
                const createResponse = await request(app)
                    .post('/availability')
                    .send({
                        name: 'Interval Update Test',
                        timezone: 'UTC'
                    });
                createdAvailabilityId = createResponse.body.data.id;
            }

            const response = await request(app)
                .put(`/availability/${createdAvailabilityId}`)
                .send({
                    intervals: [
                        { day_of_week: 1, start_time: '10:00:00', end_time: '18:00:00' }
                    ]
                })
                .expect(200);

            expect(response.body.data.intervals).toHaveLength(1);
        });
    });

    describe('POST /availability/:id/intervals - Add Interval', () => {
        it('should add interval to availability', async () => {
            if (!createdAvailabilityId) {
                const createResponse = await request(app)
                    .post('/availability')
                    .send({
                        name: 'Interval Add Test',
                        timezone: 'UTC'
                    });
                createdAvailabilityId = createResponse.body.data.id;
            }

            const response = await request(app)
                .post(`/availability/${createdAvailabilityId}/intervals`)
                .send({
                    day_of_week: 3,
                    start_time: '10:00:00',
                    end_time: '16:00:00'
                })
                .expect(201);

            expect(response.body.data.day_of_week).toBe(3);
            createdIntervalId = response.body.data.id;
        });

        it('should return 404 for non-existent availability', async () => {
            const response = await request(app)
                .post('/availability/99999/intervals')
                .send({
                    day_of_week: 1,
                    start_time: '09:00:00',
                    end_time: '17:00:00'
                })
                .expect(404);
        });
    });

    describe('DELETE /availability/:id - Delete Availability', () => {
        it('should delete availability successfully', async () => {
            const createResponse = await request(app)
                .post('/availability')
                .send({
                    name: 'Delete Test',
                    timezone: 'UTC'
                });
            const availabilityId = createResponse.body.data.id;

            const response = await request(app)
                .delete(`/availability/${availabilityId}`)
                .expect(200);

            expect(response.body.message).toContain('deleted successfully');
        });

        it('should return 404 for non-existent ID', async () => {
            const response = await request(app)
                .delete('/availability/99999')
                .expect(404);
        });
    });
});

