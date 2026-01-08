// Custom Error Class for better error handling
class CustomError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.name = 'CustomError';
        this.statusCode = statusCode;
        this.details = details;

        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    // Convert to JSON for API responses
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            details: this.details
        };
    }
}

export default CustomError;