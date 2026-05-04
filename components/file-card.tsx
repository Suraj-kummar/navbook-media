'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import MediaViewer from '@/components/media-viewer';

interface FileCardProps {
  file: {
    id: number;
    original_filename: string;
    file_type: string;
    file_size: number;
    description: string | null;
    tags: string | null;
    created_at: string;
    file_key?: string;
    is_favorite?: boolean;
    is_deleted?: boolean;
    share_token?: string | null;
  };
  onDelete: () => void;
  onUpdate?: () => void;
  // Bulk-select mode
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  // Trash view
  isTrashView?: boolean;
  onRestore?: () => void;
  onPurge?: () => void;
}

export default function FileCard({
  file,
  onDelete,
  onUpdate,
  selectable = false,
  selected = false,
  onToggleSelect,
  isTrashView = false,
  onRestore,
  onPurge,
}: FileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(file.is_favorite ?? false);
  const [shareToken, setShareToken] = useState<string | null>(file.share_token ?? null);
  const [shareCopied, setShareCopied] = useState(false);
  const { token } = useAuth();

  const isImage = file.file_type.startsWith('image/');
  const isVideo = file.file_type.startsWith('video/');

  useEffect(() => {
    setIsFavorite(file.is_favorite ?? false);
    setShareToken(file.share_token ?? null);
  }, [file.is_favorite, file.share_token]);

  // Load image preview
  useEffect(() => {
    if (isImage && token) {
      const load = async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/preview`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.ok) {
            const data = await res.json();
            setPreviewUrl(data.url);
          }
        } catch (_) {}
      };
      load();
    }
  }, [isImage, file.id, token]);

  // ── Favorite toggle ───────────────────────────────────────────────────────
  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/favorite`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.is_favorite);
        onUpdate?.();
      }
    } catch (_) {}
  };

  // ── Share link ────────────────────────────────────────────────────────────
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (shareToken) {
        // Already shared — copy link
        const link = `${window.location.origin}/shared/${shareToken}`;
        await navigator.clipboard.writeText(link);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
        return;
      }
      // Generate new share token
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/share`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setShareToken(data.share_token);
        const link = `${window.location.origin}/shared/${data.share_token}`;
        await navigator.clipboard.writeText(link);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (_) {}
  };

  // ── Soft delete ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm('Move this file to trash?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete file');
      setShowViewer(false);
      onDelete();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Restore ───────────────────────────────────────────────────────────────
  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/restore`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) onRestore?.();
    } catch (_) {}
  };

  // ── Permanent purge ───────────────────────────────────────────────────────
  const handlePurge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this file? This cannot be undone.')) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/purge`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) onPurge?.();
    } catch (_) {}
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to download');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString();

  return (
    <div
      className={`file-card ${selected ? 'file-card--selected' : ''} ${isTrashView ? 'file-card--trash' : ''}`}
      onClick={() => selectable && onToggleSelect?.(file.id)}
    >
      {/* Bulk-select checkbox */}
      {selectable && (
        <div
          className="file-card-checkbox"
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(file.id); }}
        >
          <input type="checkbox" checked={selected} readOnly />
        </div>
      )}

      {/* Favorite star (top-right) */}
      {!isTrashView && (
        <button
          className={`file-card-star ${isFavorite ? 'file-card-star--active' : ''}`}
          onClick={handleFavorite}
          title={isFavorite ? 'Unstar' : 'Star'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      )}

      {/* Preview area */}
      <div className="file-card-preview" onClick={(e) => { if (!selectable) { e.stopPropagation(); setShowViewer(true); } }}>
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={file.original_filename} className="file-card-img" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : isImage ? (
          <span className="file-card-emoji">🖼️</span>
        ) : isVideo ? (
          <span className="file-card-emoji">🎬</span>
        ) : (
          <span className="file-card-emoji">📄</span>
        )}
        {!selectable && (
          <div className="file-card-overlay">
            <span>Preview</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="file-card-body">
        <h3 className="file-card-title" title={file.original_filename}>
          {file.original_filename}
        </h3>

        {file.description && (
          <p className="file-card-desc">{file.description}</p>
        )}

        {file.tags && (
          <div className="file-card-tags">
            {file.tags.split(',').map((tag) => (
              <span key={tag.trim()} className="file-card-tag">{tag.trim()}</span>
            ))}
          </div>
        )}

        <div className="file-card-meta">
          <span>{formatFileSize(file.file_size)}</span>
          <span>{formatDate(file.created_at)}</span>
        </div>

        {/* Actions */}
        {isTrashView ? (
          <div className="file-card-actions">
            <button className="fc-btn fc-btn-restore" onClick={handleRestore}>↩ Restore</button>
            <button className="fc-btn fc-btn-purge" onClick={handlePurge}>🗑 Delete Forever</button>
          </div>
        ) : (
          <div className="file-card-actions">
            <button className="fc-btn fc-btn-view" onClick={(e) => { e.stopPropagation(); setShowViewer(true); }}>View</button>
            <button
              className={`fc-btn fc-btn-share ${shareToken ? 'fc-btn-share--active' : ''}`}
              onClick={handleShare}
              title={shareToken ? 'Copy share link' : 'Create share link'}
            >
              {shareCopied ? '✓ Copied!' : shareToken ? '🔗 Share' : '🔗 Share'}
            </button>
            <button className="fc-btn fc-btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(); }} disabled={isDeleting}>
              {isDeleting ? '...' : '🗑️'}
            </button>
          </div>
        )}
      </div>

      {/* Media Viewer */}
      {!isTrashView && (
        <MediaViewer
          file={{ ...file, file_key: file.file_key ?? '' }}
          isOpen={showViewer}
          onClose={() => setShowViewer(false)}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
