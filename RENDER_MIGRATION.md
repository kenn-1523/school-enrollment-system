# Frontend-Backend Integration: Render Migration Guide

## Summary of Changes

This document outlines all the changes made to sync the frontend with the Render backend at `https://school-enrollment-system.onrender.com`.

---

## ✅ Changes Made

### 1. **Frontend Environment Configuration**

**File:** [.env.production](apps/client/.env.production)
```env
NEXT_PUBLIC_API_URL=https://school-enrollment-system.onrender.com
```
- Updated from `https://api-croupiertraining.sgwebworks.com` to point to Render backend
- This environment variable is picked up during the Next.js build process
- Used as fallback in all API calls

---

### 2. **Centralized Axios Configuration**

**File:** [src/lib/axiosInstance.js](apps/client/src/lib/axiosInstance.js) ✨ **NEW**

This is now the **single source of truth** for all API communication:

```javascript
import axiosInstance from '@/lib/axiosInstance';

// Use in any service:
await axiosInstance.post('/admin/login', { username, password });
```

**Features:**
- ✅ Automatically uses `NEXT_PUBLIC_API_URL` environment variable
- ✅ Injects `Authorization: Bearer <token>` header for all JWT-authenticated requests
- ✅ Handles 401 errors (unauthorized) with auto-logout
- ✅ 30-second timeout for cold starts on Render
- ✅ Proper error logging and handling

**Request Interceptor:**
- Reads JWT token from `localStorage`
- Automatically adds `Authorization` header to all requests

**Response Interceptor:**
- Handles 401 errors by clearing token and redirecting to `/login`
- Logs network and timeout errors

---

### 3. **Updated Auth Service**

**File:** [src/services/authService.js](apps/client/src/services/authService.js)

Now uses the centralized `axiosInstance`:

```javascript
import axiosInstance from '@/lib/axiosInstance';

export const login = async (username, password) => {
  const response = await axiosInstance.post('/admin/login', {
    username,
    password
  });
  // Response handling...
};
```

**Benefits:**
- Single source of truth for API configuration
- Consistent error handling across all services
- JWT injection happens automatically
- No need to manually manage headers

---

### 4. **Updated API Client**

**File:** [src/lib/apiClient.js](apps/client/src/lib/apiClient.js)

```javascript
const rootURL = process.env.NEXT_PUBLIC_API_URL || 'https://school-enrollment-system.onrender.com';
export const API_BASE = `${rootURL}/api`;
```

- Updated fallback URL from old domain to Render
- Maintained for backward compatibility with existing code

---

### 5. **Updated Login Page**

**File:** [src/features/auth/LoginPage.jsx](apps/client/src/features/auth/LoginPage.jsx)

```javascript
const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://school-enrollment-system.onrender.com'}/api/admin/login`;
```

- Updated fallback to use Render backend URL

---

### 6. **Backend CORS Configuration**

**File:** [apps/server/src/server.js](apps/server/src/server.js)

Production CORS settings (already configured):

```javascript
const corsOptions = isProd ? {
  origin: [
    'https://croupiertraining.sgwebworks.com',
    'https://www.croupiertraining.sgwebworks.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200  // ✅ Prevents preflight 'Network Error'
}
```

**Key Features:**
- ✅ Allows both `www` and non-`www` variants of frontend domain
- ✅ `optionsSuccessStatus: 200` prevents CORS preflight errors
- ✅ `Authorization` header is explicitly allowed (JWT support)
- ✅ `preflightContinue: false` - OPTIONS requests are auto-handled
- ✅ Credentials set to `false` (header-only auth, no cookies)

---

## 🚀 How to Use

### For Frontend Developers

**Always import from the centralized axiosInstance:**

```javascript
// ✅ CORRECT - Use this everywhere
import axiosInstance from '@/lib/axiosInstance';

const data = await axiosInstance.get('/admin');
const result = await axiosInstance.post('/admin/login', { username, password });
```

**Do NOT create custom Axios instances:**
```javascript
// ❌ WRONG - Don't do this
const api = axios.create({ baseURL: 'https://...' });
```

### For Backend Deployment

When deploying to Render:
1. Set environment variables:
   ```
   NODE_ENV=production
   DB_HOST=<your-db-host>
   DB_USER=<your-db-user>
   DB_NAME=<your-db-name>
   JWT_SECRET=<your-jwt-secret>
   ```

2. The CORS configuration will automatically activate for production (as long as `NODE_ENV=production`)

3. Frontend requests to `https://school-enrollment-system.onrender.com/api/*` will work with proper preflight handling

---

## 🔄 Request Flow

```
Frontend (croupiertraining.sgwebworks.com)
    ↓
[axiosInstance.post('/admin/login', ...)]
    ↓
Adds Authorization: Bearer <token> header
    ↓
Browser sends OPTIONS preflight request (CORS)
    ↓
Backend receives OPTIONS → CORS middleware
    ↓
Responds with:
    Access-Control-Allow-Origin: https://croupiertraining.sgwebworks.com
    Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
    Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept
    (optionsSuccessStatus: 200)
    ↓
Browser sends actual POST request
    ↓
Backend receives POST → handles login
    ↓
Returns { success: true, token: "..." }
    ↓
Frontend stores token in localStorage
    ↓
Future requests automatically include Authorization header
```

---

## 📋 API Endpoints

All endpoints are relative to the base URL:
- **Production:** `https://school-enrollment-system.onrender.com/api`
- **Development (localhost):** `http://localhost:3001/api`

Available endpoints:
- `POST /admin/login` - Admin authentication
- `POST /student/login` - Student authentication
- `POST /logout` - Clear session
- `GET /me` - Get current user info
- `GET /health` - Backend health check
- `POST /admin/...` - Admin operations
- `GET /student/...` - Student operations
- `POST /enroll/...` - Enrollment operations

---

## 🔐 JWT Authentication

The system uses **header-only JWT authentication** (no cookies).

**Token flow:**
1. User logs in via `/admin/login` or `/student/login`
2. Backend returns JWT token in response body
3. Frontend stores in `localStorage` as key `token`
4. axiosInstance automatically adds `Authorization: Bearer <token>` to all requests
5. Backend validates token on protected endpoints

**Managing tokens:**
```javascript
// Store (happens automatically on login)
localStorage.setItem('token', response.data.token);

// Use (happens automatically via axiosInstance)
// Authorization: Bearer <token>

// Clear (happens automatically on logout or 401)
localStorage.removeItem('token');
```

---

## 🐛 Troubleshooting

### Issue: "Network Error" or CORS blocked

**Solution:** Verify CORS configuration on backend:
- Check `optionsSuccessStatus: 200` is set
- Verify frontend domain is in the `origin` array
- Check `allowedHeaders` includes `'Authorization'`

### Issue: "Not authenticated" on protected routes

**Solution:** Verify JWT token handling:
- Check token is stored in `localStorage` with key `token`
- Verify token is being sent via `Authorization: Bearer <token>` header
- Check JWT_SECRET on backend matches token creation

### Issue: Frontend requests timeout

**Solution:** Check Render backend:
- May be in "sleeping" state on free tier
- First request takes ~30 seconds to wake up
- axiosInstance has 30-second timeout configured

---

## 📝 Environment Variables

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://school-enrollment-system.onrender.com
```

### Backend (Render Environment Variables)
```env
NODE_ENV=production
DB_HOST=your-database-host
DB_USER=your-database-user
DB_NAME=your-database-name
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=4h
PORT=3001
```

---

## ✅ Deployment Checklist

- [ ] `.env.production` has `NEXT_PUBLIC_API_URL=https://school-enrollment-system.onrender.com`
- [ ] All services import from `@/lib/axiosInstance`
- [ ] Backend environment variables are set on Render
- [ ] `NODE_ENV=production` is set on Render
- [ ] CORS origins include frontend domain (production)
- [ ] JWT_SECRET is configured and matches on both frontend and backend
- [ ] Database connection is working on Render
- [ ] Built frontend files are deployed (run `npm run build:clean`)
- [ ] Backend is deployed to Render
- [ ] Test login flow: frontend → CORS preflight → backend → token returned
