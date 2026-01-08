// Test Utilities
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to ensure database operations complete before next test
export const waitForDB = async () => {
    await delay(50); // Small delay to ensure transactions complete
};

