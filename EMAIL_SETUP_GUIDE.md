# 📧 Email Setup Guide - Send Real OTPs

## Why OTPs Aren't in Your Email

Currently, the system is in **development mode** and OTPs are only printed to the console. To send real emails, you need to configure an email service.

---

## 🚀 Quick Setup with Gmail (Recommended)

### Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left menu
3. Enable **2-Step Verification** (if not already enabled)
4. Search for **"App passwords"** or go to: https://myaccount.google.com/apppasswords
5. Click **"Select app"** → Choose **"Mail"**
6. Click **"Select device"** → Choose **"Other"** → Type **"Navbook"**
7. Click **"Generate"**
8. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

### Step 2: Update Backend .env File

Open `backend/.env` and add:

```env
# Email Configuration (Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
FROM_EMAIL=your-email@gmail.com
```

**Replace:**
- `your-email@gmail.com` with your actual Gmail address
- `abcd efgh ijkl mnop` with the app password you generated

### Step 3: Restart Backend with Email Support

```bash
cd backend
python -m uvicorn app_with_email:app --reload --port 8000
```

### Step 4: Test It!

1. Go to http://localhost:3000/test-otp
2. Register with your real email
3. **Check your email inbox** for the OTP!
4. Enter the OTP and verify

---

## 📱 Alternative: Other Email Services

### Option 2: Outlook/Hotmail

```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your-email@outlook.com
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@outlook.com
```

### Option 3: Yahoo Mail

```env
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USERNAME=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@yahoo.com
```

### Option 4: Custom SMTP Server

```env
SMTP_SERVER=smtp.your-domain.com
SMTP_PORT=587
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
FROM_EMAIL=noreply@your-domain.com
```

---

## 🔧 Troubleshooting

### "Authentication failed" Error

**Gmail:**
- Make sure you're using an **App Password**, not your regular Gmail password
- Enable 2-Step Verification first
- Check that you copied the app password correctly (remove spaces)

**Other providers:**
- Check if "Less secure app access" needs to be enabled
- Verify SMTP server and port are correct

### Email Not Received

1. **Check spam folder** - OTP emails might be filtered
2. **Wait a few minutes** - Email delivery can be delayed
3. **Check backend console** - OTP is still printed there for debugging
4. **Verify email address** - Make sure you entered it correctly

### "Connection refused" Error

- Check your internet connection
- Verify SMTP_SERVER and SMTP_PORT are correct
- Some networks block SMTP ports - try a different network

---

## 🎨 Email Template

The OTP email looks like this:

```
Subject: Your Navbook OTP Code

🔐 Navbook
Your Verification Code

Your OTP code is:
  123456

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Navbook - Secure Private Media Vault
```

---

## 🔒 Security Notes

### Gmail App Passwords
- ✅ More secure than using your main password
- ✅ Can be revoked anytime
- ✅ Limited to specific app access
- ✅ Doesn't give access to your full account

### Best Practices
- Never commit `.env` file to Git
- Use different app passwords for different apps
- Revoke app passwords you're not using
- Monitor your Google Account activity

---

## 📊 Current Status Check

Visit http://localhost:8000 to see email configuration status:

```json
{
  "message": "Navbook API with Email OTP",
  "status": "running",
  "email_service": "✅ Configured"  // or "❌ Not configured"
}
```

---

## 🚀 Quick Commands

### Start with Email Support
```bash
cd backend
python -m uvicorn app_with_email:app --reload --port 8000
```

### Start without Email (Console Only)
```bash
cd backend
python -m uvicorn app_with_otp:app --reload --port 8000
```

---

## ✅ Verification Checklist

- [ ] Gmail 2-Step Verification enabled
- [ ] App Password generated
- [ ] `.env` file updated with credentials
- [ ] Backend restarted with `app_with_email.py`
- [ ] Test registration completed
- [ ] OTP received in email inbox
- [ ] OTP verified successfully

---

## 💡 Pro Tips

1. **Use a dedicated email** for sending OTPs (like `noreply@yourdomain.com`)
2. **Monitor email delivery** - Check Gmail's sent folder
3. **Test with multiple emails** - Make sure it works for different providers
4. **Set up email templates** - Customize the HTML in `app_with_email.py`
5. **Add rate limiting** - Prevent OTP spam (max 3 per hour per email)

---

## 🎯 Next Steps

Once email is working:
1. ✅ Test registration with real email
2. ✅ Test passwordless login
3. ✅ Test OTP resend
4. 🔄 Deploy to production
5. 🔄 Set up monitoring for email delivery
6. 🔄 Add email analytics

---

Need help? Check the backend console for detailed error messages!
