// EventType Tests
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import eventTypeModel from '../src/modules/eventType/eventType.model.js';
import eventTypeService from '../src/modules/eventType/eventType.service.js';
import availabilityModel from '../src/modules/availability/availability.model.js';
import { setupDatabase, dropTables } from '../src/core/setupDatabase.js';
import { waitForDB } from './testUtils.js';

describe('EventType Module', () => {
    beforeEach(async () => {
        await dropTables();
        await waitForDB();
        await setupDatabase();
        await waitForDB();
    });

    afterEach(async () => {
        await dropTables();
        await waitForDB();
    });

    describe('EventType Model', () => {
        it('should create event type', async () => {
            const eventType = {
                name: 'test-event',
                description: 'Test event',
                duration: 30
            };

            const result = await eventTypeModel.createEventType(eventType);
            expect(result).toBeDefined();
            expect(result.name).toBe('test-event');
            expect(result.duration).toBe(30);
        });

        it('should create event type with url_slug', async () => {
            const eventType = {
                name: 'test-event',
                description: 'Test event',
                duration: 30,
                url_slug: 'custom-slug'
            };

            const result = await eventTypeModel.createEventType(eventType);
            expect(result.url_slug).toBe('custom-slug');
        });

        it('should create event type with availability_id', async () => {
            const availability = await availabilityModel.getDefaultAvailability();

            const eventType = {
                name: 'test-event',
                description: 'Test event',
                duration: 30,
                availability_id: availability.id
            };

            const result = await eventTypeModel.createEventType(eventType);
            expect(result.availability_id).toBe(availability.id);
        });

        it('should find all event types', async () => {
            await eventTypeModel.createEventType({
                name: 'event1',
                duration: 30
            });

            const eventTypes = await eventTypeModel.findAll();
            expect(eventTypes.length).toBeGreaterThan(0);
        });

        it('should find event type by ID', async () => {
            const created = await eventTypeModel.createEventType({
                name: 'test-event',
                duration: 30
            });

            const found = await eventTypeModel.findById(created.id);
            expect(found).toBeDefined();
            expect(found.id).toBe(created.id);
        });

        it('should update event type', async () => {
            const created = await eventTypeModel.createEventType({
                name: 'test-event',
                duration: 30
            });

            const updated = await eventTypeModel.updateEventType(created.id, {
                name: 'updated-event',
                duration: 60
            });

            expect(updated.name).toBe('updated-event');
            expect(updated.duration).toBe(60);
        });

        it('should delete event type', async () => {
            const created = await eventTypeModel.createEventType({
                name: 'test-event',
                duration: 30
            });

            const deleted = await eventTypeModel.deleteEventType(created.id);
            expect(deleted).toBeDefined();

            const found = await eventTypeModel.findById(created.id);
            expect(found).toBeNull();
        });
    });

    describe('EventType Service', () => {
        it('should create event type with default availability', async () => {
            const eventTypeData = {
                name: 'test-event',
                description: 'Test event',
                duration: 30
            };

            const result = await eventTypeService.createEventType(eventTypeData);
            expect(result).toBeDefined();
            expect(result.availability_id).toBeDefined();
            expect(result.bookingUrl).toBe('/book/test-event');
        });

        it('should throw error for duplicate name', async () => {
            await eventTypeService.createEventType({
                name: 'test-event',
                duration: 30
            });

            await expect(eventTypeService.createEventType({
                name: 'test-event',
                duration: 30
            })).rejects.toThrow();
        });

        it('should get all event types', async () => {
            await eventTypeService.createEventType({
                name: 'event1',
                duration: 30
            });

            const eventTypes = await eventTypeService.getAllEventTypes();
            expect(eventTypes.length).toBeGreaterThan(0);
        });

        it('should get event type by ID', async () => {
            const created = await eventTypeService.createEventType({
                name: 'test-event',
                duration: 30
            });

            const found = await eventTypeService.getEventTypeById(created.id);
            expect(found).toBeDefined();
            expect(found.id).toBe(created.id);
        });

        it('should throw error when getting non-existent event type', async () => {
            await expect(eventTypeService.getEventTypeById(99999))
                .rejects.toThrow();
        });

        it('should update event type', async () => {
            const created = await eventTypeService.createEventType({
                name: 'test-event',
                duration: 30
            });

            const updated = await eventTypeService.updateEventType(created.id, {
                name: 'updated-event',
                duration: 60
            });

            expect(updated.name).toBe('updated-event');
            expect(updated.duration).toBe(60);
        });

        it('should update availability_id', async () => {
            const created = await eventTypeService.createEventType({
                name: 'test-event',
                duration: 30
            });

            const newAvailability = await availabilityModel.createAvailability({
                name: 'New Availability',
                timezone: 'UTC'
            });

            const updated = await eventTypeService.updateEventType(created.id, {
                availability_id: newAvailability.id
            });

            expect(updated.availability_id).toBe(newAvailability.id);
        });

        it('should delete event type', async () => {
            const created = await eventTypeService.createEventType({
                name: 'test-event',
                duration: 30
            });

            const result = await eventTypeService.deleteEventType(created.id);
            expect(result).toBeDefined();
            expect(result.message).toBe('Event type deleted successfully');
        });
    });
});

