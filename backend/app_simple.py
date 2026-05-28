import os
import uuid
import io
import zipfile
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import bcrypt
from dotenv import load_dotenv
from typing import Optional, List

try:
    from vercel_blob import put, delete as blob_delete
    VERCEL_BLOB_AVAILABLE = True
except ImportError:
    VERCEL_BLOB_AVAILABLE = False

load_dotenv()

# Environment variables
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
BLOB_READ_WRITE_TOKEN = os.getenv("BLOB_READ_WRITE_TOKEN")

app = FastAPI(title="Navbook API", version="2.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory storage ────────────────────────────────────────────────────────
users_db = {}   # {username: {id, password_hash, created_at}}
files_db = {}   # {file_id: {...metadata, is_favorite, is_deleted, share_token}}
user_id_counter = 1
file_id_counter = 1

# ─── Pydantic models ──────────────────────────────────────────────────────────
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
    is_favorite: bool = False
    is_deleted: bool = False
    share_token: Optional[str] = None

class BulkDeleteRequest(BaseModel):
    file_ids: List[int]

# ─── Auth helpers ─────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), hash.encode())

def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None):
    if expires_delta is None:
        expires_delta = timedelta(hours=24)
    expire = datetime.utcnow() + expires_delta
    payload = {"user_id": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(token: str) -> int:
    try:
        # Decode token. Handle standard Supabase audience if present, fallback if not
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        except jwt.InvalidTokenError:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        # Check if it is a Supabase JWT (contains 'sub' UUID and is not a legacy token)
        if "sub" in payload and "user_id" not in payload:
            supabase_id = payload["sub"]
            email = payload.get("email", "supabase_user")
            
            # Lookup or create this user in-memory
            # users_db is {username: {id, password_hash, created_at, supabase_id}}
            global user_id_counter
            for username, udata in users_db.items():
                if udata.get("supabase_id") == supabase_id:
                    return udata["id"]
            
            # Create a new local user in-memory
            user_id = user_id_counter
            user_id_counter += 1
            users_db[email] = {
                "id": user_id,
                "password_hash": "",
                "created_at": datetime.utcnow().isoformat(),
                "supabase_id": supabase_id
            }
            return user_id

        user_id = payload.get("user_id")
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

def get_user_file(file_id: int, user_id: int, allow_deleted: bool = False):
    """Fetch a file record, enforcing ownership. Raises 404/403 as needed."""
    file_data = files_db.get(file_id)
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
    if file_data["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if not allow_deleted and file_data.get("is_deleted"):
        raise HTTPException(status_code=404, detail="File not found")
    return file_data

def safe_delete_blob(file_data: dict):
    if file_data.get("blob_url") and BLOB_READ_WRITE_TOKEN and VERCEL_BLOB_AVAILABLE:
        try:
            blob_delete(file_data["blob_url"])
        except Exception as e:
            print(f"Blob delete error: {e}")

# ─── Root ─────────────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"message": "Navbook API", "status": "running", "version": "2.0.0"}

# ─── Auth routes ──────────────────────────────────────────────────────────────
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
    username = next(
        (uname for uname, udata in users_db.items() if udata["id"] == user_id),
        None
    )
    if not username:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user_id, "username": username}

@app.post("/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

# ─── File upload ──────────────────────────────────────────────────────────────
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

    if VERCEL_BLOB_AVAILABLE and BLOB_READ_WRITE_TOKEN and BLOB_READ_WRITE_TOKEN != "your-vercel-blob-token-here":
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
        "file_content": file_content,
        # ── New fields ──
        "is_favorite": False,
        "is_deleted": False,
        "deleted_at": None,
        "share_token": None,
    }

    return {
        "id": file_id,
        "filename": file.filename,
        "size": file_size,
        "message": "File uploaded successfully"
    }

# ─── File list ────────────────────────────────────────────────────────────────
@app.get("/files/list")
async def list_files(
    search: Optional[str] = None,
    file_type: Optional[str] = None,
    show_trash: bool = False,
    favorites_only: bool = False,
    user_id: int = Depends(get_current_user)
):
    user_files = [
        f for f in files_db.values()
        if f["user_id"] == user_id and f.get("is_deleted", False) == show_trash
    ]

    if favorites_only and not show_trash:
        user_files = [f for f in user_files if f.get("is_favorite")]

    if search:
        sl = search.lower()
        user_files = [
            f for f in user_files
            if sl in f["original_filename"].lower()
            or (f.get("description") and sl in f["description"].lower())
            or (f.get("tags") and sl in f["tags"].lower())
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
            "created_at": f["created_at"],
            "is_favorite": f.get("is_favorite", False),
            "is_deleted": f.get("is_deleted", False),
            "share_token": f.get("share_token"),
        }
        for f in user_files
    ]

# ─── Storage stats ────────────────────────────────────────────────────────────
@app.get("/files/stats")
async def get_stats(user_id: int = Depends(get_current_user)):
    user_files = [f for f in files_db.values() if f["user_id"] == user_id and not f.get("is_deleted")]
    total_size = sum(f["file_size"] for f in user_files)
    images = [f for f in user_files if f["file_type"].startswith("image/")]
    videos = [f for f in user_files if f["file_type"].startswith("video/")]
    documents = [f for f in user_files if not f["file_type"].startswith(("image/", "video/"))]
    trash = [f for f in files_db.values() if f["user_id"] == user_id and f.get("is_deleted")]
    favorites = [f for f in user_files if f.get("is_favorite")]

    return {
        "total_files": len(user_files),
        "total_size": total_size,
        "images_count": len(images),
        "images_size": sum(f["file_size"] for f in images),
        "videos_count": len(videos),
        "videos_size": sum(f["file_size"] for f in videos),
        "documents_count": len(documents),
        "documents_size": sum(f["file_size"] for f in documents),
        "trash_count": len(trash),
        "favorites_count": len(favorites),
        "storage_limit": 100 * 1024 * 1024 * 1024,  # 100 GB
    }

# ─── Preview ─────────────────────────────────────────────────────────────────
@app.get("/files/{file_id}/preview")
async def get_file_preview(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = get_user_file(file_id, user_id)
    if file_data.get("blob_url"):
        return {"url": file_data["blob_url"]}
    return {"url": f"data:{file_data['file_type']};base64,placeholder"}

# ─── Download ─────────────────────────────────────────────────────────────────
@app.get("/files/{file_id}/download")
async def download_file(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = get_user_file(file_id, user_id)
    return Response(
        content=file_data["file_content"],
        media_type=file_data["file_type"],
        headers={"Content-Disposition": f'attachment; filename="{file_data["original_filename"]}"'}
    )

# ─── Soft delete (move to trash) ──────────────────────────────────────────────
@app.delete("/files/{file_id}")
async def delete_file(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = get_user_file(file_id, user_id)
    file_data["is_deleted"] = True
    file_data["deleted_at"] = datetime.utcnow().isoformat()
    return {"message": "File moved to trash"}

# ─── Restore from trash ───────────────────────────────────────────────────────
@app.post("/files/{file_id}/restore")
async def restore_file(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = get_user_file(file_id, user_id, allow_deleted=True)
    if not file_data.get("is_deleted"):
        raise HTTPException(status_code=400, detail="File is not in trash")
    file_data["is_deleted"] = False
    file_data["deleted_at"] = None
    return {"message": "File restored successfully"}

# ─── Permanently purge from trash ─────────────────────────────────────────────
@app.delete("/files/{file_id}/purge")
async def purge_file(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = get_user_file(file_id, user_id, allow_deleted=True)
    safe_delete_blob(file_data)
    del files_db[file_id]
    return {"message": "File permanently deleted"}

# ─── Favorite toggle ──────────────────────────────────────────────────────────
@app.post("/files/{file_id}/favorite")
async def toggle_favorite(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = get_user_file(file_id, user_id)
    file_data["is_favorite"] = not file_data.get("is_favorite", False)
    return {"is_favorite": file_data["is_favorite"]}

# ─── Share link ───────────────────────────────────────────────────────────────
@app.post("/files/{file_id}/share")
async def create_share_link(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = get_user_file(file_id, user_id)
    if not file_data.get("share_token"):
        file_data["share_token"] = str(uuid.uuid4())
    return {"share_token": file_data["share_token"], "file_id": file_id}

@app.delete("/files/{file_id}/share")
async def revoke_share_link(file_id: int, user_id: int = Depends(get_current_user)):
    file_data = get_user_file(file_id, user_id)
    file_data["share_token"] = None
    return {"message": "Share link revoked"}

@app.get("/shared/{token}")
async def view_shared_file(token: str):
    """Public endpoint — no auth required."""
    file_data = next(
        (f for f in files_db.values() if f.get("share_token") == token and not f.get("is_deleted")),
        None
    )
    if not file_data:
        raise HTTPException(status_code=404, detail="Shared file not found or link revoked")
    return {
        "id": file_data["id"],
        "original_filename": file_data["original_filename"],
        "file_type": file_data["file_type"],
        "file_size": file_data["file_size"],
        "description": file_data.get("description"),
        "created_at": file_data["created_at"],
    }

@app.get("/shared/{token}/download")
async def download_shared_file(token: str):
    """Public download — no auth required."""
    file_data = next(
        (f for f in files_db.values() if f.get("share_token") == token and not f.get("is_deleted")),
        None
    )
    if not file_data:
        raise HTTPException(status_code=404, detail="Shared file not found or link revoked")
    return Response(
        content=file_data["file_content"],
        media_type=file_data["file_type"],
        headers={"Content-Disposition": f'attachment; filename="{file_data["original_filename"]}"'}
    )

# ─── Bulk delete (soft) ───────────────────────────────────────────────────────
@app.post("/files/bulk-delete")
async def bulk_delete(request: BulkDeleteRequest, user_id: int = Depends(get_current_user)):
    deleted = []
    errors = []
    for file_id in request.file_ids:
        try:
            file_data = get_user_file(file_id, user_id)
            file_data["is_deleted"] = True
            file_data["deleted_at"] = datetime.utcnow().isoformat()
            deleted.append(file_id)
        except HTTPException as e:
            errors.append({"file_id": file_id, "error": e.detail})
    return {"deleted": deleted, "errors": errors}

# ─── Bulk download as ZIP ─────────────────────────────────────────────────────
@app.post("/files/bulk-download")
async def bulk_download(request: BulkDeleteRequest, user_id: int = Depends(get_current_user)):
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_id in request.file_ids:
            try:
                file_data = get_user_file(file_id, user_id)
                zf.writestr(file_data["original_filename"], file_data["file_content"])
            except HTTPException:
                pass
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="navbook-files.zip"'}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
