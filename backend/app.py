import os
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor
import httpx
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

# Environment variables
DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
BLOB_READ_WRITE_TOKEN = os.getenv("BLOB_READ_WRITE_TOKEN")

app = FastAPI(title="Navbook API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

# Vercel Blob API client
async def upload_to_blob(file_content: bytes, file_name: str) -> dict:
    """Upload file to Vercel Blob"""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {BLOB_READ_WRITE_TOKEN}"}
        files = {"file": (file_name, file_content)}
        response = await client.post(
            "https://blob.vercel-storage.com/upload",
            headers=headers,
            files=files,
        )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Blob upload failed")
        return response.json()

async def delete_from_blob(blob_url: str) -> bool:
    """Delete file from Vercel Blob"""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {BLOB_READ_WRITE_TOKEN}"}
        response = await client.delete(blob_url, headers=headers)
        return response.status_code == 200

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
    description: Optional[str]
    tags: Optional[str]
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

def get_current_user(token: str = None) -> int:
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    return verify_token(token)

# Auth endpoints
@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT id, password_hash FROM users WHERE username = %s", (request.username,))
        user = cur.fetchone()
        
        if not user or not verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        access_token = create_access_token(user["id"])
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user["id"]
        )
    finally:
        cur.close()
        conn.close()

@app.post("/auth/register", response_model=AuthResponse)
async def register(request: LoginRequest):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        password_hash = hash_password(request.password)
        
        cur.execute(
            "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
            (request.username, password_hash)
        )
        user_id = cur.fetchone()["id"]
        conn.commit()
        
        access_token = create_access_token(user_id)
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user_id
        )
    except psycopg2.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Username already exists")
    finally:
        cur.close()
        conn.close()

# File endpoints
@app.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    description: str = Form(""),
    tags: str = Form(""),
    token: str = Form(...)
):
    user_id = get_current_user(token)
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Validate file size (max 100MB)
    if file_size > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Generate unique file name for Blob
    unique_filename = f"{user_id}/{datetime.utcnow().timestamp()}_{file.filename}"
    
    # Upload to Vercel Blob
    try:
        blob_response = await upload_to_blob(content, unique_filename)
        blob_url = blob_response.get("url")
        if not blob_url:
            raise HTTPException(status_code=500, detail="Failed to get blob URL")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    # Save metadata to database
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """INSERT INTO files (user_id, original_filename, file_key, file_type, file_size, description, tags)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (user_id, file.filename, blob_url, file.content_type, file_size, description, tags)
        )
        file_id = cur.fetchone()[0]
        conn.commit()
        
        return {"file_id": file_id, "message": "File uploaded successfully"}
    finally:
        cur.close()
        conn.close()

@app.get("/files/list")
async def list_files(search: str = "", filter: str = "all", token: str = None):
    user_id = get_current_user(token)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Build query based on filter
        query = """SELECT id, original_filename, file_type, file_size, description, tags, created_at, file_key
                   FROM files WHERE user_id = %s"""
        params = [user_id]
        
        # Apply search filter
        if search:
            query += """ AND (original_filename ILIKE %s OR tags ILIKE %s OR description ILIKE %s)"""
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        # Apply file type filter
        if filter == "images":
            query += """ AND file_type LIKE %s"""
            params.append("image/%")
        elif filter == "videos":
            query += """ AND file_type LIKE %s"""
            params.append("video/%")
        elif filter == "documents":
            query += """ AND file_type NOT LIKE %s AND file_type NOT LIKE %s"""
            params.extend(["image/%", "video/%"])
        
        query += """ ORDER BY created_at DESC"""
        
        cur.execute(query, tuple(params))
        files = cur.fetchall()
        return {"files": files}
    finally:
        cur.close()
        conn.close()

@app.get("/files/{file_id}/download")
async def download_file(file_id: int, token: str):
    user_id = get_current_user(token)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute(
            "SELECT file_key, original_filename FROM files WHERE id = %s AND user_id = %s",
            (file_id, user_id)
        )
        file_record = cur.fetchone()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        # file_key is already the Blob URL, return it directly
        return {"download_url": file_record["file_key"]}
    finally:
        cur.close()
        conn.close()

@app.delete("/files/{file_id}")
async def delete_file(file_id: int, token: str):
    user_id = get_current_user(token)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute(
            "SELECT file_key FROM files WHERE id = %s AND user_id = %s",
            (file_id, user_id)
        )
        file_record = cur.fetchone()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Delete from Vercel Blob (file_key is the blob URL)
        try:
            await delete_from_blob(file_record["file_key"])
        except Exception as e:
            # Continue with database deletion even if blob deletion fails
            print(f"Warning: Failed to delete blob: {str(e)}")
        
        # Delete from database
        cur.execute("DELETE FROM files WHERE id = %s", (file_id,))
        conn.commit()
        
        return {"message": "File deleted successfully"}
    finally:
        cur.close()
        conn.close()

@app.get("/files/{file_id}/preview")
async def preview_file(file_id: int, token: str = None):
    user_id = get_current_user(token)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute(
            "SELECT file_key, file_type FROM files WHERE id = %s AND user_id = %s",
            (file_id, user_id)
        )
        file_record = cur.fetchone()
        
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        # file_key is already the Blob URL, return it directly for preview
        return {"preview_url": file_record["file_key"]}
    finally:
        cur.close()
        conn.close()

@app.get("/files/search")
async def search_files(q: str, token: str):
    user_id = get_current_user(token)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute(
            """SELECT id, original_filename, file_type, file_size, description, tags, created_at
               FROM files WHERE user_id = %s AND (original_filename ILIKE %s OR tags ILIKE %s OR description ILIKE %s)
               ORDER BY created_at DESC""",
            (user_id, f"%{q}%", f"%{q}%", f"%{q}%")
        )
        files = cur.fetchall()
        return {"files": files}
    finally:
        cur.close()
        conn.close()

@app.get("/auth/me")
async def get_current_user_info(token: str = None):
    try:
        user_id = get_current_user(token)
        return {"user_id": user_id}
    except:
        raise HTTPException(status_code=401, detail="Unauthorized")

@app.post("/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
