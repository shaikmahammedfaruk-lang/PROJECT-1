# EASY WORLD - Setup Guide

This guide will help you set up the full-stack EASY WORLD educational platform with authentication.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Database Migration](#database-migration)
5. [Running the Application](#running-the-application)
6. [Testing the Application](#testing-the-application)
7. [Deployment](#deployment)
8. [ Troubl

hooting](#troubleshooting)

## System Requirements

- **Node.js** 18+ (https://nodejs.org/)
- **PostgreSQL** 12+ (https://www.postgresql.org/download/)
- **Git** (optional, for version control)

### Recommended PostgreSQL Installation

**Windows:** Use [PostgreSQL Installer](https://www.postgresql.org/download/windows/) or [PgAdmin](https://www.pgadmin.org/download/pgadmin-4-windows/)

**macOS:** `brew install postgresql`

**Linux (Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=easy_world_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT
JWT_SECRET=change_this_to_a_strong_random_string
JWT_EXPIRES_IN=15m

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5500

# Admin default
DEFAULT_ADMIN_EMAIL=admin@easyworld.com
DEFAULT_ADMIN_PASSWORD=Admin@123
```

**Important:**
- Change `JWT_SECRET` to a strong random string in production
- Update `DB_USER` and `DB_PASSWORD` to match your PostgreSQL credentials
- Set `FRONTEND_URL` to your frontend development URL

### 4. Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# In PostgreSQL shell:
CREATE DATABASE easy_world_db;
\q
```

Or use pgAdmin/your preferred PostgreSQL client to create a database named `easy_world_db`.

### 5. Run Database Migrations

```bash
npm run migrate
```

This creates the `users` table.

### 6. Start the Backend Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The backend API will be available at `http://localhost:3000`

Expected output:
```
Server is running on http://localhost:3000
Environment: development
Admin user created: admin@easyworld.com
```

### 7. Verify Backend Health

Open a browser or use curl:

```
http://localhost:3000/health
```

You should see:
```json
{
  "success": true,
  "message": "EASY WORLD API is running",
  "timestamp": "..."
}
```

## Frontend Setup

The frontend is a static site (HTML/CSS/JS). You can serve it using any static file server.

### Option A: VS Code Live Server (easiest)

1. Install "Live Server" extension in VS Code
2. Open `index.html` in the project root (`PROJECT/`)
3. Click "Go Live" button in bottom status bar
4. Frontend will open at `http://127.0.0.1:5500`

Make sure this matches `FRONTEND_URL` in backend `.env`.

### Option B: Python Simple HTTP Server

```bash
# In PROJECT directory
python -m http.server 5500
```

Then open `http://localhost:5500`

### Option C: Node.js `serve`

```bash
npm install -g serve
serve -l 5500
```

### Option D: Direct File Access (Limited)

⚠️ Some browsers restrict cookies for `file://` URLs. Opening HTML files directly may cause authentication issues. Use a local server instead.

## Database Migration from Google Apps Script

If you have existing student data in a Google Sheet that was used with the old Google Apps Script backend:

### 1. Export Google Sheet as CSV

- Open your Google Sheet
- File → Download → Comma-separated values (.csv)
- Save as `students_export.csv`

### 2. Create Migration Script

Create a script at `backend/src/migrations/import-ga-script.js`:

```javascript
// Migration script to import from Google Apps Script CSV
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { hashPassword } = require('../utils/bcrypt');

async function importFromCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());

  // Assuming CSV columns: Timestamp, Email, Name, College, Regulation (adjust as needed)
  let imported = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));

    // Adjust indices based on your CSV structure
    const email = cols[1];
    const name = cols[2];
    const college = cols[3];
    const regulation = cols[4];

    if (!email || !name) {
      skipped++;
      continue;
    }

    // Check if user already exists
    const existing = await db('users').where({ email }).first();
    if (existing) {
      skipped++;
      continue;
    }

    // Create user with random password (will need password reset)
    const passwordHash = await hashPassword('TempPass123!'); // TODO: Force reset on first login?
    await db('users').insert({
      email,
      password_hash: passwordHash,
      name,
      role: 'student',
      college: college || null,
      regulation: regulation || null,
      email_verified: true,
      created_at: new Date().toISOString()
    });

    imported++;
  }

  console.log(`Import complete: ${imported} added, ${skipped} skipped`);
  process.exit(0);
}

importFromCSV(path.join(__dirname, '../../students_export.csv')).catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
```

Place `students_export.csv` in the project root (or adjust path).

Run the migration:
```bash
node src/migrations/import-ga-script.js
```

**Note:** This creates temporary passwords. Consider sending password reset emails or forcing users to reset on first login.

## Running the Application

### 1. Start Backend

```bash
cd backend
npm start
```

Keep this terminal running.

### 2. Start Frontend Server

```bash
cd PROJECT
# Use one of the methods above, e.g., python -m http.server 5500
```

Open your browser and navigate to:

- **Landing Page:** `http://localhost:5500`
- **Login:** `http://localhost:5500/login.html`
- **Student Dashboard:** `http://localhost:5500/user-dashboard.html` (after login)
- **Admin Dashboard:** `http://localhost:5500/admin-dashboard.html` (after login)

## Testing the Application

### Default Admin Credentials

- Email: `admin@easyworld.com`
- Password: `Admin@123`

**Change this immediately after first login!**

### Test Flow 1: Student Registration & Login

1. Go to `http://localhost:5500/login.html`
2. Switch to "Register" tab
3. Fill in: Name, Email, College, Regulation (R20 or R23), Password (min 6 chars), Confirm Password
4. Click "Create Account"
5. Should see success alert and redirect to Student Dashboard
6. Verify profile info appears correctly
7. Click "Get Started" on landing page (while logged in) should go to dashboard
8. Logout and try logging back in with same credentials → success

### Test Flow 2: Admin Login

1. Go to `http://localhost:5500/login.html`
2. Switch to "Admin" tab
3. Enter `admin@easyworld.com` / `Admin@123`
4. Click "Sign In"
5. Should redirect to Admin Dashboard
6. Verify stats cards show student count (may be zero initially)
7. Go to "Students" tab → should see list (empty initially)
8. Test creating a student via registration, then see it appear in admin list
9. Test "Edit" and "Delete" (be careful!)

### Test Flow 3: Protected Branch Pages

1. Logout first
2. Attempt to go directly to `http://localhost:5500/R23.html`
3. Should redirect to login page with `?redirect=R23.html`
4. Login as student → should redirect back to R23.html
5. Click a course link → that branch page should also be protected
6. Logout and try to access a branch page → should redirect to login

### Test Flow 4: Profile Management

1. As student, go to Dashboard → Profile tab
2. Edit name or college, save changes
3. Verify success alert and updated values
4. Try changing password with current password → success
5. Try wrong current password → error

### Test Flow 5: Frontend Navigation

1. While not logged in, landing page "Login" button should appear in navbar and footer
2. Login as student, then return to landing page (via logo or home link)
3. Navbar should now show user name with dropdown (Dashboard/Logout)
4. Logout → returns to landing page with "Login" button

### Test Flow 6: Admin Upload

1. As admin, go to "Upload Materials" tab
2. Fill title, course, branch, select a small file (<10MB)
3. Click "Upload File"
4. Should see success alert and file appear in recent uploads list
5. Files are stored in `backend/uploads/` directory

## Debugging API Issues

Open browser DevTools (F12) → Network tab:

- Check that requests to `http://localhost:3000/api/...` return `200` and JSON
- If CORS error, verify `FRONTEND_URL` in `.env` matches your frontend URL (including port)
- If cookie issues, ensure `credentials: 'include'` is set in `api.js` (it is)
- If cookie not saved, check if your browser blocks third-party cookies. Try same domain port or adjust settings.

Check backend console for logs:

- Database connection errors
- JWT errors
- Request logs

## Deployment

### Backend (Node.js + PostgreSQL)

**Recommended Platforms:**
- **Railway:** Easy PostgreSQL addon, deploy from GitHub
- **Render:** Free tier, supports PostgreSQL
- **Heroku:** More setup, but works
- **VPS/DigitalOcean:** Full control

**Deploy Steps:**

1. Push code to GitHub
2. Create new service on platform (Web Service)
3. Set environment variables (see `.env.example`)
4. Add PostgreSQL database, note connection URL
5. Set build command: `npm install`
6. Set start command: `npm start`
7. Deploy!

The platform will run `npm start` which executes database migrations automatically.

### Frontend (Static)

**Recommended Platforms:**
- **Vercel:** Easiest, auto-detects static sites
- **Netlify:** Drag & drop or connect repo
- **GitHub Pages:** Free, but no server-side

**Deploy Steps (Vercel/Netlify):**

1. Import your repository
2. Set root directory to `PROJECT` (or move files to repo root)
3. Deploy
4. Frontend will be at `your-site.vercel.app`

**Important:** Set backend API URL in production:

In `PROJECT/js/api.js`, update:

```javascript
const API_BASE_URL = process.env.API_URL || 'https://your-backend-url.railway.app/api';
```

Or build-time config with Vercel environment variables.

### CORS Configuration

In production, set `FRONTEND_URL` to your deployed frontend domain.

If using same domain for frontend and backend, CORS not needed (same origin). You can disable CORS in production by checking hostname.

### HTTPS

In production, set `NODE_ENV=production` and update `config/jwt.js`:

```javascript
cookieOptions: {
  httpOnly: true,
  secure: true, // MUST be true for HTTPS
  sameSite: 'strict',
}
```

## Project Structure

```
PROJECT/                 (frontend)
├── index.html          # Landing page
├── login.html          # Login/Register page
├── user-dashboard.html # Student dashboard
├── admin-dashboard.html # Admin panel
├── R23.html            # Regulation 23 branch selection
├── R20.html            # Regulation 20 branch selection
├── R23/                # R23 branch content (protected)
├── R20/                # R20 branch content (protected)
├── css/
│   ├── index.css
│   ├── style.css       # Login page styles
│   ├── user-dashboard.css
│   └── admin-dashboard.css
├── js/
│   ├── api.js          # API client
│   ├── auth.js         # Auth utilities
│   ├── login.js
│   ├── user-dashboard.js
│   ├── admin-dashboard.js
│   └── index.js        # Landing page script
└── (assets: images, videos, etc.)

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
│   └── index.js        # Express server
├── uploads/            # Uploaded files (auto-created)
├── .env                # Environment variables (create from .env.example)
├── .env.example
├── knexfile.js
├── package.json
└── README.md
```

## API Reference

Base URL: `http://localhost:3000/api`

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register student (name, email, password, college, regulation) |
| `/auth/login` | POST | Login (email, password) |
| `/auth/logout` | POST | Logout (clears cookie) |
| `/auth/me` | GET | Get current user |

### User

| Endpoint | Method | Access |
|----------|--------|--------|
| `/users/profile` | GET | Student/Admin |
| `/users/profile` | PUT | Student/Admin (update name/college) |
| `/users/password` | PUT | Student/Admin (change password) |

### Admin

| Endpoint | Method | Access |
|----------|--------|--------|
| `/admin/stats` | GET | Admin only |
| `/admin/students` | GET | Admin only (with filters) |
| `/admin/students/:id` | GET | Admin only |
| `/admin/students/:id` | PUT | Admin only |
| `/admin/students/:id` | DELETE | Admin only |
| `/admin/upload` | POST | Admin only (file upload) |

## Security Notes

- JWT stored in HTTP-only cookies (cannot be accessed by JavaScript → XSS protection)
- Passwords hashed with bcrypt (salt rounds 10)
- Rate limiting on login (5 attempts per 15 minutes)
- CORS restricted to configured frontend URL
- Helmet.js sets secure HTTP headers
- Input validation via Joi
- All SQL queries use parameterized statements via Knex (SQL injection prevention)

## Troubleshooting

### "Database connection error"

- Verify PostgreSQL is running: `sudo service postgresql status` or check in pgAdmin
- Check `.env` database credentials match your local setup
- Ensure database `easy_world_db` exists

### "Cannot set headers after they are sent"

- Usually caused by calling `res.json()` or `res.redirect()` twice in a route
- Check your code and logs for double response

### Branch page redirects causing infinite loop

- Ensure you've set up the frontend server at the correct URL and `FRONTEND_URL` matches
- Check that cookies are being set (backend must be on same domain/port as frontend for cookies? Actually with CORS and `credentials: 'include'`, cookies work across origins if both are configured properly. For development, you can proxy API or use same port for both? Easier: use different ports but ensure `credentials: 'include'` and `cors` with `credentials: true` and correct origin.

**Simpler Development Option:** For local dev, you can serve frontend from the backend as static files. This avoids CORS and cookie issues. To do this:

1. Move the `PROJECT` folder contents into `backend/public`
2. In `backend/src/index.js`, add:
   ```javascript
   app.use(express.static(path.join(__dirname, '../public')));
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../public/index.html'));
   });
   ```
3. Run backend only, access at `http://localhost:3000`

But current setup separates them for flexibility.

### 401 Unauthorized on API Calls

- Are you logged in? Check auth state in DevTools → Application → Cookies → `localhost:3000` should have `token` cookie
- If not, login again
- Token may have expired (15 minutes). Log in again.

### "File too large" on Upload

- Max size is 10MB. Reduce file size or increase limit in `backend/src/routes/admin.js`:
  ```javascript
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
  ```

### Email Not Sending

- Email verification is not implemented (auto-verify). Ignore.

## Next Steps & Enhancements

- Add email verification with Nodemailer
- Implement password reset flow
- Add course progress tracking
- Add student activity logging
- Implement real file management with database records
- Add search across all course materials
- Add pagination to student list (partially implemented)
- Add bulk student import via CSV
- Add role-based access to branch pages (students only see their regulation)
- Add file download counts and analytics
- Implement refresh tokens for longer sessions
- Add 2-factor authentication (for admins)

## Support

For issues, check:
- Backend logs in terminal
- Browser DevTools → Console and Network tabs
- Ensure all environment variables are set correctly
- Verify database migrations ran successfully

---

Happy coding! 🚀