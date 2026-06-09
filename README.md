# 🔐 Navbook - Private Media Vault

<div align="center">

![Navbook Logo](public/placeholder-logo.svg) 

**A secure, self-hosted private media vault for storing and managing your personal files**  

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-yellow?style=flat-square&logo=python)](https://www.python.org/)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Documentation](#-api-documentation) • [Deployment](#-deployment)

</div>  

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Configuration](#-configuration)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Navbook is a full-stack private media vault application that provides secure file storage with user authentication, search capabilities, and media preview functionality. Built with modern web technologies, it offers a seamless experience for managing your personal files with enterprise-grade security.

### Why Navbook?

- **Privacy First**: Your files, your server, your control
- **Zero Cost Storage**: Uses Vercel Blob's free 100GB tier
- **Modern Stack**: Built with Next.js 16, React 19, and FastAPI
- **Type Safe**: Full TypeScript implementation
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Easy Deployment**: Deploy to Vercel, Railway, or any cloud platform

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with bcrypt password hashing
- Secure session management with token expiration
- User registration and login system
- Protected API endpoints with Bearer token authentication
- CORS configuration for secure cross-origin requests

### 📁 File Management
- **Upload**: Drag-and-drop or click-to-select file upload
- **Preview**: In-browser preview for images, videos, and PDFs
- **Download**: Secure file download with authentication
- **Delete**: File deletion with confirmation dialog
- **Metadata**: Add descriptions and tags to organize files

### 🔍 Search & Filter
- Real-time search by filename, description, or tags
- Filter by file type (Images, Videos, Documents)
- Combined search and filter capabilities
- Responsive grid layout with file cards

### 🎨 User Interface
- Modern, clean design with Tailwind CSS
- Dark mode support via design tokens
- Responsive layout for all screen sizes
- Loading states and error handling
- Toast notifications for user feedback

### 💾 Storage
- Vercel Blob integration (100GB free tier)
- In-memory storage for development/testing
- PostgreSQL support for production (optional)
- Automatic file cleanup on deletion

---
 
## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16.1.6 (App Router)
- **UI Library**: React 19.2.4
- **Language**: TypeScript 5.7.3
- **Styling**: Tailwind CSS 4.2.0
- **Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context API
- **HTTP Client**: Fetch API
- **Analytics**: Vercel Analytics

### Backend
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.10+
- **Server**: Uvicorn (ASGI)
- **Authentication**: PyJWT + bcrypt
- **Database**: PostgreSQL (via asyncpg) or In-Memory
- **Storage**: Vercel Blob SDK
- **Validation**: Pydantic 2.5+

### DevOps & Tools
- **Package Manager**: npm/pnpm
- **Version Control**: Git
- **Deployment**: Vercel (Frontend), Railway/Render (Backend)
- **Environment**: dotenv for configuration

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js App (React 19 + TypeScript)                 │   │
│  │  - App Router                                        │   │
│  │  - Server Components                                 │   │
│  │  - Client Components                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FastAPI Backend (Python)                            │   │
│  │  - JWT Authentication Middleware                     │   │
│  │  - CORS Configuration                                │   │
│  │  - Request Validation (Pydantic)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │   File       │  │   Search     │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │  Vercel Blob │  │  In-Memory   │      │
│  │  (Optional)  │  │   Storage    │  │   Cache      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication Flow**:
   ```
   User → Login Form → FastAPI /auth/login → JWT Token → LocalStorage → Subsequent Requests
   ```

2. **File Upload Flow**:
   ```
   User → File Upload → FormData + JWT → FastAPI → Vercel Blob → Database → Response
   ```

3. **File Retrieval Flow**:
   ```
   User → Request + JWT → FastAPI → Verify Token → Fetch from Blob → Stream to Client
   ```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **Python**: v3.10 or higher ([Download](https://www.python.org/))
- **npm/pnpm**: Latest version (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))

### Optional (for production):
- **PostgreSQL**: v14+ (via [Neon](https://neon.tech/) or local)
- **Vercel Account**: For Blob storage ([Sign up](https://vercel.com/))

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/navbook-media.git
cd navbook-media
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local and set:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

The frontend will be available at **http://localhost:3000**

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env and set:
# JWT_SECRET=your-super-secret-key-change-this
# BLOB_READ_WRITE_TOKEN=your-vercel-blob-token (optional for testing)

# Start backend server
python -m uvicorn app_simple:app --reload --port 8000
```

The backend will be available at **http://localhost:8000**

### 4. Access the Application

1. Open your browser and navigate to **http://localhost:3000**
2. Click **"Don't have an account? Register"**
3. Create your account with a username and password
4. Start uploading and managing your files!

---

## 📂 Project Structure

```
navbook-media/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Dashboard page
│   │   ├── layout.tsx          # Dashboard layout
│   │   └── page.tsx            # Dashboard main page
│   ├── login/                  # Login page
│   │   └── page.tsx            # Login/Register page
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home page (redirects)
│   └── globals.css             # Global styles
│
├── components/                  # React components
│   ├── ui/                     # shadcn/ui components (57 files)
│   ├── dashboard-header.tsx    # Dashboard header
│   ├── file-card.tsx           # Individual file card
│   ├── file-grid.tsx           # File grid layout
│   ├── file-upload-area.tsx    # File upload component
│   ├── media-viewer.tsx        # Media preview modal
│   └── theme-provider.tsx      # Theme context provider
│
├── lib/                        # Utility libraries
│   ├── auth-context.tsx        # Authentication context
│   └── utils.ts                # Helper functions
│
├── backend/                    # FastAPI backend
│   ├── app.py                  # Main API (with PostgreSQL)
│   ├── app_simple.py           # Simplified API (in-memory)
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment template
│   └── .env                    # Environment variables (gitignored)
│
├── public/                     # Static assets
│   ├── icon.svg                # App icon
│   ├── placeholder-logo.svg    # Logo
│   └── ...                     # Other assets
│
├── scripts/                    # Database scripts
│   └── 001-create-schema.sql  # PostgreSQL schema
│
├── .env.local                  # Frontend environment (gitignored)
├── .env.example                # Frontend environment template
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Node.js dependencies
├── README.md                   # This file
├── SETUP.md                    # Detailed setup guide
├── TEST_REPORT.md              # Feature test report
└── QUICK_START.md              # Quick start guide
```

---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:8000
Production: https://your-api-domain.com
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response: 200 OK
{
  "access_token": "string",
  "token_type": "bearer",
  "user_id": 1
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response: 200 OK
{
  "access_token": "string",
  "token_type": "bearer",
  "user_id": 1
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "user_id": 1,
  "username": "string"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

### File Management Endpoints

#### Upload File
```http
POST /files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- file: File
- description: string (optional)
- tags: string (optional, comma-separated)

Response: 200 OK
{
  "id": 1,
  "filename": "string",
  "size": 1024,
  "message": "File uploaded successfully"
}
```

#### List Files
```http
GET /files/list?search=query&file_type=images
Authorization: Bearer <token>

Query Parameters:
- search: string (optional) - Search in filename, description, tags
- file_type: string (optional) - Filter: all|images|videos|documents

Response: 200 OK
[
  {
    "id": 1,
    "original_filename": "string",
    "file_type": "image/png",
    "file_size": 1024,
    "description": "string",
    "tags": "string",
    "created_at": "2024-01-01T00:00:00"
  }
]
```

#### Get File Preview
```http
GET /files/{file_id}/preview
Authorization: Bearer <token>

Response: 200 OK
{
  "url": "https://blob.vercel-storage.com/..."
}
```

#### Download File
```http
GET /files/{file_id}/download
Authorization: Bearer <token>

Response: 200 OK
Content-Type: <file-mime-type>
Content-Disposition: attachment; filename="..."
<file-binary-data>
```

#### Delete File
```http
DELETE /files/{file_id}
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "File deleted successfully"
}
```

### Error Responses

```http
401 Unauthorized
{
  "detail": "Not authenticated"
}

403 Forbidden
{
  "detail": "Access denied"
}

404 Not Found
{
  "detail": "File not found"
}

500 Internal Server Error
{
  "detail": "Internal server error"
}
```

---

## ⚙️ Configuration

### Frontend Environment Variables

Create `.env.local` in the root directory:

```env
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### Backend Environment Variables

Create `.env` in the `backend/` directory:

```env
# JWT Secret (REQUIRED - Change in production!)
JWT_SECRET=your-super-secret-key-minimum-32-characters-long

# Database URL (Optional - uses in-memory if not set)
DATABASE_URL=postgresql://user:password@host:5432/navbook

# Vercel Blob Token (Optional - for file storage)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx

# Server Configuration (Optional)
HOST=0.0.0.0
PORT=8000
```

### Getting Vercel Blob Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Blob**
3. Create a new Blob store or select existing
4. Copy the **Read-Write Token**
5. Add to backend `.env` file

### Database Setup (Optional)

For production with PostgreSQL:

1. Create a database on [Neon](https://neon.tech/) or your preferred provider
2. Run the schema migration:
   ```bash
   psql $DATABASE_URL < scripts/001-create-schema.sql
   ```
3. Update `DATABASE_URL` in backend `.env`
4. Use `app.py` instead of `app_simple.py`

---

## 💻 Development

### Running in Development Mode

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
python -m uvicorn app_simple:app --reload --port 8000
```

### Code Quality

```bash
# Frontend linting
npm run lint

# Frontend type checking
npm run type-check

# Backend linting (if configured)
cd backend
pylint app_simple.py
```

### Hot Reload

- **Frontend**: Next.js automatically reloads on file changes
- **Backend**: Uvicorn `--reload` flag enables auto-reload

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration with new credentials
- [ ] User login with existing credentials
- [ ] File upload (images, videos, documents)
- [ ] File preview in modal
- [ ] File download
- [ ] File deletion with confirmation
- [ ] Search by filename
- [ ] Search by tags
- [ ] Filter by file type
- [ ] Logout and session persistence
- [ ] Responsive design on mobile

### Test Users

For development, you can create test users via the registration page or API:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

---

## 🌐 Deployment

### Frontend Deployment (Vercel)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **"New Project"**
   - Import your GitHub repository
   - Configure:
     - Framework Preset: **Next.js**
     - Root Directory: `./`
     - Environment Variables: Add `NEXT_PUBLIC_API_URL`
   - Click **"Deploy"**

3. **Update API URL**:
   - After backend deployment, update `NEXT_PUBLIC_API_URL` in Vercel settings

### Backend Deployment (Railway)

1. **Create Railway Account**: [railway.app](https://railway.app/)

2. **Deploy Backend**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Initialize project
   cd backend
   railway init

   # Add environment variables
   railway variables set JWT_SECRET=your-secret-key
   railway variables set BLOB_READ_WRITE_TOKEN=your-token

   # Deploy
   railway up
   ```

3. **Get Backend URL**:
   - Copy the generated URL (e.g., `https://your-app.railway.app`)
   - Update frontend `NEXT_PUBLIC_API_URL` in Vercel

### Alternative: Docker Deployment

```dockerfile
# Dockerfile for backend
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["uvicorn", "app_simple:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
docker build -t navbook-backend ./backend
docker run -p 8000:8000 --env-file backend/.env navbook-backend
```

---

## 🔒 Security

### Best Practices Implemented

✅ **Authentication**:
- JWT tokens with expiration (24 hours default)
- Bcrypt password hashing with salt
- Bearer token authentication
- Secure session management

✅ **Authorization**:
- User-isolated file access
- Token validation on every request
- Protected API endpoints

✅ **Data Protection**:
- HTTPS in production (enforced by Vercel)
- CORS configuration
- Environment variable secrets
- No sensitive data in client code

✅ **Input Validation**:
- Pydantic models for request validation
- File size limits (100MB)
- File type validation
- SQL injection prevention (parameterized queries)

### Security Checklist for Production

- [ ] Change `JWT_SECRET` to a strong random value (32+ characters)
- [ ] Enable HTTPS for all connections
- [ ] Set strong database passwords
- [ ] Enable Vercel Blob access controls
- [ ] Set up regular database backups
- [ ] Configure rate limiting on API endpoints
- [ ] Enable CORS only for trusted domains
- [ ] Use environment variables for all secrets
- [ ] Implement file upload virus scanning (optional)
- [ ] Set up monitoring and alerting

---

## 🐛 Troubleshooting

### Common Issues

#### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

#### Backend connection refused
```bash
# Check if backend is running
curl http://localhost:8000

# Check Python virtual environment
which python  # Should point to venv

# Reinstall dependencies
pip install -r requirements.txt
```

#### "Not authenticated" errors
- Check if token is stored in localStorage
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS configuration
- Ensure JWT_SECRET matches between requests

#### File upload fails
- Check file size (max 100MB)
- Verify Vercel Blob token is set
- Check backend logs for errors
- Ensure Authorization header is sent

#### Database connection errors
- Verify `DATABASE_URL` format
- Check database is accessible
- Run schema migration script
- Use `app_simple.py` for testing without DB

### Debug Mode

**Frontend:**
```bash
# Enable verbose logging
NEXT_PUBLIC_DEBUG=true npm run dev
```

**Backend:**
```bash
# Enable debug logging
uvicorn app_simple:app --reload --log-level debug
```

### Getting Help

- Check [SETUP.md](SETUP.md) for detailed setup instructions
- Review [TEST_REPORT.md](TEST_REPORT.md) for feature status
- Open an issue on GitHub
- Check backend logs: `backend/logs/` (if configured)

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### Code Style

- **Frontend**: Follow ESLint rules, use Prettier
- **Backend**: Follow PEP 8, use Black formatter
- **TypeScript**: Strict mode enabled
- **Components**: Use functional components with hooks

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Navbook Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Vercel](https://vercel.com/) - Deployment and Blob storage
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives

---

## 📞 Support

- **Documentation**: [SETUP.md](SETUP.md) | [TEST_REPORT.md](TEST_REPORT.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/navbook-media/issues)
- **Discussions**: [GitHub Discussions](https://github.com/suraj-kummar/navbook-media/discussions)

---

<div align="center">

**Built with ❤️ by developers, for developers**

[⬆ Back to Top](#-navbook---private-media-vault)

</div>
