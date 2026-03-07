# Navbook - Quick Start Guide

## ⚡ Running Navbook in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Python 3.10+ installed
- Neon Database connected (already done ✅)
- Vercel Blob token ready

---

## Step 1: Setup Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```bash
DATABASE_URL=<your-neon-database-url>
JWT_SECRET=your-super-secret-key-change-this-in-production
BLOB_READ_WRITE_TOKEN=<your-vercel-blob-token>
```

Get your tokens from:
- **DATABASE_URL**: Neon Dashboard → Connection String
- **BLOB_READ_WRITE_TOKEN**: Vercel Dashboard → Settings → Integrations → Blob

---

## Step 2: Install & Run Backend

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python -m uvicorn app:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Backend is now running at: **http://localhost:8000**

---

## Step 3: Install & Run Frontend

Open a **new terminal** and run:

```bash
# Install dependencies (only first time)
npm install

# Run Next.js development server
npm run dev
```

**Expected output:**
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
```

Frontend is now running at: **http://localhost:3000**

---

## Step 4: Test the App

1. Open **http://localhost:3000** in your browser
2. You'll see the login page
3. Click "Don't have an account? Register" to create a test user
4. Use any username/password (e.g., `testuser` / `testpass123`)
5. After login, upload a test file to verify everything works

---

## Test User (If Pre-Created)

```
Username: demo
Password: demo123
```

---

## Troubleshooting

### Issue: Backend won't start
- Check if port 8000 is already in use
- Run on different port: `python -m uvicorn app:app --reload --port 8001`

### Issue: Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local`
- Check backend is running on port 8000

### Issue: Database connection fails
- Copy correct `DATABASE_URL` from Neon dashboard
- Make sure it starts with `postgresql://`

### Issue: Blob upload fails
- Verify `BLOB_READ_WRITE_TOKEN` is correct
- Get it from Vercel Dashboard → Integrations → Blob

---

## Helpful Commands

```bash
# Check if backend is running
curl http://localhost:8000/health

# View backend logs
# Terminal should show live logs during development

# Reset frontend cache
rm -rf .next/

# Install new npm package
npm install package-name
```

---

## Next Steps

- Upload some test files
- Try searching and filtering
- Test the media viewer
- Delete files to verify deletion works

Enjoy using Navbook! 🎉
