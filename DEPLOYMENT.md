# Deployment Guide - Vercel + Railway

Deploy EASY WORLD as a full-stack application with frontend on Vercel and backend on Railway (or Render).

## Overview

- **Frontend:** Vercel (static hosting)
- **Backend:** Railway (Node.js + PostgreSQL)
- **Domain:** Your Vercel app URL (e.g., `https://easy-world.vercel.app`)

## Architecture

```
User → Vercel (Frontend) → Railway (Backend API) → Railway PostgreSQL
```

Vercel's `vercel.json` proxies all `/api/*` requests to your Railway backend, so the frontend can use relative URLs (`/api/auth/login`) and CORS issues are avoided.

---

## Step 1: Deploy Backend to Railway

### 1.1 Prerequisites

- GitHub account
- Railway account (https://railway.app) - sign up with GitHub
- PostgreSQL database (Railway provides addon)

### 1.2 Push Code to GitHub

Make sure your project is in a GitHub repository:

```bash
cd /path/to/project
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

### 1.3 Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Select the **`backend`** folder as the root (or set ROOT directory in settings)

### 1.4 Add PostgreSQL Database

1. In your Railway project, click **"Variables"** tab
2. Add a **PostgreSQL** plugin/database from the marketplace
3. Railway will automatically create these environment variables:
   - `DATABASE_URL` (contains all connection info)
   - `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

### 1.5 Configure Backend Environment Variables

In Railway Dashboard → **Variables** tab, add these **User Variables**:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `JWT_SECRET` | *(random string)* | **CHANGE THIS!** Use a strong random string |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Your future Vercel URL |
| `DEFAULT_ADMIN_EMAIL` | `admin@easyworld.com` | Admin email |
| `DEFAULT_ADMIN_PASSWORD` | `YourSecureAdminPass123!` | **CHANGE THIS!** Strong admin password |

Note: Railway auto-provides `DATABASE_URL` from the PostgreSQL addon.

### 1.6 Update `knexfile.js` for Railway

Railway provides `DATABASE_URL` in this format: `postgresql://user:pass@host:port/db`

Update `backend/knexfile.js` production config to use it:

```javascript
production: {
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },
  migrations: { tableName: 'knex_migrations' }
}
```

(Already configured in our knexfile.js to use process.env)

### 1.7 Deploy Backend

1. Railway will automatically deploy on push to main branch
2. Wait for build to complete (should see "Deploy succeeded")
3. Copy your Railway backend URL (e.g., `https://easyworld-backend-production.up.railway.app`)
4. Test: Open `https://YOUR_BACKEND_URL/health` - should return JSON

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Prerequisites

- Vercel account (https://vercel.com) - sign up with GitHub
- Your backend is deployed and you have the Railway URL

### 2.2 Update `vercel.json` with Your Backend URL

In `PROJECT/vercel.json`, update the `routes` section:

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://YOUR-RAILWAY-BACKEND.railway.app/api/$1",
      "continue": true
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

Replace `YOUR-RAILWAY-BACKEND.railway.app` with your actual Railway backend URL.

**Alternative (recommended for flexibility):** Use Vercel Environment Variables:

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://api.easyworld.com/api/$1",
      "continue": true
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

And set `API_URL` in Vercel project settings to your Railway URL. But Vercel's rewrites don't support env vars directly in vercel.json. So you'll need to hardcode the Railway URL for now.

### 2.3 Deploy to Vercel

1. Push your updated `vercel.json` to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **"New Project"**
4. Import your GitHub repository
5. **Important:** Set **Root Directory** to `PROJECT` (not the repo root)
6. Click **Deploy**
7. Wait for build to complete

Vercel will give you a URL like: `https://easy-world.vercel.app`

### 2.4 Test Deployment

1. Open your Vercel URL
2. Click "Get Started" or "Login"
3. Register a new student account
4. Should successfully create account and redirect to dashboard
5. As admin, login with `admin@easyworld.com` / `YourSecureAdminPass123!`

---

## Step 3: Finalize & Secure

### 3.1 Update Admin Credentials

After first admin login:
1. Go to Admin Dashboard → Profile/Students
2. Change admin email and password to something secure
3. Remove the default seeded credentials from Railway `.env` variables

### 3.2 Enable HTTPS (Automatic)

Both Vercel and Railway provide HTTPS by default. No action needed.

### 3.3 Test Everything

- ✅ Student registration works
- ✅ Student login redirects to dashboard
- ✅ Admin login works
- ✅ Protected pages (R23.html, R20.html) redirect when not logged in
- ✅ File uploads work (files stored in Railway's ephemeral filesystem - not permanent!)
- ✅ Logout clears cookies

**Important:** Railway's filesystem is ephemeral. Uploaded files will be lost on redeploy. For production file storage, integrate with S3, Cloudinary, or Railway's Persistent Volume (if available).

---

## Alternative: Deploy Backend to Render

If Railway doesn't work, Render is another excellent free-tier option.

### Deploy Backend to Render

1. Sign up at https://render.com
2. Create a **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `Node`
5. Add a **PostgreSQL** database from Render's marketplace
6. Add Environment Variables (same as Railway)
7. Deploy

Render will provide a URL like `https://your-backend.onrender.com`

Then update `PROJECT/vercel.json`:

```json
"dest": "https://your-backend.onrender.com/api/$1"
```

---

## Important Notes

### CORS & Cookies

With Vercel → Railway proxy setup, requests appear to come from same origin (`your-app.vercel.app`), so cookies work seamlessly.

### Database Persistence

- Railway PostgreSQL is persistent and survives restarts
- Railway's local filesystem (`backend/uploads/`) is **ephemeral** - files disappear on each deploy
- For production: Store uploads in cloud storage (AWS S3, Cloudinary) or use Railway's Persistent Volume (paid)

### Domain Names

To use a custom domain (e.g., `app.easyworld.com`):

1. In Vercel: Add domain → configure DNS
2. In Railway: Update `FRONTEND_URL` env var to match custom domain
3. Update `vercel.json` rewrite `dest` if needed

### Environment Variables in Vercel

Vercel doesn't expose runtime environment variables to static files. Our setup uses a **rewrites proxy** so the frontend can use relative URLs without knowing the backend URL.

If you want to keep backend URL configurable without hardcoding in `vercel.json`, consider:

1. Using Vercel serverless functions as a backend API layer (more complex)
2. Using a simple config file that you edit before each deploy
3. Using a reverse proxy like Nginx on a VPS (not serverless)

### Rate Limiting

Current rate limit: 5 login attempts per 15 minutes. Adjust in `backend/src/index.js` if needed.

### Security Checklist

Before going live:

- [ ] Change `JWT_SECRET` to a strong random string ( Railway env var )
- [ ] Change default admin password
- [ ] Set `NODE_ENV=production` in Railway
- [ ] Set `secure: true` in `backend/src/config/jwt.js` for HTTPS only (already does this based on NODE_ENV)
- [ ] Set `sameSite: 'strict'` in cookie options
- [ ] Enable rate limiting on all public endpoints (currently only login)
- [ ] Add input sanitization (currently using parameterized queries via Knex - good)
- [ ] Consider adding CSRF protection (if needed)

---

## Quick Deployment Commands

### Railway CLI (Alternative)

```bash
npm install -g @railway/cli
railway login
railway init
railway add
# Follow prompts, select backend folder
railway up
```

---

## Troubleshooting

### "Failed to fetch" on Vercel

- Check `vercel.json` rewrite URL matches your Railway backend
- In Vercel → Project Settings → Environment Variables, ensure no conflicting `API_URL`
- Check Vercel function logs if using serverless
- Test Railway backend directly: `https://your-backend.railway.app/health`

### CORS Errors

With proxy setup, CORS shouldn't be an issue. If you see CORS errors:
- Ensure `FRONTEND_URL` in Railway matches your Vercel URL exactly (including protocol)
- In `backend/src/index.js`, CORS origin is set to `FRONTEND_URL` only
- If testing locally, `FRONTEND_URL` should be `http://localhost:5500`

### Cookies Not Working

- Both Vercel and Railway must use HTTPS (they do)
- Check that cookie options: `httpOnly: true, secure: true, sameSite: 'lax'` (in production)
- Vercel proxy should preserve cookies

### Database Connection Fails on Railway

- Verify PostgreSQL addon is attached
- Check `DATABASE_URL` environment variable exists (Railway adds automatically)
- Ensure knexfile.js production config uses `process.env.DATABASE_URL` (it does)

### 502 Bad Gateway from Vercel

- Railway backend may be sleeping (free tier) - first request takes time to wake
- Check Railway logs for errors
- Verify backend health endpoint returns 200

---

## Live Example

After deployment:

- **Frontend:** `https://easy-world.vercel.app`
- **Backend:** `https://easyworld-backend.up.railway.app`
- **Admin Login:** `admin@easyworld.com` / `YourSecurePass123!`

---

## Need Help?

- Check backend logs in Railway Dashboard
- Check Vercel logs in Project → Functions/Logs
- Open browser DevTools → Network tab to see failing requests
- Verify environment variables are set correctly

---

**Happy Deploying! 🚀**