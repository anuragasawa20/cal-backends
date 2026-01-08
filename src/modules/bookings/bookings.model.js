// Bookings Model - Database operations
import pool from '../../core/db.js';

class BookingsModel {
    constructor() {
        this.pool = pool;
    }

    async createBooking(booking) {
        try {
            const {
                event_type_id,
                client_email,
                name,
                additional_notes,
                start_time,
                end_time,
                date,
                meeting_link,
                booking_status = 'confirmed'
            } = booking;

            const result = await pool.query(
                `INSERT INTO bookings (
                    event_type_id, client_email, name, additional_notes,
                    start_time, end_time, date, meeting_link, booking_status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [
                    event_type_id,
                    client_email,
                    name,
                    additional_notes || null,
                    start_time,
                    end_time,
                    date,
                    meeting_link || null,
                    booking_status
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    }

    async findAll(filters = {}) {
        try {
            let query = 'SELECT * FROM bookings WHERE 1=1';
            const values = [];
            let paramIndex = 1;

            if (filters.event_type_id) {
                query += ` AND event_type_id = $${paramIndex}`;
                values.push(filters.event_type_id);
                paramIndex++;
            }

            if (filters.date) {
                query += ` AND date = $${paramIndex}`;
                values.push(filters.date);
                paramIndex++;
            }

            if (filters.booking_status) {
                query += ` AND booking_status = $${paramIndex}`;
                values.push(filters.booking_status);
                paramIndex++;
            }

            if (filters.client_email) {
                query += ` AND client_email = $${paramIndex}`;
                values.push(filters.client_email);
                paramIndex++;
            }

            query += ' ORDER BY date DESC, start_time DESC';

            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = 'SELECT * FROM bookings WHERE id = $1';
            const result = await pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding booking by id:', error);
            throw error;
        }
    }

    async findByEventTypeId(eventTypeId, filters = {}) {
        try {
            let query = 'SELECT * FROM bookings WHERE event_type_id = $1';
            const values = [eventTypeId];
            let paramIndex = 2;

            if (filters.date) {
                query += ` AND date = $${paramIndex}`;
                values.push(filters.date);
                paramIndex++;
            }

            if (filters.booking_status) {
                query += ` AND booking_status = $${paramIndex}`;
                values.push(filters.booking_status);
                paramIndex++;
            }

            query += ' ORDER BY date DESC, start_time DESC';

            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error finding bookings by event type id:', error);
            throw error;
        }
    }

    async updateBooking(id, bookingData) {
        try {
            const {
                client_email,
                name,
                additional_notes,
                start_time,
                end_time,
                date,
                meeting_link,
                booking_status
            } = bookingData;

            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (client_email !== undefined) {
                updates.push(`client_email = $${paramIndex}`);
                values.push(client_email);
                paramIndex++;
            }

            if (name !== undefined) {
                updates.push(`name = $${paramIndex}`);
                values.push(name);
                paramIndex++;
            }

            if (additional_notes !== undefined) {
                updates.push(`additional_notes = $${paramIndex}`);
                values.push(additional_notes);
                paramIndex++;
            }

            if (start_time !== undefined) {
                updates.push(`start_time = $${paramIndex}`);
                values.push(start_time);
                paramIndex++;
            }

            if (end_time !== undefined) {
                updates.push(`end_time = $${paramIndex}`);
                values.push(end_time);
                paramIndex++;
            }

            if (date !== undefined) {
                updates.push(`date = $${paramIndex}`);
                values.push(date);
                paramIndex++;
            }

            if (meeting_link !== undefined) {
                updates.push(`meeting_link = $${paramIndex}`);
                values.push(meeting_link || null);
                paramIndex++;
            }

            if (booking_status !== undefined) {
                updates.push(`booking_status = $${paramIndex}`);
                values.push(booking_status);
                paramIndex++;
            }

            // Always update updated_at
            updates.push('updated_at = CURRENT_TIMESTAMP');

            if (updates.length === 1) { // Only updated_at
                throw new Error('No fields to update');
            }

            values.push(id); // Add id as last parameter

            const query = `
                UPDATE bookings 
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const result = await pool.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    }

    async deleteBooking(id) {
        try {
            const query = 'DELETE FROM bookings WHERE id = $1 RETURNING *';
            const result = await pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error deleting booking:', error);
            throw error;
        }
    }

    // Check for booking conflicts (overlapping bookings for the same event type)
    async checkConflict(eventTypeId, date, startTime, endTime, excludeBookingId = null) {
        try {
            let query = `
                SELECT * FROM bookings 
                WHERE event_type_id = $1 
                AND date = $2
                AND booking_status != 'cancelled'
                AND (
                    (start_time <= $3 AND end_time > $3)
                    OR (start_time < $4 AND end_time >= $4)
                    OR (start_time >= $3 AND end_time <= $4)
                )
            `;
            const values = [eventTypeId, date, startTime, endTime];
            let paramIndex = 5;

            if (excludeBookingId) {
                query += ` AND id != $${paramIndex}`;
                values.push(excludeBookingId);
            }

            const result = await pool.query(query, values);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error checking booking conflict:', error);
            throw error;
        }
    }
}

const bookingsModel = new BookingsModel();
export default bookingsModel;
