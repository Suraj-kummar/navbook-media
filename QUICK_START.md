# Navbook - Quick Start Guide

## ✅ What's Running

1. **Frontend**: http://localhost:3000 (Next.js)
2. **Backend**: http://localhost:8000 (FastAPI)

## 🎉 How to Use

### Step 1: Register a New Account
1. Open http://localhost:3000 in your browser
2. You'll see the login page
3. Click "Don't have an account? Register"
4. Enter a username and password
5. Click "Create Account"

### Step 2: You're In!
After registration, you'll be automatically logged in and redirected to the dashboard.

### Step 3: Upload Files
- Drag and drop files onto the upload area
- Or click to select files
- Add optional description and tags
- Click "Upload Files"

### Step 4: Manage Your Files
- Search files by name, tags, or description
- Filter by type (All, Images, Videos, Documents)
- Click on files to preview
- Download or delete files

## 📝 Notes

- This version uses **in-memory storage** for testing (no database required)
- Files are stored in memory (will be lost when server restarts)
- To use persistent storage, configure:
  - Neon PostgreSQL database
  - Vercel Blob storage token

## 🔧 Current Configuration

- Frontend: `.env.local` configured
- Backend: `.env` configured with test values
- No database connection required for testing
- Blob storage optional (works without it)

## 🚀 Features Working

✅ User registration
✅ User login
✅ File upload
✅ File listing
✅ Search and filter
✅ File preview
✅ File deletion
✅ JWT authentication
✅ Password hashing

## 🛑 To Stop Servers

Frontend and backend are running in background processes. To stop them, use the Kiro process manager or close the terminals.

Enjoy your private media vault! 🎊
