'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

interface MediaViewerProps {
  file: {
    id: number;
    original_filename: string;
    file_type: string;
    file_key: string;
    description: string | null;
    tags: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export default function MediaViewer({
  file,
  isOpen,
  onClose,
  onDownload,
  onDelete,
}: MediaViewerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (isOpen && token) {
      const fetchPreview = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const response = await fetch(
            `${apiUrl}/files/${file.id}/download`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
          }
        } catch (err) {
          console.error('Failed to load preview:', err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPreview();
    }

    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, file.id, token]);

  if (!isOpen) return null;

  const isImage = file.file_type.startsWith('image/');
  const isVideo = file.file_type.startsWith('video/');
  const isPdf = file.file_type === 'application/pdf';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-96 overflow-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <div className="flex-1">
            <h2 className="font-semibold text-foreground truncate">{file.original_filename}</h2>
            {file.description && (
              <p className="text-xs text-muted-foreground mt-1">{file.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-2 text-muted-foreground hover:text-foreground transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex items-center justify-center bg-muted min-h-64">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading preview...</p>
            </div>
          ) : isImage && previewUrl ? (
            <img src={previewUrl} alt={file.original_filename} className="max-w-full max-h-96 object-contain" />
          ) : isVideo && previewUrl ? (
            <video src={previewUrl} controls className="max-w-full max-h-96" />
          ) : isPdf && previewUrl ? (
            <iframe src={previewUrl} className="w-full h-96" />
          ) : (
            <div className="text-center">
              <p className="text-4xl mb-2">📄</p>
              <p className="text-muted-foreground">{file.file_type}</p>
              <p className="text-xs text-muted-foreground mt-2">Preview not available</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {file.tags && (
          <div className="px-6 py-3 border-t border-border bg-muted/50">
            <div className="flex flex-wrap gap-2">
              {file.tags.split(',').map((tag) => (
                <span
                  key={tag.trim()}
                  className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-border sticky bottom-0 bg-card">
          <Button variant="outline" onClick={onDownload} className="flex-1">
            Download
          </Button>
          <Button variant="destructive" onClick={onDelete} className="flex-1">
            Delete
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
