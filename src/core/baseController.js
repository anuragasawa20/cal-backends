import customError from './customError.js';
import { ZodError } from 'zod';
class BaseController {

    constructor() {
    }

    handleError(res, message = 'Internal server error', error) {
        if (!error) {
            return res.status(500).json({ message });
        }

        // Handle CustomError
        if (error instanceof customError || error.name === 'CustomError') {
            return res.status(error.statusCode || 500).json({
                message: error.message,
                error: error.toJSON ? error.toJSON() : {
                    name: error.name,
                    message: error.message,
                    statusCode: error.statusCode,
                    details: error.details
                }
            });
        }

        // Handle ValidationError (from Zod)
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message,
                error: {
                    name: error.name,
                    message: error.message,
                    errors: error.errors || error.error || []
                }
            });
        }

        // Handle database unique constraint errors
        if (error.code === '23505') { // PostgreSQL unique violation
            return res.status(409).json({
                message: 'Resource already exists',
                error: { message: error.message }
            });
        }

        // Default error
        return res.status(500).json({
            message,
            error: {
                message: error.message,
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            }
        });
    }

    handleSuccess(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({ message, data });
    }
}

export default BaseController;