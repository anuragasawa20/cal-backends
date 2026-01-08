import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

// Use smaller pool size for tests to avoid deadlocks
const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: isTest ? 2 : 10, // Use 2 connections in test mode to allow setup/teardown overlap
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout to 10 seconds for tests
});


pool.on('connect', () => {
    console.log("Connected to the database");
});

pool.on('error', (err) => {
    console.error("Error connecting to the database", err);
});

export async function testConnection() {
    try {

        const result = await pool.query('Select NOW()');
        console.log('Database connection test successful:', result.rows[0]);
        return true;
    }
    catch (error) {

        console.error('Database connection test failed:', error);
        return false;
    }
}



export default pool;

