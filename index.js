import app from './app.js';
import { testConnection } from './src/core/db.js';
import { setupDatabase } from './src/core/setupDatabase.js';

const PORT = process.env.PORT || 3001;

// Initialize database before starting server
async function startServer() {
    try {
        console.log('Initializing database...');
        await setupDatabase();
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('Please ensure PostgreSQL is running and database credentials are correct.');
        // Continue to start server anyway - tables might already exist
    }

    // Start server
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        testConnection();
    });
}

startServer();
