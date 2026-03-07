'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import MediaViewer from '@/components/media-viewer';
import { Button } from '@/components/ui/button';

interface FileCardProps {
  file: {
    id: number;
    original_filename: string;
    file_type: string;
    file_size: number;
    description: string | null;
    tags: string | null;
    created_at: string;
    file_key: string;
  };
  onDelete: () => void;
}

export default function FileCard({ file, onDelete }: FileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const { token } = useAuth();

  const isImage = file.file_type.startsWith('image/');
  const isVideo = file.file_type.startsWith('video/');

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/files/${file.id}?token=${encodeURIComponent(token || '')}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      setShowViewer(false);
      onDelete();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/files/${file.id}/download?token=${encodeURIComponent(token || '')}`);

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition flex flex-col h-full">
      {/* Preview Area */}
      <div className="h-40 bg-muted flex items-center justify-center overflow-hidden cursor-pointer relative group">
        {isImage ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}/preview?token=${encodeURIComponent(token || '')}`}
            alt={file.original_filename}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : isVideo ? (
          <div className="text-center">
            <span className="text-4xl">🎬</span>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-4xl">📄</span>
          </div>
        )}
        <button
          onClick={() => setShowViewer(true)}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <span className="text-white text-sm font-medium">Preview</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm text-foreground truncate mb-1">
          {file.original_filename}
        </h3>

        {file.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {file.description}
          </p>
        )}

        {file.tags && (
          <div className="flex flex-wrap gap-1 mb-3">
            {file.tags.split(',').map((tag) => (
              <span
                key={tag.trim()}
                className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 mt-auto mb-3">
          <p>{formatFileSize(file.file_size)}</p>
          <p>{formatDate(file.created_at)}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowViewer(true)}
            className="flex-1"
          >
            View
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Media Viewer Modal */}
      <MediaViewer
        file={file}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </div>
  );
}
