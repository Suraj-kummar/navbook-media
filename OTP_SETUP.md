# 🔐 OTP Authentication Setup Guide

## Overview

Navbook now supports **Email-based OTP (One-Time Password)** authentication with two modes:
1. **Registration with OTP verification**
2. **Passwordless login with OTP**

---

## Features

✅ **Email-based registration** with OTP verification
✅ **Passwordless login** - Login with just email + OTP (no password needed)
✅ **Traditional login** - Email + password authentication
✅ **OTP expiration** - OTPs expire after 10 minutes
✅ **Resend OTP** - Request a new OTP if expired
✅ **Secure** - OTPs are randomly generated 6-digit codes

---

## Quick Start

### 1. Start the OTP-enabled Backend

```bash
cd backend

# Stop the old backend if running
# Then start the new one:
python -m uvicorn app_with_otp:app --reload --port 8000
```

### 2. Access the OTP Login Page

Open your browser and go to:
```
http://localhost:3000/login-otp
```

---

## How to Use

### Registration Flow

1. Click **"Don't have an account? Register"**
2. Enter your:
   - Email address
   - Username
   - Password
3. Click **"Create Account"**
4. Check your **console/terminal** for the OTP (in development, it's printed there)
5. Enter the 6-digit OTP
6. Click **"Verify OTP"**
7. You're logged in! 🎉

### Login with Password

1. Enter your email and password
2. Click **"Login"**
3. Done!

### Passwordless Login (OTP only)

1. Click **"Login with OTP (Passwordless)"**
2. Enter your email
3. Check console/terminal for OTP
4. Enter the OTP
5. Click **"Verify OTP"**
6. Logged in without password! 🚀

---

## Development Mode

In development, OTPs are printed to the backend console:

```
==================================================
📧 OTP EMAIL SENT TO: user@example.com
🔐 YOUR OTP CODE: 123456
⏰ Valid for 10 minutes
==================================================
```

**Check your backend terminal to see the OTP!**

---

## Production Setup

### Email Integration

To send real emails in production, integrate with an email service:

#### Option 1: SendGrid (Recommended)

```bash
pip install sendgrid
```

Update `backend/app_with_otp.py`:

```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_otp_email(email: str, otp: str):
    message = Mail(
        from_email='noreply@navbook.com',
        to_emails=email,
        subject='Your Navbook OTP Code',
        html_content=f'''
            <h2>Your OTP Code</h2>
            <p>Your verification code is: <strong>{otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
        '''
    )
    sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    sg.send(message)
```

Add to `.env`:
```env
SENDGRID_API_KEY=your-sendgrid-api-key
```

#### Option 2: AWS SES

```bash
pip install boto3
```

```python
import boto3

def send_otp_email(email: str, otp: str):
    ses = boto3.client('ses', region_name='us-east-1')
    ses.send_email(
        Source='noreply@navbook.com',
        Destination={'ToAddresses': [email]},
        Message={
            'Subject': {'Data': 'Your Navbook OTP Code'},
            'Body': {
                'Html': {'Data': f'<p>Your OTP: <strong>{otp}</strong></p>'}
            }
        }
    )
```

#### Option 3: SMTP (Gmail, Outlook, etc.)

```bash
pip install python-email-validator
```

```python
import smtplib
from email.mime.text import MIMEText

def send_otp_email(email: str, otp: str):
    msg = MIMEText(f'Your OTP code is: {otp}')
    msg['Subject'] = 'Your Navbook OTP Code'
    msg['From'] = 'noreply@navbook.com'
    msg['To'] = email
    
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login('your-email@gmail.com', 'your-app-password')
        server.send_message(msg)
```

---

## API Endpoints

### Register with OTP
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepass123"
}

Response: 200 OK
{
  "message": "OTP sent to your email. Please verify to complete registration.",
  "email": "user@example.com",
  "requires_otp": true
}
```

### Verify OTP (Registration)
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Response: 200 OK
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": 1,
  "requires_otp": false
}
```

### Resend OTP
```http
POST /auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "message": "New OTP sent to your email"
}
```

### Login with Password
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123"
}

Response: 200 OK
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": 1,
  "requires_otp": false
}
```

### Request OTP for Passwordless Login
```http
POST /auth/login-with-otp
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "message": "OTP sent to your email",
  "requires_otp": true
}
```

### Verify OTP (Login)
```http
POST /auth/verify-login-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Response: 200 OK
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": 1,
  "requires_otp": false
}
```

---

## Security Features

✅ **OTP Expiration**: OTPs expire after 10 minutes
✅ **Random Generation**: 6-digit random OTPs
✅ **Email Verification**: Users must verify email before login
✅ **Rate Limiting**: Implement rate limiting in production
✅ **Secure Storage**: OTPs stored temporarily in memory

---

## Switching Between Versions

### Use OTP Version
```bash
cd backend
python -m uvicorn app_with_otp:app --reload --port 8000
```

Access at: `http://localhost:3000/login-otp`

### Use Simple Version (No OTP)
```bash
cd backend
python -m uvicorn app_simple:app --reload --port 8000
```

Access at: `http://localhost:3000/login`

---

## Troubleshooting

### OTP Not Showing
- Check backend terminal/console for printed OTP
- In production, check email spam folder
- Verify email service is configured correctly

### OTP Expired
- Click "Resend OTP" to get a new code
- OTPs are valid for 10 minutes only

### Email Not Verified
- Complete OTP verification after registration
- Check if OTP was entered correctly

---

## Next Steps

1. ✅ Test registration with OTP
2. ✅ Test passwordless login
3. ✅ Test OTP resend functionality
4. 🔄 Integrate real email service for production
5. 🔄 Add rate limiting to prevent abuse
6. 🔄 Add SMS OTP as alternative (optional)

---

## Production Checklist

- [ ] Configure email service (SendGrid/SES/SMTP)
- [ ] Set up proper email templates
- [ ] Add rate limiting (max 3 OTP requests per hour)
- [ ] Enable HTTPS
- [ ] Set strong JWT_SECRET
- [ ] Monitor OTP delivery success rate
- [ ] Add logging for security events
- [ ] Implement account lockout after failed attempts

---

Enjoy secure OTP authentication! 🔐✨
