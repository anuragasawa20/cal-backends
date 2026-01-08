import { z } from 'zod';

// Schema for creating event type
export const eventTypeSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(255, 'Name cannot exceed 255 characters')
        .regex(/^[a-z0-9-]+$/, 'Name must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().optional(),
    duration: z.number()
        .int('Duration must be an integer')
        .positive('Duration must be a positive number')
        .max(1440, 'Duration cannot exceed 1440 minutes (24 hours)'),
    url_slug: z.string()
        .regex(/^[a-z0-9-]+$/, 'URL slug must contain only lowercase letters, numbers, and hyphens')
        .optional(),
    user_id: z.number().int().optional(),
    availability_id: z.number().int().positive().optional(),
});

// Schema for updating event type (all fields optional except at least one must be provided)
export const updateEventTypeSchema = z.object({
    name: z.string()
        .min(1, 'Name cannot be empty')
        .max(255, 'Name cannot exceed 255 characters')
        .regex(/^[a-z0-9-]+$/, 'Name must contain only lowercase letters, numbers, and hyphens')
        .optional(),
    description: z.string().optional(),
    duration: z.number()
        .int('Duration must be an integer')
        .positive('Duration must be a positive number')
        .max(1440, 'Duration cannot exceed 1440 minutes (24 hours)')
        .optional(),
    url_slug: z.string()
        .regex(/^[a-z0-9-]+$/, 'URL slug must contain only lowercase letters, numbers, and hyphens')
        .optional(),
    user_id: z.number().int().optional(),
    availability_id: z.number().int().positive().optional().nullable(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});


// Schema for availability interval
export const intervalSchema = z.object({
    day_of_week: z.number()
        .int('Day of week must be an integer')
        .min(1, 'Day of week must be between 1 and 7')
        .max(7, 'Day of week must be between 1 and 7'),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'Start time must be in HH:MM:SS format'),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'End time must be in HH:MM:SS format'),
});

// Schema for creating availability
export const availabilitySchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(255, 'Name cannot exceed 255 characters'),
    timezone: z.string()
        .default('UTC')
        .optional(),
    intervals: z.array(intervalSchema).optional(),
}).refine(data => {
    if (data.intervals) {
        return data.intervals.every(interval => interval.start_time < interval.end_time);
    }
    return true;
}, {
    message: 'Start time must be before end time',
    path: ['intervals']
});

// Schema for updating availability
export const updateAvailabilitySchema = z.object({
    name: z.string()
        .min(1, 'Name cannot be empty')
        .max(255, 'Name cannot exceed 255 characters')
        .optional(),
    timezone: z.string().optional(),
    intervals: z.array(intervalSchema).optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
}).refine(data => {
    if (data.intervals) {
        return data.intervals.every(interval => interval.start_time < interval.end_time);
    }
    return true;
}, {
    message: 'Start time must be before end time',
    path: ['intervals']
});

// Schema for creating booking
export const bookingSchema = z.object({
    event_type_id: z.number()
        .int('Event type ID must be an integer')
        .positive('Event type ID must be positive'),
    client_email: z.string()
        .email('Invalid email address'),
    name: z.string()
        .min(1, 'Name is required')
        .max(255, 'Name cannot exceed 255 characters'),
    additional_notes: z.string().optional(),
    start_time: z.string().datetime('Start time must be a valid ISO datetime'),
    end_time: z.string().datetime('End time must be a valid ISO datetime'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    meeting_link: z.string().url('Meeting link must be a valid URL').optional().or(z.literal('')),
    booking_status: z.enum(['confirmed', 'pending', 'cancelled', 'completed']).default('confirmed').optional(),
}).refine(data => new Date(data.start_time) < new Date(data.end_time), {
    message: 'Start time must be before end time',
    path: ['start_time']
});

// Schema for updating booking
export const updateBookingSchema = z.object({
    client_email: z.string()
        .email('Invalid email address')
        .optional(),
    name: z.string()
        .min(1, 'Name cannot be empty')
        .max(255, 'Name cannot exceed 255 characters')
        .optional(),
    additional_notes: z.string().optional(),
    start_time: z.string().datetime('Start time must be a valid ISO datetime').optional(),
    end_time: z.string().datetime('End time must be a valid ISO datetime').optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    meeting_link: z.string().url('Meeting link must be a valid URL').optional().or(z.literal('')),
    booking_status: z.enum(['confirmed', 'pending', 'cancelled', 'completed']).optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
}).refine(data => {
    if (data.start_time && data.end_time) {
        return new Date(data.start_time) < new Date(data.end_time);
    }
    return true;
}, {
    message: 'Start time must be before end time',
    path: ['start_time']
});

export const formatZodError = (zodError) => {
    if (!zodError) {
        return {
            name: 'ValidationError',
            message: 'Validation failed',
            errors: []
        };
    }

    // Zod error structure: zodError.issues (not zodError.errors)
    const issues = zodError.issues || zodError.errors || [];

    return {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: issues.map(err => ({
            field: (err.path || []).join('.'),
            message: err.message
        })),
        status: 400
    };
};