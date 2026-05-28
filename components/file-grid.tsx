'use client';

import { useState, useEffect } from 'react';
import FileCard from '@/components/file-card';
import { useAuth } from '@/lib/auth-context';

interface NavFile {
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
}

interface FileGridProps {
  searchQuery: string;
  fileFilter: 'all' | 'images' | 'videos' | 'documents';
  refreshTrigger: number;
  showTrash?: boolean;
  favoritesOnly?: boolean;
  // Bulk-select
  selectable?: boolean;
  selectedIds?: number[];
  onToggleSelect?: (id: number) => void;
  onRefresh: () => void;
}

export default function FileGrid({
  searchQuery,
  fileFilter,
  refreshTrigger,
  showTrash = false,
  favoritesOnly = false,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  onRefresh,
}: FileGridProps) {
  const [files, setFiles] = useState<NavFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const token = session?.access_token;

  useEffect(() => {
    const fetchFiles = async () => {
      if (!token) { setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          search: searchQuery,
          file_type: fileFilter,
          show_trash: String(showTrash),
          favorites_only: String(favoritesOnly),
        });
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/files/list?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error('Failed to fetch files');
        setFiles(await res.json() ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load files');
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [searchQuery, fileFilter, refreshTrigger, token, showTrash, favoritesOnly]);

  if (loading) {
    return (
      <div className="file-grid-loading">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="file-card-skeleton" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-grid-error">
        ⚠️ {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="file-grid-empty">
        <span className="file-grid-empty-icon">
          {showTrash ? '🗑️' : favoritesOnly ? '⭐' : '📂'}
        </span>
        <p>
          {showTrash
            ? 'Trash is empty'
            : favoritesOnly
            ? 'No starred files yet. Click ☆ on any file to star it!'
            : searchQuery
            ? 'No files match your search.'
            : 'No files yet. Upload your first file above!'}
        </p>
      </div>
    );
  }

  return (
    <div className="file-grid">
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          selectable={selectable}
          selected={selectedIds.includes(file.id)}
          onToggleSelect={onToggleSelect}
          isTrashView={showTrash}
          onDelete={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
          onUpdate={onRefresh}
          onRestore={() => { setFiles((prev) => prev.filter((f) => f.id !== file.id)); onRefresh(); }}
          onPurge={() => { setFiles((prev) => prev.filter((f) => f.id !== file.id)); onRefresh(); }}
        />
      ))}
    </div>
  );
}
