# EASY WORLD Backend API

Node.js + Express + PostgreSQL API for the EASY WORLD educational platform with authentication and role-based access control.

## Features

- JWT-based authentication with HTTP-only cookies
- Role-based access control (Student, Admin)
- User registration and profile management
- Admin dashboard with statistics and student management
- File upload for course materials
- Rate limiting and input validation
- CORS and security headers

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Key environment variables:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `JWT_SECRET` - Secret key for signing JWT tokens (change this in production!)
- `FRONTEND_URL` - URL of your frontend app (for CORS)
- `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` - Initial admin account

### 3. Set Up PostgreSQL Database

Create a PostgreSQL database:

```sql
CREATE DATABASE easy_world_db;
```

Or use a PostgreSQL client like pgAdmin, DBeaver, etc.

### 4. Run Database Migrations

```bash
npm run migrate
```

This creates the `users` table.

### 5. Start the Server

**Development with auto-reload (using nodemon):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

### 6. Seed Default Admin User

The server automatically seeds a default admin user on first start if one doesn't exist:

- Email: `admin@easyworld.com`
- Password: `Admin@123`

**IMPORTANT:** Change the `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` in `.env` for production!

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register a new student account | Public |
| POST | `/api/auth/login` | Login user (student or admin) | Public |
| POST | `/api/auth/logout` | Logout and clear JWT cookie | Protected |
| GET | `/api/auth/me` | Get current authenticated user | Protected |

### User (Student)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users/profile` | Get own profile | Student + Admin |
| PUT | `/api/users/profile` | Update name, college | Student + Admin |
| PUT | `/api/users/password` | Change password | Student + Admin |

### Admin

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/stats` | Dashboard statistics | Admin only |
| GET | `/api/admin/students` | List all students (with filters) | Admin only |
| GET | `/api/admin/students/:id` | Get single student | Admin only |
| PUT | `/api/admin/students/:id` | Update student (college, role, etc.) | Admin only |
| DELETE | `/api/admin/students/:id` | Delete student | Admin only |
| POST | `/api/admin/upload` | Upload course materials | Admin only |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health status |

## API Response Format

All responses follow this structure:

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": {} // Optional response data
}
```

### Example Success Response

```json
{
  "success": true,
  "message": "Login successful.",
  "user": {
    "id": 1,
    "email": "student@example.com",
    "name": "John Doe",
    "role": "student",
    "college": "ABC College",
    "regulation": "R23"
  }
}
```

### Example Error Response

```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

## Authentication

The API uses **JWT tokens stored in HTTP-only cookies**.

- On login/register, the server sets a `token` cookie automatically.
- The cookie is sent automatically with subsequent requests (no manual Authorization header needed).
- Logout clears the cookie.

### Protected Routes

Routes requiring authentication are protected by the `protect` middleware.
Only the authenticated user's token is valid.

### Admin-Only Routes

Routes with `adminOnly` middleware require both valid authentication AND `role: 'admin'`.

## Data Model

### User

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key, auto-increment |
| email | string (255) | Unique, not nullable |
| password_hash | string (255) | Bcrypt hash, not nullable |
| name | string (255) | Not nullable |
| role | string (50) | 'student' or 'admin' |
| college | string (255) | Optional |
| regulation | string (10) | 'R20' or 'R23' (optional) |
| email_verified | boolean | Default true |
| created_at | timestamp | Auto-set |
| updated_at | timestamp | Auto-updated |

## File Uploads

Uploaded files are stored in the `backend/uploads/` directory.

### Upload Limits

- Maximum file size: 10 MB
- Allowed file types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP, RAR, JPG, JPEG, PNG, GIF

### Upload Response

```json
{
  "success": true,
  "message": "File uploaded successfully.",
  "file": {
    "filename": "upload-12345.pdf",
    "originalname": "notes.pdf",
    "url": "/uploads/upload-12345.pdf",
    "title": "Uploaded file title",
    "course": "CSE",
    "branch": "R23",
    "size": 2048000,
    "uploadedAt": "2025-03-27T10:30:00.000Z"
  }
}
```

## Rate Limiting

Login endpoint (`/api/auth/login`) has rate limiting:
- 5 attempts per 15 minutes per IP address

## Error Handling

Common HTTP status codes:

- `200` - Success
- `201` - Created (registration)
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `413` - Payload too large (file upload)
- `429` - Too many requests (rate limit)
- `500` - Internal server error

## Development Tips

### Running Migrations Manually

```bash
npm run migrate
```

### Rolling Back Last Migration

```bash
npm run migrate:rollback
```

### Checking Database Connection

The server automatically tests the DB connection on startup and exits if it fails.

### Adding New Environment Variables

After changing `.env`, restart the server.

## Production Deployment Checklist

- [ ] Change `JWT_SECRET` to a strong, random string
- [ ] Change `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` (or remove seeding after creation)
- [ ] Set `NODE_ENV=production`
- [ ] Use environment variables for DB credentials (do not commit `.env`)
- [ ] Configure PostgreSQL backups
- [ ] Set up CORS `FRONTEND_URL` to your actual frontend domain
- [ ] Enable HTTPS (set `secure: true` on JWT cookieOptions in `config/jwt.js`)
- [ ] Set `sameSite: 'strict'` for CSRF protection
- [ ] Add logging (Winston/Pino) and error tracking (Sentry)
- [ ] Consider adding refresh tokens for longer sessions
- [ ] Add input rate limiting on all public endpoints
- [ ] Implement file upload limit quotas per admin

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── jwt.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── admin.js
│   ├── utils/
│   │   └── bcrypt.js
│   └── index.js
├── migrations/
│   └── xxxxx_create_users_table.js
├── uploads/ (created automatically)
├── .env (create from .env.example)
├── .env.example
├── knexfile.js
├── package.json
└── README.md
```

## Troubleshooting

### "Database connection error"
- Verify PostgreSQL is running
- Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in `.env`
- Ensure the database exists

### "Migrations failed"
- Check that the `migrations` table doesn't exist with conflicting entries
- Try rolling back: `npm run migrate:rollback`

### "Cannot set headers after they are sent"
- This usually happens when you call `res.json()` or `res.redirect()` multiple times in a route. Ensure each request sends only one response.

### "File too large" error
- Check Multer limits in `src/routes/admin.js`
- Adjust `fileSize` limit as needed

## License

ISC