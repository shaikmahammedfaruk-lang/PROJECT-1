# EASY WORLD - Educational Platform

A modern full-stack web application for managing educational resources with separate portals for students and administrators.

## Features

- **Dual Authentication:** Student and Admin login with role-based access control
- **Modern UI:** Responsive design split-screen login, dynamic dashboards
- **Student Dashboard:** Course access, profile management, password changes
- **Admin Dashboard:** Student statistics, user management, file uploads
- **Protected Pages:** Branch course pages require authentication
- **JWT Security:** HTTP-only cookies, bcrypt password hashing, rate limiting

## Quick Start

1. **Set up Backend:** See `SETUP.md` for detailed instructions
   ```bash
   cd backend
   npm install
   cp .env.example .env  # configure your database
   createdb easy_world_db
   npm run migrate
   npm start
   ```

2. **Serve Frontend:**
   ```bash
   # In a separate terminal
   cd PROJECT
   python -m http.server 5500
   # or use VS Code Live Server
   ```

3. **Open:** `http://localhost:5500`

## Default Admin Login

- **Email:** `admin@easyworld.com`
- **Password:** `Admin@123`

**Change password after first login!**

## Documentation

- [Setup Guide](./SETUP.md) - Complete installation and deployment instructions
- [Backend API](../backend/README.md) - API reference and development notes

## Tech Stack

**Frontend:**
- HTML5, CSS3 (Grid/Flexbox, CSS Variables, Animations)
- Vanilla JavaScript (ES6+)
- Responsive design (mobile-friendly)

**Backend:**
- Node.js + Express
- PostgreSQL + Knex
- JWT authentication (HTTP-only cookies)
- Bcrypt for password hashing
- Multer for file uploads

## Project Structure

```
PROJECT/              # Frontend (static files)
├── index.html
├── login.html
├── user-dashboard.html
├── admin-dashboard.html
├── R23.html, R20.html
├── R23/, R20/       # Branch-specific content (protected)
├── css/
│   ├── index.css
│   ├── style.css
│   ├── user-dashboard.css
│   └── admin-dashboard.css
├── js/
│   ├── api.js
│   ├── auth.js
│   ├── login.js
│   ├── user-dashboard.js
│   ├── admin-dashboard.js
│   └── index.js
├── assets/ (images, videos)
└── SETUP.md

backend/              # Node.js API
├── src/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── index.js
├── uploads/
├── migrations/
├── package.json
└── README.md
```

## License

ISC

---

For any issues, refer to [SETUP.md](./SETUP.md#troubleshooting).