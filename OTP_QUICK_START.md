# 🚀 Quick Start - OTP Authentication

## ✅ What's New

Your Navbook app now supports **Email + OTP Authentication**!

### Features Added:
- ✅ Email-based registration with OTP verification
- ✅ Passwordless login (login with just email + OTP)
- ✅ Traditional email + password login
- ✅ OTP resend functionality
- ✅ 10-minute OTP expiration

---

## 🎯 How to Use

### Step 1: Servers are Running

Both servers are already running:
- **Backend (OTP)**: http://localhost:8000
- **Frontend**: http://localhost:3000

### Step 2: Access the OTP Login Page

Open your browser and go to:
```
http://localhost:3000/login-otp
```

### Step 3: Register a New Account

1. Click **"Don't have an account? Register"**
2. Fill in:
   - **Email**: your@email.com
   - **Username**: yourname
   - **Password**: yourpassword
3. Click **"Create Account"**
4. **Check your backend terminal** - you'll see:
   ```
   ==================================================
   📧 OTP EMAIL SENT TO: your@email.com
   🔐 YOUR OTP CODE: 123456
   ⏰ Valid for 10 minutes
   ==================================================
   ```
5. Enter the 6-digit OTP code
6. Click **"Verify OTP"**
7. You're in! 🎉

---

## 🔑 Login Options

### Option 1: Login with Password
1. Enter your email and password
2. Click "Login"
3. Done!

### Option 2: Passwordless Login (OTP Only)
1. Click **"Login with OTP (Passwordless)"**
2. Enter your email
3. Check backend terminal for OTP
4. Enter OTP
5. Click "Verify OTP"
6. Logged in! 🚀

---

## 📝 Important Notes

### Development Mode
- OTPs are **printed in the backend terminal/console**
- Look for the box with 📧 emoji
- OTPs expire after 10 minutes
- You can click "Resend OTP" to get a new one

### Production Mode
- You need to configure an email service (SendGrid, AWS SES, or SMTP)
- See `OTP_SETUP.md` for detailed email integration guide

---

## 🔄 Switching Between Versions

### Current (OTP Version)
```bash
# Backend
cd backend
python -m uvicorn app_with_otp:app --reload --port 8000

# Frontend
http://localhost:3000/login-otp
```

### Old Version (No OTP)
```bash
# Backend
cd backend
python -m uvicorn app_simple:app --reload --port 8000

# Frontend
http://localhost:3000/login
```

---

## 🎨 Try It Now!

1. Open: **http://localhost:3000/login-otp**
2. Register with your email
3. Check backend terminal for OTP
4. Verify and start uploading files!

---

## 📚 More Information

- Full setup guide: `OTP_SETUP.md`
- API documentation: See OTP_SETUP.md
- Email integration: See OTP_SETUP.md

Enjoy your secure OTP authentication! 🔐✨
