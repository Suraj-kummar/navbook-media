'use client';

import { useAuth } from '@/lib/auth-context';

interface BulkActionBarProps {
  selectedIds: number[];
  onClearSelection: () => void;
  onBulkDeleted: () => void;
}

export default function BulkActionBar({ selectedIds, onClearSelection, onBulkDeleted }: BulkActionBarProps) {
  const { token } = useAuth();
  const count = selectedIds.length;

  if (count === 0) return null;

  const handleBulkDelete = async () => {
    if (!confirm(`Move ${count} file${count > 1 ? 's' : ''} to trash?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ file_ids: selectedIds }),
      });
      if (res.ok) {
        onBulkDeleted();
        onClearSelection();
      }
    } catch (e) {
      alert('Bulk delete failed');
    }
  };

  const handleBulkDownload = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/bulk-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ file_ids: selectedIds }),
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'navbook-files.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert('Bulk download failed');
    }
  };

  return (
    <div className="bulk-action-bar">
      <div className="bulk-action-info">
        <span className="bulk-badge">{count}</span>
        <span className="bulk-label">
          file{count > 1 ? 's' : ''} selected
        </span>
      </div>
      <div className="bulk-actions">
        <button className="bulk-btn bulk-btn-download" onClick={handleBulkDownload}>
          <span>⬇️</span> Download ZIP
        </button>
        <button className="bulk-btn bulk-btn-delete" onClick={handleBulkDelete}>
          <span>🗑️</span> Move to Trash
        </button>
        <button className="bulk-btn bulk-btn-clear" onClick={onClearSelection}>
          ✕ Clear
        </button>
      </div>
    </div>
  );
}
