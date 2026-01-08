// Database Setup Script

import { setupDatabase } from '../src/core/setupDatabase.js';

setupDatabase()
    .then(() => {
        console.log('✅ Database setup completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    });