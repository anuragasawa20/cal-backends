// Migration script: Convert slug to name in event_types table
// Run this if you have existing data with slug column

import pool from '../src/core/db.js';

async function migrateToName() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting migration: slug → name...');

        await client.query('BEGIN');

        // Check if slug column exists
        const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'event_types' AND column_name = 'slug'
        `);

        if (columnCheck.rows.length > 0) {
            console.log('📦 Migrating existing data...');

            // Add name column if it doesn't exist
            await client.query(`
                ALTER TABLE event_types 
                ADD COLUMN IF NOT EXISTS name VARCHAR(255)
            `);

            // Copy slug values to name for existing rows
            await client.query(`
                UPDATE event_types 
                SET name = slug 
                WHERE name IS NULL
            `);

            // Make name NOT NULL and UNIQUE
            await client.query(`
                ALTER TABLE event_types 
                ALTER COLUMN name SET NOT NULL
            `);

            await client.query(`
                ALTER TABLE event_types 
                ADD CONSTRAINT event_types_name_unique UNIQUE (name)
            `);

            // Drop slug column
            await client.query(`
                ALTER TABLE event_types 
                DROP COLUMN IF EXISTS slug
            `);

            // Drop old index and create new one
            await client.query(`
                DROP INDEX IF EXISTS idx_event_types_slug
            `);

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_event_types_name ON event_types(name)
            `);

            console.log('✅ Migration completed successfully!');
        } else {
            console.log('✅ No migration needed - name column already exists');
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

migrateToName()
    .then(() => {
        console.log('Migration complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });

