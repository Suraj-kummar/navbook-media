# Running Navbook - Complete Guide

## Pre-Flight Checklist ✓

Before running, make sure you have:

```
[✓] Node.js 18+ installed
[✓] Python 3.10+ installed
[✓] Neon database connected
[✓] Vercel Blob token ready
[✓] All files created in /vercel/share/v0-project
```

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Navbook Application             │
├─────────────────┬───────────────────────┤
│  Next.js 16     │     FastAPI Backend    │
│  Port 3000      │     Port 8000          │
│  (Frontend)     │     (API Server)       │
└────────┬────────┴───────────┬────────────┘
         │                    │
         └──────────┬─────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼─────┐         ┌─────▼────┐
    │   Neon   │         │ Vercel   │
    │   DB     │         │  Blob    │
    └──────────┘         └──────────┘
```

---

## Running the Project

### Terminal 1: Start Backend

```bash
cd backend

# Setup virtual environment (first time only)
python -m venv venv
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies (first time only)
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials:
# - DATABASE_URL
# - JWT_SECRET  
# - BLOB_READ_WRITE_TOKEN

# Start backend
python -m uvicorn app:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

✓ Backend ready at http://localhost:8000

---

### Terminal 2: Start Frontend

```bash
# From project root (not backend folder)

# Install dependencies (first time only)
npm install

# Create .env.local
cp .env.example .env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:8000

# Start frontend
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 16.0.0
  - ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

✓ Frontend ready at http://localhost:3000

---

## Using the App

### 1. Create Account
1. Go to http://localhost:3000
2. Click "Register"
3. Enter username and password
4. Click "Register"

### 2. Upload Files
1. Click "Choose Files" or drag files
2. Add optional description and tags
3. Click "Upload"
4. File appears in grid

### 3. Search & Filter
- Use search box to find by filename
- Use filter dropdown for file type
- Results update in real-time

### 4. View Files
- Click "View" button on any file
- See preview in modal
- Download or delete from modal

### 5. Logout
- Click user menu (top right)
- Click "Logout"

---

## Testing Endpoints

Use the provided test script:

```bash
cd scripts
chmod +x test-api.sh
./test-api.sh
```

Or test manually with curl:

```bash
# Health check
curl http://localhost:8000/health

# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# List files
curl "http://localhost:8000/files/list?token=YOUR_TOKEN"
```

---

## File Locations

```
/vercel/share/v0-project/
├── app/                        # Next.js pages
│   ├── layout.tsx             # Root layout
│   ├── login/page.tsx         # Login page
│   └── dashboard/
│       ├── layout.tsx         # Dashboard layout
│       └── page.tsx           # Dashboard page
├── components/                 # React components
│   ├── file-*.tsx             # File management UI
│   ├── media-viewer.tsx       # Preview modal
│   └── ui/                    # shadcn/ui components
├── lib/
│   └── auth-context.tsx       # Auth state management
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Example env vars
│   └── pyproject.toml        # Python project config
├── scripts/
│   ├── 001-create-schema.sql # Database schema
│   └── test-api.sh          # API test script
├── package.json              # Node dependencies
├── .env.example              # Frontend env example
├── SETUP.md                  # Detailed setup guide
├── QUICKSTART.md            # Quick start (5 min)
├── RUNNING.md               # This file
└── TEST_REPORT.md          # Test results
```

---

## Common Issues & Solutions

### Backend won't start
```bash
# Port 8000 in use?
lsof -i :8000  # Find what's using port
kill -9 <PID>  # Kill the process
# OR use different port:
python -m uvicorn app:app --reload --port 8001
```

### Frontend won't connect to backend
```bash
# Check .env.local has correct URL
cat .env.local
# Should have: NEXT_PUBLIC_API_URL=http://localhost:8000

# Clear Next.js cache
rm -rf .next/

# Restart: Ctrl+C then npm run dev
```

### Database connection fails
```bash
# Verify DATABASE_URL format
# Should start with: postgresql://

# Test connection:
psql "your-database-url"

# Check .env file exists in backend/
cat backend/.env
```

### Blob upload fails
```bash
# Verify token is correct in backend/.env
grep BLOB_READ_WRITE_TOKEN backend/.env

# Get correct token from:
# Vercel Dashboard → Settings → Integrations → Blob

# Restart backend after changing .env
```

### CORS errors
- Already configured in backend/app.py
- Allows http://localhost:3000
- If running on different port, add it to CORS origins

---

## Development Workflow

### Making changes to Frontend
1. Edit files in `/app` or `/components`
2. Next.js HMR automatically reloads (you'll see changes instantly)
3. Check browser console for errors

### Making changes to Backend
1. Edit files in `/backend/app.py`
2. Backend auto-reloads (uvicorn --reload)
3. Check terminal for errors

### Adding new dependencies

**Frontend:**
```bash
npm install package-name
```

**Backend:**
```bash
cd backend
pip install package-name
pip freeze > requirements.txt  # Update requirements
```

---

## Deployment

### Deploy Frontend to Vercel

```bash
# Push to GitHub first
git add .
git commit -m "Deploy Navbook"
git push origin main

# Then on Vercel Dashboard:
# 1. Connect your GitHub repo
# 2. Add environment variables:
#    - NEXT_PUBLIC_API_URL=your-backend-url
# 3. Deploy
```

### Deploy Backend

Backend can run on:
- **Heroku** (simple, free tier available)
- **Railway** (Vercel alternative)
- **Self-hosted VPS**
- **Docker** (create Dockerfile)

For Vercel Functions deployment:
```bash
# Use serverless functions approach
# See backend/README.md for details
```

---

## Performance Tips

1. **Images**: Blob CDN caches automatically
2. **Database**: Indexes created on user_id, created_at
3. **Frontend**: Next.js optimizes JS/CSS automatically
4. **Search**: Case-insensitive ILIKE query is efficient

---

## Monitoring

### Backend Logs
- Watch terminal running uvicorn
- Shows all requests and errors

### Frontend Logs
- Open browser DevTools (F12)
- Check Console tab
- Network tab shows API calls

### Database
- Neon dashboard shows query stats
- Check connection count

---

## Cleanup

To reset everything:

```bash
# Delete database data (WARNING!)
# Go to Neon dashboard → delete tables

# Or reset via SQL:
# DELETE FROM files;
# DELETE FROM users;

# Clear frontend cache
rm -rf .next/

# Clear npm cache (if issues)
npm cache clean --force
```

---

## Troubleshooting Checklist

```
□ Both terminals showing "ready" messages?
□ Can access http://localhost:3000?
□ Can create account without errors?
□ Network tab shows /files/list request?
□ File upload completes?
□ File appears in grid?
```

If any checkbox fails, check the "Common Issues" section above.

---

## Need Help?

1. Check the terminal/console for error messages
2. Review TEST_REPORT.md for expected behavior
3. Check SETUP.md for detailed configuration
4. Review specific file (login.tsx, app.py, etc.)

---

Good luck! Your Navbook instance should be running. 🚀
