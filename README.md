# Cal.com Clone - Backend API

RESTful API backend for the Cal.com clone scheduling platform. Built with Node.js, Express.js, and PostgreSQL.

## 🌐 Live API

**Production URL**: [Your Backend URL Here]

**Status Endpoint**: `GET /` - Returns server status

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Running the Server](#running-the-server)
- [Testing](#testing)
- [CORS Configuration](#cors-configuration)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

## ✨ Features

- **Event Types Management**: Create, read, update, and delete event types
- **Availability Settings**: Manage availability schedules with time slots for each day
- **Bookings Management**: Handle bookings with conflict detection and status management
- **RESTful API**: Clean REST API design with proper HTTP methods
- **Input Validation**: Zod schema validation for all inputs
- **Error Handling**: Comprehensive error handling with custom error classes
- **Database Migrations**: Automatic database setup and schema creation
- **Testing**: Full test coverage with Jest and Supertest

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL
- **Validation**: Zod 4.3.5
- **Testing**: Jest 29.7.0, Supertest 7.2.2
- **Development**: Nodemon 3.1.11

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## 🚀 Setup Instructions

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Install PostgreSQL

- **macOS**: `brew install postgresql && brew services start postgresql`
- **Ubuntu**: `sudo apt-get install postgresql postgresql-contrib`
- **Windows**: Download from [PostgreSQL website](https://www.postgresql.org/download/)

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cal_clone;

# Exit psql
\q
```

### 4. Environment Configuration

Create a `.env` file in the backend root directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=cal_clone

# Server Configuration
PORT=3001
NODE_ENV=development
```

**Important**: Replace `your_password_here` with your actual PostgreSQL password.

### 5. Initialize Database

The database will automatically initialize when you start the server. Alternatively, you can run:

```bash
npm run setup-db
```

This creates all necessary tables and sets up default availability.

### 6. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL host | `localhost` | Yes |
| `DB_USER` | PostgreSQL user | `postgres` | Yes |
| `DB_PASSWORD` | PostgreSQL password | `postgres` | Yes |
| `DB_NAME` | Database name | `postgres` | Yes |
| `PORT` | Server port | `3001` | No |
| `NODE_ENV` | Environment mode | `development` | No |

## 🗄 Database Schema

### Tables

#### 1. `availability`
Stores availability schedules with timezone information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | VARCHAR(255) | Availability schedule name |
| `timezone` | VARCHAR(50) | Timezone (default: UTC) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### 2. `availability_interval`
Stores time intervals for each day of the week.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `availability_id` | INTEGER | Foreign key to availability |
| `day_of_week` | INTEGER | Day (1=Monday, 7=Sunday) |
| `start_time` | TIME | Start time (HH:MM:SS) |
| `end_time` | TIME | End time (HH:MM:SS) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Unique Constraint**: `(availability_id, day_of_week, start_time, end_time)`

#### 3. `event_types`
Stores event type definitions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | VARCHAR(255) | Event type name (unique) |
| `description` | TEXT | Event description |
| `duration` | INTEGER | Duration in minutes |
| `url_slug` | VARCHAR(255) | URL-friendly slug (unique) |
| `user_id` | INTEGER | User ID (for future multi-user support) |
| `availability_id` | INTEGER | Foreign key to availability |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Unique Constraints**: `name`, `url_slug`

#### 4. `bookings`
Stores booking records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `event_type_id` | INTEGER | Foreign key to event_types |
| `client_email` | VARCHAR(255) | Client email address |
| `name` | VARCHAR(255) | Client name |
| `additional_notes` | TEXT | Optional notes |
| `start_time` | TIMESTAMP | Booking start time |
| `end_time` | TIMESTAMP | Booking end time |
| `date` | DATE | Booking date |
| `meeting_link` | VARCHAR(500) | Optional meeting link |
| `booking_status` | VARCHAR(50) | Status (default: 'confirmed') |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Unique Constraint**: `(event_type_id, date, start_time)` - Prevents double booking

### Relationships

- `availability_interval` → `availability` (Many-to-One, CASCADE delete)
- `event_types` → `availability` (Many-to-One, SET NULL on delete)
- `bookings` → `event_types` (Many-to-One, CASCADE delete)

## 🔌 API Endpoints

### Base URL

```
http://localhost:3001
```

### Event Types

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/event-type` | Get all event types |
| `GET` | `/event-type/:id` | Get event type by ID |
| `GET` | `/event-type/slug/:slug` | Get event type by URL slug |
| `POST` | `/event-type` | Create new event type |
| `PUT` | `/event-type/:id` | Update event type |
| `DELETE` | `/event-type/:id` | Delete event type |

**Request Body (POST/PUT)**:
```json
{
  "name": "30-minute-meeting",
  "description": "Quick catch-up call",
  "duration": 30,
  "url_slug": "30-minute-meeting",
  "availability_id": 1
}
```

### Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/availability` | Get all availability schedules |
| `GET` | `/availability/:id` | Get availability by ID |
| `POST` | `/availability` | Create new availability schedule |
| `PUT` | `/availability/:id` | Update availability schedule |
| `DELETE` | `/availability/:id` | Delete availability schedule |

**Request Body (POST/PUT)**:
```json
{
  "name": "Business Hours",
  "timezone": "America/New_York",
  "intervals": [
    {
      "day_of_week": 1,
      "start_time": "09:00:00",
      "end_time": "17:00:00"
    }
  ]
}
```

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/bookings` | Get all bookings (query: `?status=confirmed&upcoming=true`) |
| `GET` | `/bookings/:id` | Get booking by ID |
| `GET` | `/bookings/available-slots` | Get available time slots (query: `?eventTypeId=1&date=2024-01-15`) |
| `POST` | `/bookings` | Create new booking |
| `PUT` | `/bookings/:id` | Update booking |
| `DELETE` | `/bookings/:id` | Cancel booking |

**Request Body (POST/PUT)**:
```json
{
  "event_type_id": 1,
  "client_email": "client@example.com",
  "name": "John Doe",
  "additional_notes": "Looking forward to our meeting",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T10:30:00Z",
  "date": "2024-01-15"
}
```

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## 🏃 Running the Server

### Development Mode

```bash
npm run dev
```

Uses nodemon for automatic server restart on file changes.

### Production Mode

```bash
npm start
```

### Health Check

```bash
curl http://localhost:3001/
```

Expected response:
```json
{
  "message": "Backend server is running!"
}
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Unit tests
npm run test:bookings
npm run test:availability
npm run test:eventType

# API integration tests
npm run test:api
npm run test:api:eventType
npm run test:api:availability
npm run test:api:bookings
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

### Test Structure

- **Unit Tests**: `tests/*.test.js` - Test models and services
- **API Tests**: `tests/api/*.api.test.js` - Test HTTP endpoints

See `TEST_README.md` for detailed testing documentation.

## 🌐 CORS Configuration

The backend is configured to accept requests from specific origins. Update `app.js` to add your frontend URL:

```javascript
const allowedOrigins = [
    'http://localhost:3000',              // Local development
    'http://127.0.0.1:3000',
    'https://cal-frontend-five.vercel.app', // Production frontend
    'https://cal-frontend-five.vercel.app/'
];
```

**Current Allowed Origins**:
- `http://localhost:3000` (local development)
- `https://cal-frontend-five.vercel.app` (production)

To add more origins, edit the `allowedOrigins` array in `app.js`.

## 🚢 Deployment

### Railway

1. Connect your GitHub repository
2. Add PostgreSQL service
3. Set environment variables:
   - `DB_HOST` (from Railway PostgreSQL service)
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `PORT` (Railway will set this automatically)
4. Deploy

### Render

1. Create new Web Service
2. Connect GitHub repository
3. Add PostgreSQL database
4. Set environment variables
5. Set build command: `npm install`
6. Set start command: `npm start`
7. Deploy

### Heroku

1. Create Heroku app
2. Add Heroku Postgres addon
3. Set environment variables
4. Deploy:
   ```bash
   git push heroku main
   ```

### Environment Variables for Production

Make sure to set all required environment variables in your hosting platform:

```bash
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
NODE_ENV=production
```

**Important**: Update CORS allowed origins in `app.js` to include your production frontend URL before deploying.

## 📁 Project Structure

```
backend/
├── src/
│   ├── core/
│   │   ├── baseController.js      # Base controller with error handling
│   │   ├── customError.js         # Custom error classes
│   │   ├── db.js                  # PostgreSQL connection pool
│   │   ├── setupDatabase.js      # Database schema and migrations
│   │   └── validationSchema.js   # Zod validation schemas
│   └── modules/
│       ├── availability/
│       │   ├── availability.controller.js
│       │   ├── availability.model.js
│       │   ├── availability.routes.js
│       │   └── availability.service.js
│       ├── bookings/
│       │   ├── bookings.controller.js
│       │   ├── bookings.model.js
│       │   ├── bookings.routes.js
│       │   └── bookings.service.js
│       └── eventType/
│           ├── eventType.controller.js
│           ├── eventType.model.js
│           ├── eventType.routes.js
│           └── eventType.service.js
├── routes/
│   └── index.js                   # Main router
├── scripts/
│   ├── setup-db.js                # Database setup script
│   └── migrate-to-name.js        # Migration script
├── tests/                         # Test files
│   ├── api/                       # API integration tests
│   └── *.test.js                  # Unit tests
├── app.js                         # Express app configuration
├── index.js                       # Server entry point
├── package.json
└── README.md                      # This file
```

## 📝 Notes

- **No Authentication**: This API assumes a default user is logged in. All operations are performed for a single user.
- **Automatic Database Setup**: The database schema is automatically created on server start if tables don't exist.
- **Double Booking Prevention**: The database enforces uniqueness on `(event_type_id, date, start_time)` to prevent conflicts.
- **Default Availability**: A default availability schedule (2PM-10PM for all days) is created automatically if none exists.

## 🔗 Related Repositories

- **Frontend**: https://github.com/anuragasawa20/cal-clone-frontends
- **Live Frontend**: [https://cal-frontend-five.vercel.app/](https://cal-frontend-five.vercel.app/)

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Zod Documentation](https://zod.dev/)
- [Jest Documentation](https://jestjs.io/)

---

**Note**: Make sure to update the CORS configuration and environment variables according to your deployment environment.

