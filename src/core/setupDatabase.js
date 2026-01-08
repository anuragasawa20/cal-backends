// Database Setup/Migration Script
// Run this to create all tables automatically

import pool from './db.js';

// SQL queries to create tables
const createTables = `
  -- Create availability table (must be created first as event_types references it)
  CREATE TABLE IF NOT EXISTS availability (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Create availability_interval table
  CREATE TABLE IF NOT EXISTS availability_interval (
    id SERIAL PRIMARY KEY,
    availability_id INTEGER NOT NULL REFERENCES availability(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(availability_id, day_of_week, start_time, end_time)
  );

  -- Create event_types table
  CREATE TABLE IF NOT EXISTS event_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    url_slug VARCHAR(255) UNIQUE,
    user_id INTEGER,
    availability_id INTEGER REFERENCES availability(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Create bookings table
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    event_type_id INTEGER NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
    client_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    additional_notes TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    date DATE NOT NULL,
    meeting_link VARCHAR(500),
    booking_status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_type_id, date, start_time)
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_event_types_name ON event_types(name);
  CREATE INDEX IF NOT EXISTS idx_event_types_url_slug ON event_types(url_slug);
  CREATE INDEX IF NOT EXISTS idx_event_types_availability_id ON event_types(availability_id);
  CREATE INDEX IF NOT EXISTS idx_availability_interval_availability_id ON availability_interval(availability_id);
  CREATE INDEX IF NOT EXISTS idx_availability_interval_day ON availability_interval(availability_id, day_of_week);
  CREATE INDEX IF NOT EXISTS idx_bookings_event_type_id ON bookings(event_type_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
  CREATE INDEX IF NOT EXISTS idx_bookings_client_email ON bookings(client_email);
`;

// Seed data (optional sample data)
const seedData = `
  -- Insert sample availability with intervals (Monday to Friday, 9 AM to 5 PM)
  INSERT INTO availability (name, timezone)
  VALUES ('Default Business Hours', 'UTC')
  ON CONFLICT DO NOTHING;

  -- Insert availability intervals for the default availability (get the id)
  INSERT INTO availability_interval (availability_id, day_of_week, start_time, end_time)
  SELECT 
    a.id,
    day,
    '09:00:00'::TIME,
    '17:00:00'::TIME
  FROM availability a
  CROSS JOIN generate_series(1, 5) AS day
  WHERE a.name = 'Default Business Hours'
  ON CONFLICT DO NOTHING;

  -- Insert sample event types
  INSERT INTO event_types (name, description, duration, url_slug, availability_id)
  SELECT 
    '30-minute-meeting',
    'Quick catch-up call',
    30,
    '30-minute-meeting',
    a.id
  FROM availability a
  WHERE a.name = 'Default Business Hours'
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO event_types (name, description, duration, url_slug, availability_id)
  SELECT 
    '1-hour-consultation',
    'Detailed discussion session',
    60,
    '1-hour-consultation',
    a.id
  FROM availability a
  WHERE a.name = 'Default Business Hours'
  ON CONFLICT (name) DO NOTHING;

  INSERT INTO event_types (name, description, duration, url_slug, availability_id)
  SELECT 
    '15-minute-quick-chat',
    'Brief introduction call',
    15,
    '15-minute-quick-chat',
    a.id
  FROM availability a
  WHERE a.name = 'Default Business Hours'
  ON CONFLICT (name) DO NOTHING;
`;

// Function to create default availability (2PM to 10PM for all days)
async function createDefaultAvailability(client) {
  // Check if any availability exists
  const availabilityCheck = await client.query('SELECT COUNT(*) as count FROM availability');
  const availabilityCount = parseInt(availabilityCheck.rows[0].count);

  if (availabilityCount === 0) {
    // Create default availability
    const availabilityResult = await client.query(
      `INSERT INTO availability (name, timezone) 
       VALUES ('Default Availability', 'UTC') 
       RETURNING id`
    );
    const availabilityId = availabilityResult.rows[0].id;

    // Create intervals for all 7 days (2PM to 10PM)
    for (let day = 1; day <= 7; day++) {
      await client.query(
        `INSERT INTO availability_interval (availability_id, day_of_week, start_time, end_time) 
         VALUES ($1, $2, $3::TIME, $4::TIME)`,
        [availabilityId, day, '14:00:00', '22:00:00']
      );
    }

    return availabilityId;
  }

  return null;
}

// Helper function to retry on deadlock or timeout
async function retryOnDeadlock(fn, maxRetries = 3, delay = 200) {
  for (let i = 0; i < maxRetries; i++) {
    let client = null;
    try {
      return await fn();
    } catch (error) {
      // If it's a deadlock error, connection timeout, or connection error, wait and retry
      if ((error.code === '40P01' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout') || error.message?.includes('Connection terminated')) && i < maxRetries - 1) {
        // Wait with exponential backoff
        const waitTime = delay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
}

export async function setupDatabase() {
  return retryOnDeadlock(async () => {
    let client = null;
    try {
      client = await pool.connect();

      // Begin transaction
      await client.query('BEGIN');

      // First, ensure any leftover types are cleaned up
      await client.query(`
        DO $$ 
        DECLARE 
          r RECORD;
        BEGIN
          FOR r IN (SELECT typname FROM pg_type WHERE typname IN ('availability', 'availability_interval', 'event_types', 'bookings') AND typtype = 'c')
          LOOP
            BEGIN
              EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
            EXCEPTION
              WHEN OTHERS THEN
                NULL;
            END;
          END LOOP;
        END $$;
      `);

      // Create tables
      await client.query(createTables);

      // Create default availability if none exists
      await createDefaultAvailability(client);

      // // Seed data (optional - comment out if you don't want sample data)
      // console.log('🌱 Seeding sample data...');
      // await client.query(seedData);
      // console.log('✅ Sample data seeded successfully');

      // Commit transaction
      await client.query('COMMIT');

      return true;
    } catch (error) {
      // Rollback on error if we have a client
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          // Ignore rollback errors
        }
      }

      // If it's a type conflict error, try to clean up and retry once
      if (error.code === '23505' && error.detail && error.detail.includes('typname')) {
        if (!client) {
          client = await pool.connect();
        }
        try {
          await client.query('BEGIN');
          // Clean up the conflicting type
          await client.query(`
            DO $$ 
            DECLARE 
              r RECORD;
            BEGIN
              FOR r IN (SELECT typname FROM pg_type WHERE typname IN ('availability', 'availability_interval', 'event_types', 'bookings') AND typtype = 'c')
              LOOP
                BEGIN
                  EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
                EXCEPTION
                  WHEN OTHERS THEN
                    NULL;
                END;
              END LOOP;
            END $$;
          `);
          await client.query('COMMIT');

          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 50));

          // Retry setup
          await client.query('BEGIN');
          await client.query(createTables);
          await createDefaultAvailability(client);
          await client.query('COMMIT');
          return true;
        } catch (retryError) {
          if (client) {
            try {
              await client.query('ROLLBACK');
            } catch (e) {
              // Ignore
            }
          }
          throw retryError;
        }
      }

      throw error;
    } finally {
      // Release client back to pool if we got one
      if (client) {
        client.release();
        // Small delay to ensure connection is fully released
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  });
}

export async function dropTables() {
  return retryOnDeadlock(async () => {
    let client = null;
    try {
      client = await pool.connect();

      await client.query('BEGIN');

      // Drop tables in reverse order (due to foreign keys)
      // Use CASCADE to drop dependent objects including types
      await client.query('DROP TABLE IF EXISTS bookings CASCADE');
      await client.query('DROP TABLE IF EXISTS event_types CASCADE');
      await client.query('DROP TABLE IF EXISTS availability_interval CASCADE');
      await client.query('DROP TABLE IF EXISTS availability CASCADE');

      // Explicitly drop any composite types that might remain
      // This handles cases where types persist after table drops
      await client.query(`
        DO $$ 
        DECLARE 
          r RECORD;
        BEGIN
          FOR r IN (SELECT typname FROM pg_type WHERE typname IN ('availability', 'availability_interval', 'event_types', 'bookings') AND typtype = 'c')
          LOOP
            BEGIN
              EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
            EXCEPTION
              WHEN OTHERS THEN
                -- Ignore errors when dropping types
                NULL;
            END;
          END LOOP;
        END $$;
      `);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      // Try to rollback if we have a client
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          // Ignore rollback errors
        }
      }

      // Don't throw error if it's just a cleanup issue
      // These error codes are for: table doesn't exist, type doesn't exist, or already dropped
      if (error.code !== '42P01' && error.code !== '42704' && error.code !== '25P02') {
        throw error;
      }
      return true;
    } finally {
      // Always release client if we got one
      if (client) {
        client.release();
        // Small delay to ensure connection is fully released
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  });
}
