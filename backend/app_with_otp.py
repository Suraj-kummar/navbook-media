import os
import random
import string
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import jwt
import bcrypt
from dotenv import load_dotenv
from typing import Optional, List
from vercel_blob import put, delete as blob_delete

load_dotenv()

# Environment variables
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
BLOB_READ_WRITE_TOKEN = os.getenv("BLOB_READ_WRITE_TOKEN")

app = FastAPI(title="Navbook API with OTP")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
users_db = {}  # {email: {id, username, password_hash, verified}}
otp_storage = {}  # {email: {otp, expires_at}}
files_db = {}
user_id_counter = 1
file_id_counter = 1

# Pydantic models
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class OTPResendRequest(BaseModel):
    email: EmailStr

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    requires_otp: bool = False

class FileMetadata(BaseModel):
    id: int
    original_filename: str
    file_type: str
    file_size: int
    description: Optional[str] = None
    tags: Optional[str] = None
    created_at: str

# Helper functions
def generate_otp(length: int = 6) -> str:
    """Generate a random OTP"""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email: str, otp: str):
    """
    Send OTP via email (mock implementation)
    In production, integrate with SendGrid, AWS SES, or similar
    """
    print(f"\n{'='*50}")
    print(f"📧 OTP EMAIL SENT TO: {email}")
    print(f"🔐 YOUR OTP CODE: {otp}")
    print(f"⏰ Valid for 10 minutes")
    print(f"{'='*50}\n")
    # TODO: Implement actual email sending
    # Example with SendGrid:
    # from sendgrid import SendGridAPIClient
    # from sendgrid.helpers.mail import Mail
    # message = Mail(
    #     from_email='noreply@navbook.com',
    #     to_emails=email,
    #     subject='Your Navbook OTP Code',
    #     html_content=f'<strong>Your OTP is: {otp}</strong>'
    # )
    # sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    # sg.send(message)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), hash.encode())

def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None):
    if expires_delta is None:
        expires_delta = timedelta(hours=24)
    
    expire = datetime.utcnow() + expires_delta
    payload = {"user_id": user_id, "exp": expire}
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

def verify_token(token: str) -> int:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: Optional[str] = Header(None)) -> int:
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        return verify_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

# Routes
@app.get("/")
def read_root():
    return {"message": "Navbook API with OTP Authentication", "status": "running"}

@app.post("/auth/register")
async def register(request: RegisterRequest):
    global user_id_counter
    
    if request.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate OTP
    otp = generate_otp()
    otp_storage[request.email] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "username": request.username,
        "password_hash": hash_password(request.password)
    }
    
    # Send OTP via email (mock)
    send_otp_email(request.email, otp)
    
    return {
        "message": "OTP sent to your email. Please verify to complete registration.",
        "email": request.email,
        "requires_otp": True
    }

@app.post("/auth/verify-otp")
async def verify_otp(request: OTPVerifyRequest):
    global user_id_counter
    
    # Check if OTP exists
    if request.email not in otp_storage:
        raise HTTPException(status_code=400, detail="No OTP found. Please register first.")
    
    otp_data = otp_storage[request.email]
    
    # Check if OTP expired
    if datetime.utcnow() > otp_data["expires_at"]:
        del otp_storage[request.email]
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    
    # Verify OTP
    if request.otp != otp_data["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Create user account
    user_id = user_id_counter
    user_id_counter += 1
    
    users_db[request.email] = {
        "id": user_id,
        "username": otp_data["username"],
        "password_hash": otp_data["password_hash"],
        "verified": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Clean up OTP
    del otp_storage[request.email]
    
    # Generate token
    token = create_access_token(user_id)
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user_id=user_id,
        requires_otp=False
    )

@app.post("/auth/resend-otp")
async def resend_otp(request: OTPResendRequest):
    if request.email not in otp_storage:
        raise HTTPException(status_code=400, detail="No pending registration found")
    
    # Generate new OTP
    otp = generate_otp()
    otp_storage[request.email]["otp"] = otp
    otp_storage[request.email]["expires_at"] = datetime.utcnow() + timedelta(minutes=10)
    
    # Send OTP
    send_otp_email(request.email, otp)
    
    return {"message": "New OTP sent to your email"}

@app.post("/auth/login")
async def login(request: LoginRequest):
    user = users_db.get(request.email)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("verified", False):
        raise HTTPException(status_code=401, detail="Email not verified. Please verify your email first.")
    
    token = create_access_token(user["id"])
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user_id=user["id"],
        requires_otp=False
    )

@app.post("/auth/login-with-otp")
async def login_with_otp(request: OTPResendRequest):
    """Request OTP for passwordless login"""
    user = users_db.get(request.email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate OTP
    otp = generate_otp()
    otp_storage[request.email] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "login": True
    }
    
    send_otp_email(request.email, otp)
    
    return {"message": "OTP sent to your email", "requires_otp": True}

@app.post("/auth/verify-login-otp")
async def verify_login_otp(request: OTPVerifyRequest):
    """Verify OTP for passwordless login"""
    if request.email not in otp_storage:
        raise HTTPException(status_code=400, detail="No OTP found")
    
    otp_data = otp_storage[request.email]
    
    if datetime.utcnow() > otp_data["expires_at"]:
        del otp_storage[request.email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if request.otp != otp_data["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    user = users_db.get(request.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    del otp_storage[request.email]
    
    token = create_access_token(user["id"])
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user_id=user["id"],
        requires_otp=False
    )

@app.get("/auth/me")
async def get_current_user_info(user_id: int = Depends(get_current_user)):
    email = None
    username = None
    for user_email, user_data in users_db.items():
        if user_data["id"] == user_id:
            email = user_email
            username = user_data["username"]
            break
    
    if not email:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"user_id": user_id, "email": email, "username": username}

@app.post("/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

# File management endpoints (same as before)
@app.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    user_id: int = Depends(get_current_user)
):
    global file_id_counter
    
    file_content = await file.read()
    file_size = len(file_content)
    
    file_key = f"user_{user_id}/{file.filename}"
    blob_url = None
    
    if BLOB_READ_WRITE_TOKEN and BLOB_READ_WRITE_TOKEN != "your-vercel-blob-token-here":
        try:
            blob_response = put(file_key, file_content, {"access": "public"})
            blob_url = blob_response.get("url")
        except Exception as e:
            print(f"Blob upload error: {e}")
    
    file_id = file_id_counter
    file_id_counter += 1
    
    files_db[file_id] = {
        "id": file_id,
        "user_id": user_id,
        "original_filename": file.filename,
        "file_key": file_key,
        "blob_url": blob_url,
        "file_type": file.content_type or "application/octet-stream",
        "file_size": file_size,
        "description": description,
        "tags": tags,
        "created_at": datetime.utcnow().isoformat(),
        "file_content": file_content
    }
    
    return {
        "id": file_id,
        "filename": file.filename,
        "size": file_size,
        "message": "File uploaded successfully"
    }

@app.get("/files/list")
async def list_files(
    search: Optional[str] = None,
    file_type: Optional[str] = None,
    user_id: int = Depends(get_current_user)
):
    user_files = [f for f in files_db.values() if f["user_id"] == user_id]
    
    if search:
        search_lower = search.lower()
        user_files = [
            f for f in user_files
            if search_lower in f["original_filename"].lower()
            or (f.get("description") and search_lower in f["description"].lower())
            or (f.get("tags") and search_lower in f["tags"].lower())
        ]
    
    if file_type and file_type != "all":
        if file_type == "images":
            user_files = [f for f in user_files if f["file_type"].startswith("image/")]
        elif file_type == "videos":
            user_files = [f for f in user_files if f["file_type"].startswith("video/")]
        elif file_type == "documents":
            user_files = [f for f in user_files if not f["file_type"].startswith(("image/", "video/"))]
    
    return [
        {
            "id": f["id"],
            "original_filename": f["original_filename"],
            "file_type": f["file_type"],
            "file_size": f["file_size"],
            "description": f.get("description"),
            "tags": f.get("tags"),
            "created_at": f["created_at"]
        }
        for f in user_files
    ]

@app.get("/files/{file_id}/preview")
async def get_file_preview(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = files_db.get(file_id)
    
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file_data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if file_data.get("blob_url"):
        return {"url": file_data["blob_url"]}
    
    return {"url": f"data:{file_data['file_type']};base64,placeholder"}

@app.get("/files/{file_id}/download")
async def download_file(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = files_db.get(file_id)
    
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file_data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    from fastapi.responses import Response
    return Response(
        content=file_data["file_content"],
        media_type=file_data["file_type"],
        headers={
            "Content-Disposition": f'attachment; filename="{file_data["original_filename"]}"'
        }
    )

@app.delete("/files/{file_id}")
async def delete_file(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = files_db.get(file_id)
    
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file_data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if file_data.get("blob_url") and BLOB_READ_WRITE_TOKEN:
        try:
            blob_delete(file_data["blob_url"])
        except Exception as e:
            print(f"Blob delete error: {e}")
    
    del files_db[file_id]
    
    return {"message": "File deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
