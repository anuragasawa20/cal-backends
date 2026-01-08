// Availability Tests
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import pool from '../src/core/db.js';
import availabilityModel from '../src/modules/availability/availability.model.js';
import availabilityService from '../src/modules/availability/availability.service.js';
import { setupDatabase, dropTables } from '../src/core/setupDatabase.js';
import { waitForDB } from './testUtils.js';

describe('Availability Module', () => {
    beforeEach(async () => {
        // Drop and recreate tables before each test
        await dropTables();
        await waitForDB();
        await setupDatabase();
        await waitForDB();
    });

    afterEach(async () => {
        // Clean up after each test
        await dropTables();
        await waitForDB();
    });

    describe('Availability Model', () => {
        it('should create availability with intervals', async () => {
            const availabilityData = {
                name: 'Test Availability',
                timezone: 'UTC',
                intervals: [
                    { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00' }
                ]
            };

            const result = await availabilityModel.createAvailability(availabilityData);

            expect(result).toBeDefined();
            expect(result.name).toBe('Test Availability');
            expect(result.timezone).toBe('UTC');
            expect(result.intervals).toHaveLength(2);
            expect(result.intervals[0].day_of_week).toBe(1);
        });

        it('should find all availabilities', async () => {
            // Create default availability
            await availabilityModel.createAvailability({
                name: 'Availability 1',
                timezone: 'UTC'
            });

            const availabilities = await availabilityModel.findAll();
            expect(availabilities.length).toBeGreaterThan(0);
        });

        it('should find availability by ID', async () => {
            const created = await availabilityModel.createAvailability({
                name: 'Test Availability',
                timezone: 'UTC'
            });

            const found = await availabilityModel.findById(created.id);
            expect(found).toBeDefined();
            expect(found.id).toBe(created.id);
            expect(found.name).toBe('Test Availability');
        });

        it('should update availability', async () => {
            const created = await availabilityModel.createAvailability({
                name: 'Test Availability',
                timezone: 'UTC'
            });

            const updated = await availabilityModel.updateAvailability(created.id, {
                name: 'Updated Availability',
                timezone: 'America/New_York'
            });

            expect(updated.name).toBe('Updated Availability');
            expect(updated.timezone).toBe('America/New_York');
        });

        it('should delete availability', async () => {
            const created = await availabilityModel.createAvailability({
                name: 'Test Availability',
                timezone: 'UTC'
            });

            const deleted = await availabilityModel.deleteAvailability(created.id);
            expect(deleted).toBeDefined();

            const found = await availabilityModel.findById(created.id);
            expect(found).toBeNull();
        });

        it('should get intervals by availability ID', async () => {
            const created = await availabilityModel.createAvailability({
                name: 'Test Availability',
                timezone: 'UTC',
                intervals: [
                    { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' }
                ]
            });

            const intervals = await availabilityModel.getIntervalsByAvailabilityId(created.id);
            expect(intervals).toHaveLength(1);
            expect(intervals[0].day_of_week).toBe(1);
        });

        it('should add interval to availability', async () => {
            const created = await availabilityModel.createAvailability({
                name: 'Test Availability',
                timezone: 'UTC'
            });

            const interval = await availabilityModel.addInterval(created.id, {
                day_of_week: 1,
                start_time: '09:00:00',
                end_time: '17:00:00'
            });

            expect(interval).toBeDefined();
            expect(interval.availability_id).toBe(created.id);
            expect(interval.day_of_week).toBe(1);
        });

        it('should get default availability', async () => {
            // Default availability should be created by setupDatabase
            const defaultAvailability = await availabilityModel.getDefaultAvailability();
            expect(defaultAvailability).toBeDefined();
        });
    });

    describe('Availability Service', () => {
        it('should create availability with validation', async () => {
            const availabilityData = {
                name: 'Service Test',
                timezone: 'UTC',
                intervals: [
                    { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' }
                ]
            };

            const result = await availabilityService.createAvailability(availabilityData);
            expect(result).toBeDefined();
            expect(result.name).toBe('Service Test');
        });

        it('should throw error for invalid day of week', async () => {
            const availabilityData = {
                name: 'Invalid Test',
                intervals: [
                    { day_of_week: 8, start_time: '09:00:00', end_time: '17:00:00' }
                ]
            };

            await expect(availabilityService.createAvailability(availabilityData))
                .rejects.toThrow();
        });

        it('should throw error when start time is after end time', async () => {
            const availabilityData = {
                name: 'Invalid Test',
                intervals: [
                    { day_of_week: 1, start_time: '17:00:00', end_time: '09:00:00' }
                ]
            };

            await expect(availabilityService.createAvailability(availabilityData))
                .rejects.toThrow();
        });

        it('should update availability', async () => {
            const created = await availabilityService.createAvailability({
                name: 'Test',
                timezone: 'UTC'
            });

            const updated = await availabilityService.updateAvailability(created.id, {
                name: 'Updated'
            });

            expect(updated.name).toBe('Updated');
        });

        it('should throw error when updating non-existent availability', async () => {
            await expect(availabilityService.updateAvailability(99999, { name: 'Test' }))
                .rejects.toThrow();
        });
    });
});

