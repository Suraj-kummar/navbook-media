import os
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import bcrypt
from dotenv import load_dotenv
from typing import Optional, List
import io
from vercel_blob import put, delete as blob_delete

load_dotenv()

# Environment variables
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
BLOB_READ_WRITE_TOKEN = os.getenv("BLOB_READ_WRITE_TOKEN")

app = FastAPI(title="Navbook API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (for testing without database)
users_db = {}  # {username: {id, password_hash}}
files_db = {}  # {file_id: {user_id, filename, file_key, ...}}
user_id_counter = 1
file_id_counter = 1

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int

class FileMetadata(BaseModel):
    id: int
    original_filename: str
    file_type: str
    file_size: int
    description: Optional[str] = None
    tags: Optional[str] = None
    created_at: str

# Helper functions
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
    return {"message": "Navbook API", "status": "running"}

@app.post("/auth/register")
async def register(request: LoginRequest):
    global user_id_counter
    
    if request.username in users_db:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    password_hash = hash_password(request.password)
    user_id = user_id_counter
    user_id_counter += 1
    
    users_db[request.username] = {
        "id": user_id,
        "password_hash": password_hash,
        "created_at": datetime.utcnow().isoformat()
    }
    
    token = create_access_token(user_id)
    return AuthResponse(access_token=token, token_type="bearer", user_id=user_id)

@app.post("/auth/login")
async def login(request: LoginRequest):
    user = users_db.get(request.username)
    
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user["id"])
    return AuthResponse(access_token=token, token_type="bearer", user_id=user["id"])

@app.get("/auth/me")
async def get_current_user_info(user_id: int = Depends(get_current_user)):
    # Find username by user_id
    username = None
    for uname, udata in users_db.items():
        if udata["id"] == user_id:
            username = uname
            break
    
    if not username:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"user_id": user_id, "username": username}

@app.post("/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

@app.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    user_id: int = Depends(get_current_user)
):
    global file_id_counter
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Upload to Vercel Blob (if token is configured)
    file_key = f"user_{user_id}/{file.filename}"
    blob_url = None
    
    if BLOB_READ_WRITE_TOKEN and BLOB_READ_WRITE_TOKEN != "your-vercel-blob-token-here":
        try:
            blob_response = put(file_key, file_content, {"access": "public"})
            blob_url = blob_response.get("url")
        except Exception as e:
            print(f"Blob upload error: {e}")
            # Continue without blob storage for testing
    
    # Store file metadata
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
        "file_content": file_content  # Store in memory for testing
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
    # Filter files by user
    user_files = [f for f in files_db.values() if f["user_id"] == user_id]
    
    # Apply search filter
    if search:
        search_lower = search.lower()
        user_files = [
            f for f in user_files
            if search_lower in f["original_filename"].lower()
            or (f.get("description") and search_lower in f["description"].lower())
            or (f.get("tags") and search_lower in f["tags"].lower())
        ]
    
    # Apply file type filter
    if file_type and file_type != "all":
        if file_type == "images":
            user_files = [f for f in user_files if f["file_type"].startswith("image/")]
        elif file_type == "videos":
            user_files = [f for f in user_files if f["file_type"].startswith("video/")]
        elif file_type == "documents":
            user_files = [f for f in user_files if not f["file_type"].startswith(("image/", "video/"))]
    
    # Return file metadata (without content)
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
    
    # Return blob URL if available, otherwise generate data URL
    if file_data.get("blob_url"):
        return {"url": file_data["blob_url"]}
    
    # For testing without blob storage, return a placeholder
    return {"url": f"data:{file_data['file_type']};base64,placeholder"}

@app.get("/files/{file_id}/download")
async def download_file(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = files_db.get(file_id)
    
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file_data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Return the file content
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
    
    # Delete from blob storage if available
    if file_data.get("blob_url") and BLOB_READ_WRITE_TOKEN:
        try:
            blob_delete(file_data["blob_url"])
        except Exception as e:
            print(f"Blob delete error: {e}")
    
    # Delete from memory
    del files_db[file_id]
    
    return {"message": "File deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
