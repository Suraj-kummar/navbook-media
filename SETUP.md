# Navbook - Setup Guide

Navbook is a secure private media vault with a Next.js frontend and FastAPI backend.

## Architecture

- **Frontend**: Next.js 16 with React 19 (TypeScript)
- **Backend**: FastAPI with Python
- **Database**: PostgreSQL (Neon)
- **Storage**: Vercel Blob (FREE!)
- **Authentication**: JWT-based with bcrypt password hashing

## Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL database (via Neon)
- Vercel account with Blob integration enabled

## Quick Start

### 1. Database Setup

The database schema has already been created via migration. Verify connection:

```bash
# Test Neon connection (replace with your DATABASE_URL)
psql your-database-url
```

### 2. Backend Setup

```bash
cd backend

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your credentials
cp .env.example .env

# Required environment variables:
# DATABASE_URL=postgresql://user:password@host/dbname
# JWT_SECRET=your-secret-key-change-in-production
# BLOB_READ_WRITE_TOKEN=your-vercel-blob-token (from Vercel dashboard)

# Run the server
python -m uvicorn app:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
# Install dependencies
npm install  # or pnpm install

# Create .env.local file
cp .env.example .env.local

# Required environment variables:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Default Credentials

For demo purposes, create a test user via the backend:

```bash
# Use curl or Postman to register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

Then login with these credentials in the frontend.

## Features

- **Secure Authentication**: JWT-based login with bcrypt password hashing
- **Private Media Vault**: Upload images, videos, and documents
- **Free Storage**: Files stored in Vercel Blob (100GB free tier)
- **Search & Filter**: Find files by name, tags, or description
- **Media Viewer**: Preview images and videos inline
- **File Management**: Delete files with confirmation
- **Responsive Design**: Works on desktop and mobile

## Storage - Vercel Blob

Vercel Blob is completely free and integrates seamlessly with your Vercel deployment:

- **Free Tier**: 100GB storage included
- **No AWS Setup**: No credentials or complex configuration needed
- **Automatic Scaling**: Scales with your application
- **CDN Included**: Files delivered through Vercel's global CDN

To get your Blob token:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Settings > Integrations > Blob
3. Copy your `BLOB_READ_WRITE_TOKEN`
4. Add it to your backend `.env` file

## Project Structure

```
.
├── app/                      # Next.js app
│   ├── layout.tsx
│   ├── login/               # Login page
│   └── dashboard/           # Dashboard with media vault
├── components/              # React components
│   ├── file-upload-area.tsx
│   ├── file-grid.tsx
│   ├── file-card.tsx
│   └── media-viewer.tsx
├── lib/                     # Utilities
│   └── auth-context.tsx     # Authentication context
├── backend/                 # FastAPI backend
│   ├── app.py              # Main API server
│   ├── pyproject.toml      # Python dependencies
│   └── .env.example
└── scripts/                 # Database migrations
    └── 001-create-schema.sql
```

## Database Schema

### users table
- `id`: User ID (primary key)
- `username`: Unique username
- `password_hash`: Bcrypt hashed password
- `created_at`: Account creation timestamp

### files table
- `id`: File ID (primary key)
- `user_id`: Owner user ID (foreign key)
- `original_filename`: Original filename
- `file_key`: S3 storage key
- `file_type`: MIME type
- `file_size`: Size in bytes
- `description`: Optional file description
- `tags`: Comma-separated tags
- `created_at`: Upload timestamp
- `updated_at`: Last update timestamp

## API Endpoints

### Authentication
- `POST /auth/login` - Login and get JWT token
- `POST /auth/register` - Register new user
- `GET /auth/me` - Check current authentication
- `POST /auth/logout` - Logout

### Files
- `POST /files/upload` - Upload file
- `GET /files/list` - List user's files with search and filter
- `GET /files/{file_id}/download` - Download file
- `GET /files/{file_id}/preview` - Get preview URL
- `DELETE /files/{file_id}` - Delete file
- `GET /files/search` - Search files

## Deployment

### Frontend (Vercel)
```bash
npm run build
vercel deploy
```

### Backend (Railway, Heroku, or similar)
```bash
# Set environment variables on your hosting platform
# Then deploy the backend/ directory
```

## Troubleshooting

### Backend Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correct in frontend .env.local
- Check backend is running on the correct port
- Enable CORS if needed in `app.py`

### S3 Upload Failures
- Verify AWS credentials are correct
- Check S3 bucket exists and is accessible
- Ensure bucket policy allows uploads

### Database Connection Issues
- Test connection with psql command
- Check DATABASE_URL format is correct
- Verify network access to database server

## Security Notes

⚠️ **Important for Production:**
- Change `JWT_SECRET` to a strong random value
- Use HTTPS for all connections
- Set strong passwords for AWS and database accounts
- Enable S3 bucket versioning and backup
- Set up regular database backups
- Use environment variables for all secrets (never commit to git)

## Support

For issues or questions, check the API response status and error messages for debugging.
