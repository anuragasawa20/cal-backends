import express from 'express';
import indexRouter from './routes/index.js';
import cors from 'cors';

const app = express();

// CORS configuration - must be before other middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3000/',
    'http://127.0.0.1:3000/',
    'https://cal-frontend-five.vercel.app',
    'https://cal-frontend-five.vercel.app/'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            console.log('Allowed origins:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test CORS endpoint
app.get('/test-cors', (req, res) => {
    res.json({ message: 'CORS is working!', origin: req.headers.origin });
});

// Routes
app.use('/', indexRouter);

export default app;

