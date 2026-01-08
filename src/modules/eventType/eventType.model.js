// EventType Model - Database operations
import pool from '../../core/db.js';

class EventTypeModel {
    constructor() {
        this.pool = pool;
    }


    async createEventType(eventType) {
        try {
            const { name, description, duration, url_slug, user_id, availability_id } = eventType;

            // Use name as url_slug if not provided
            const slug = url_slug || name;

            const result = await pool.query(
                'INSERT INTO event_types (name, description, duration, url_slug, user_id, availability_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [name, description, duration, slug, user_id || null, availability_id || null]
            );
            return result.rows[0];
        }
        catch (error) {
            console.error('Error creating event type:', error);
            throw error;
        }
    }

    async findAll() {
        try {
            const query = 'SELECT * FROM event_types ORDER BY created_at DESC';
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching event types:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const query = 'SELECT * FROM event_types WHERE id = $1';
            const result = await pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding event type by id:', error);
            throw error;
        }
    }

    async findByName(name) {
        try {
            const query = 'SELECT * FROM event_types WHERE name = $1';
            const result = await pool.query(query, [name]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding event type by name:', error);
            throw error;
        }
    }

    async findBySlug(slug) {
        try {
            // Try to find by url_slug first, then fallback to name
            const query = 'SELECT * FROM event_types WHERE url_slug = $1 OR name = $1';
            const result = await pool.query(query, [slug]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding event type by slug:', error);
            throw error;
        }
    }

    async updateEventType(id, eventTypeData) {
        try {
            const { name, description, duration, url_slug, user_id, availability_id } = eventTypeData;

            // Build dynamic update query based on provided fields
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (name !== undefined) {
                updates.push(`name = $${paramIndex}`);
                values.push(name);
                paramIndex++;
            }

            if (description !== undefined) {
                updates.push(`description = $${paramIndex}`);
                values.push(description);
                paramIndex++;
            }

            if (duration !== undefined) {
                updates.push(`duration = $${paramIndex}`);
                values.push(duration);
                paramIndex++;
            }

            if (url_slug !== undefined) {
                updates.push(`url_slug = $${paramIndex}`);
                values.push(url_slug);
                paramIndex++;
            }

            if (user_id !== undefined) {
                updates.push(`user_id = $${paramIndex}`);
                values.push(user_id);
                paramIndex++;
            }

            if (availability_id !== undefined) {
                if (availability_id === null) {
                    updates.push(`availability_id = NULL`);
                } else {
                    updates.push(`availability_id = $${paramIndex}`);
                    values.push(availability_id);
                    paramIndex++;
                }
            }

            // Always update updated_at
            updates.push(`updated_at = CURRENT_TIMESTAMP`);

            if (updates.length === 1) { // Only updated_at
                throw new Error('No fields to update');
            }

            values.push(id); // Add id as last parameter

            const query = `
                UPDATE event_types 
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const result = await pool.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error updating event type:', error);
            throw error;
        }
    }

    async deleteEventType(id) {
        try {
            const query = 'DELETE FROM event_types WHERE id = $1 RETURNING *';
            const result = await pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error deleting event type:', error);
            throw error;
        }
    }
}
const eventTypeModel = new EventTypeModel();
export default eventTypeModel;