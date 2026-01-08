// Availability Model - Database operations
import pool from '../../core/db.js';

class AvailabilityModel {
    constructor() {
        this.pool = pool;
    }

    // Create availability with intervals
    async createAvailability(availabilityData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { name, timezone = 'UTC', intervals = [] } = availabilityData;

            // Insert availability
            const availabilityResult = await client.query(
                'INSERT INTO availability (name, timezone) VALUES ($1, $2) RETURNING *',
                [name, timezone]
            );
            const availability = availabilityResult.rows[0];

            // Insert intervals if provided
            if (intervals.length > 0) {
                for (const interval of intervals) {
                    await client.query(
                        `INSERT INTO availability_interval (availability_id, day_of_week, start_time, end_time)
                         VALUES ($1, $2, $3::TIME, $4::TIME)`,
                        [availability.id, interval.day_of_week, interval.start_time, interval.end_time]
                    );
                }
            }

            await client.query('COMMIT');

            // Fetch the complete availability with intervals
            return await this.findById(availability.id);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error creating availability:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Find all availabilities with their intervals
    async findAll() {
        try {
            const availabilitiesResult = await pool.query(
                'SELECT * FROM availability ORDER BY created_at DESC'
            );

            const availabilities = await Promise.all(
                availabilitiesResult.rows.map(async (availability) => {
                    const intervals = await this.getIntervalsByAvailabilityId(availability.id);
                    return {
                        ...availability,
                        intervals
                    };
                })
            );

            return availabilities;
        } catch (error) {
            console.error('Error fetching availabilities:', error);
            throw error;
        }
    }

    // Find availability by ID with intervals
    async findById(id) {
        try {
            const availabilityResult = await pool.query(
                'SELECT * FROM availability WHERE id = $1',
                [id]
            );

            if (availabilityResult.rows.length === 0) {
                return null;
            }

            const availability = availabilityResult.rows[0];
            const intervals = await this.getIntervalsByAvailabilityId(id);

            return {
                ...availability,
                intervals
            };
        } catch (error) {
            console.error('Error finding availability by id:', error);
            throw error;
        }
    }

    // Get intervals by availability ID
    async getIntervalsByAvailabilityId(availabilityId) {
        try {
            const intervalsResult = await pool.query(
                'SELECT * FROM availability_interval WHERE availability_id = $1 ORDER BY day_of_week, start_time',
                [availabilityId]
            );
            return intervalsResult.rows;
        } catch (error) {
            console.error('Error fetching intervals:', error);
            throw error;
        }
    }

    // Update availability
    async updateAvailability(id, availabilityData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { name, timezone, intervals } = availabilityData;
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (name !== undefined) {
                updates.push(`name = $${paramIndex}`);
                values.push(name);
                paramIndex++;
            }

            if (timezone !== undefined) {
                updates.push(`timezone = $${paramIndex}`);
                values.push(timezone);
                paramIndex++;
            }

            if (updates.length > 0) {
                updates.push('updated_at = CURRENT_TIMESTAMP');
                values.push(id);

                await client.query(
                    `UPDATE availability 
                     SET ${updates.join(', ')}
                     WHERE id = $${paramIndex}
                     RETURNING *`,
                    values
                );
            }

            // Update intervals if provided
            if (intervals !== undefined) {
                // Delete existing intervals
                await client.query(
                    'DELETE FROM availability_interval WHERE availability_id = $1',
                    [id]
                );

                // Insert new intervals
                if (intervals.length > 0) {
                    for (const interval of intervals) {
                        await client.query(
                            `INSERT INTO availability_interval (availability_id, day_of_week, start_time, end_time)
                             VALUES ($1, $2, $3::TIME, $4::TIME)`,
                            [id, interval.day_of_week, interval.start_time, interval.end_time]
                        );
                    }
                }
            }

            await client.query('COMMIT');

            // Fetch updated availability with intervals
            return await this.findById(id);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating availability:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Delete availability (will cascade delete intervals)
    async deleteAvailability(id) {
        try {
            const availability = await this.findById(id);
            if (!availability) {
                return null;
            }

            await pool.query('DELETE FROM availability WHERE id = $1 RETURNING *', [id]);
            return availability;
        } catch (error) {
            console.error('Error deleting availability:', error);
            throw error;
        }
    }

    // Add interval to existing availability
    async addInterval(availabilityId, interval) {
        try {
            const result = await pool.query(
                `INSERT INTO availability_interval (availability_id, day_of_week, start_time, end_time)
                 VALUES ($1, $2, $3::TIME, $4::TIME)
                 RETURNING *`,
                [availabilityId, interval.day_of_week, interval.start_time, interval.end_time]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error adding interval:', error);
            throw error;
        }
    }

    // Update interval
    async updateInterval(intervalId, interval) {
        try {
            const { day_of_week, start_time, end_time } = interval;
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (day_of_week !== undefined) {
                updates.push(`day_of_week = $${paramIndex}`);
                values.push(day_of_week);
                paramIndex++;
            }

            if (start_time !== undefined) {
                updates.push(`start_time = $${paramIndex}::TIME`);
                values.push(start_time);
                paramIndex++;
            }

            if (end_time !== undefined) {
                updates.push(`end_time = $${paramIndex}::TIME`);
                values.push(end_time);
                paramIndex++;
            }

            if (updates.length === 0) {
                throw new Error('No fields to update');
            }

            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(intervalId);

            const result = await pool.query(
                `UPDATE availability_interval 
                 SET ${updates.join(', ')}
                 WHERE id = $${paramIndex}
                 RETURNING *`,
                values
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating interval:', error);
            throw error;
        }
    }

    // Delete interval
    async deleteInterval(intervalId) {
        try {
            const result = await pool.query(
                'DELETE FROM availability_interval WHERE id = $1 RETURNING *',
                [intervalId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error deleting interval:', error);
            throw error;
        }
    }

    // Get default availability (first availability or create one if none exists)
    async getDefaultAvailability() {
        try {
            const result = await pool.query(
                'SELECT * FROM availability ORDER BY id ASC LIMIT 1'
            );

            if (result.rows.length > 0) {
                return await this.findById(result.rows[0].id);
            }

            return null;
        } catch (error) {
            console.error('Error getting default availability:', error);
            throw error;
        }
    }
}

const availabilityModel = new AvailabilityModel();
export default availabilityModel;
