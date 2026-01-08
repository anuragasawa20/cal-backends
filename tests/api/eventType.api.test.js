// API Endpoint Tests for EventType
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { setupDatabase, dropTables } from '../../src/core/setupDatabase.js';
import { waitForDB } from '../testUtils.js';

describe('EventType API Endpoints', () => {
    let createdEventTypeId;
    let createdAvailabilityId;

    beforeAll(async () => {
        await dropTables();
        await waitForDB();
        await setupDatabase();
        await waitForDB();
    });

    afterAll(async () => {
        await dropTables();
    });

    beforeEach(async () => {
        // Clean up before each test if needed
        await waitForDB();
    });

    describe('POST /event-type - Create Event Type', () => {
        it('should create a new event type successfully', async () => {
            const response = await request(app)
                .post('/event-type')
                .send({
                    name: '30-minute-meeting',
                    description: 'Quick catch-up call',
                    duration: 30
                })
                .expect(201);

            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.name).toBe('30-minute-meeting');
            expect(response.body.data.duration).toBe(30);
            expect(response.body.data).toHaveProperty('availability_id'); // Should have default availability
            expect(response.body.data).toHaveProperty('bookingUrl');

            createdEventTypeId = response.body.data.id;
        });

        it('should create event type with custom url_slug', async () => {
            const response = await request(app)
                .post('/event-type')
                .send({
                    name: 'custom-event',
                    description: 'Custom event',
                    duration: 45,
                    url_slug: 'custom-slug-123'
                })
                .expect(201);

            expect(response.body.data.url_slug).toBe('custom-slug-123');
        });

        it('should return 400 for invalid name (special characters)', async () => {
            const response = await request(app)
                .post('/event-type')
                .send({
                    name: 'invalid name!',
                    duration: 30
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should return 400 for negative duration', async () => {
            const response = await request(app)
                .post('/event-type')
                .send({
                    name: 'test-event',
                    duration: -10
                })
                .expect(400);
        });

        it('should return 400 for duration exceeding 24 hours', async () => {
            const response = await request(app)
                .post('/event-type')
                .send({
                    name: 'test-event',
                    duration: 1441 // More than 24 hours
                })
                .expect(400);
        });

        it('should return 409 for duplicate name', async () => {
            // Create first event type
            await request(app)
                .post('/event-type')
                .send({
                    name: 'duplicate-test',
                    duration: 30
                })
                .expect(201);

            // Try to create duplicate
            const response = await request(app)
                .post('/event-type')
                .send({
                    name: 'duplicate-test',
                    duration: 30
                })
                .expect(409);

            expect(response.body.message).toContain('already exists');
        });

        it('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/event-type')
                .send({
                    description: 'Missing name and duration'
                })
                .expect(400);
        });
    });

    describe('GET /event-type - Get All Event Types', () => {
        it('should get all event types', async () => {
            const response = await request(app)
                .get('/event-type')
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should return event types with bookingUrl', async () => {
            const response = await request(app)
                .get('/event-type')
                .expect(200);

            if (response.body.data.length > 0) {
                expect(response.body.data[0]).toHaveProperty('bookingUrl');
            }
        });
    });

    describe('GET /event-type/:id - Get Event Type by ID', () => {
        it('should get event type by valid ID', async () => {
            if (!createdEventTypeId) {
                // Create one if not exists
                const createResponse = await request(app)
                    .post('/event-type')
                    .send({
                        name: 'get-test-event',
                        duration: 30
                    });
                createdEventTypeId = createResponse.body.data.id;
            }

            const response = await request(app)
                .get(`/event-type/${createdEventTypeId}`)
                .expect(200);

            expect(response.body.data.id).toBe(createdEventTypeId);
            expect(response.body.data).toHaveProperty('bookingUrl');
        });

        it('should return 404 for non-existent ID', async () => {
            const response = await request(app)
                .get('/event-type/99999')
                .expect(404);

            expect(response.body.message).toContain('not found');
        });

        it('should return 400 for invalid ID format', async () => {
            const response = await request(app)
                .get('/event-type/invalid-id')
                .expect(400);
        });
    });

    describe('PUT /event-type/:id - Update Event Type', () => {
        it('should update event type successfully', async () => {
            if (!createdEventTypeId) {
                const createResponse = await request(app)
                    .post('/event-type')
                    .send({
                        name: 'update-test',
                        duration: 30
                    });
                createdEventTypeId = createResponse.body.data.id;
            }

            const response = await request(app)
                .put(`/event-type/${createdEventTypeId}`)
                .send({
                    name: 'updated-name',
                    duration: 60
                })
                .expect(200);

            expect(response.body.data.name).toBe('updated-name');
            expect(response.body.data.duration).toBe(60);
        });

        it('should return 404 for non-existent ID', async () => {
            const response = await request(app)
                .put('/event-type/99999')
                .send({
                    name: 'test'
                })
                .expect(404);
        });

        it('should return 400 for invalid update data', async () => {
            if (!createdEventTypeId) {
                const createResponse = await request(app)
                    .post('/event-type')
                    .send({
                        name: 'update-test-2',
                        duration: 30
                    });
                createdEventTypeId = createResponse.body.data.id;
            }

            const response = await request(app)
                .put(`/event-type/${createdEventTypeId}`)
                .send({
                    duration: -10
                })
                .expect(400);
        });

        it('should allow partial update', async () => {
            if (!createdEventTypeId) {
                const createResponse = await request(app)
                    .post('/event-type')
                    .send({
                        name: 'partial-update',
                        duration: 30
                    });
                createdEventTypeId = createResponse.body.data.id;
            }

            const response = await request(app)
                .put(`/event-type/${createdEventTypeId}`)
                .send({
                    description: 'Updated description only'
                })
                .expect(200);

            expect(response.body.data.description).toBe('Updated description only');
        });
    });

    describe('DELETE /event-type/:id - Delete Event Type', () => {
        it('should delete event type successfully', async () => {
            // Create event type to delete
            const createResponse = await request(app)
                .post('/event-type')
                .send({
                    name: 'delete-test',
                    duration: 30
                });
            const eventTypeId = createResponse.body.data.id;

            const response = await request(app)
                .delete(`/event-type/${eventTypeId}`)
                .expect(200);

            expect(response.body.message).toContain('deleted successfully');
        });

        it('should return 404 for non-existent ID', async () => {
            const response = await request(app)
                .delete('/event-type/99999')
                .expect(404);
        });
    });
});

