'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface EditFileDialogProps {
  file: {
    id: number;
    original_filename: string;
    description: string | null;
    tags: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditFileDialog({ file, isOpen, onClose, onSaved }: EditFileDialogProps) {
  const [filename, setFilename] = useState(file.original_filename);
  const [description, setDescription] = useState(file.description ?? '');
  const [tags, setTags] = useState(file.tags ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { session } = useAuth();
  const token = session?.access_token;

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename.trim()) { setError('Filename cannot be empty'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/${file.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: filename.trim(), description: description.trim() || null, tags: tags.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Failed to save');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-dialog-overlay" onClick={onClose}>
      <div className="edit-dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="edit-dialog-header">
          <h2 className="edit-dialog-title">Edit File</h2>
          <button className="edit-dialog-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSave} className="edit-dialog-form">
          <div className="edit-dialog-field">
            <label htmlFor="edit-filename">File Name</label>
            <input
              id="edit-filename"
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="edit-dialog-input"
              placeholder="filename.ext"
              disabled={saving}
            />
          </div>

          <div className="edit-dialog-field">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="edit-dialog-input edit-dialog-textarea"
              placeholder="Add a description…"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="edit-dialog-field">
            <label htmlFor="edit-tags">Tags <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(comma-separated)</span></label>
            <input
              id="edit-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="edit-dialog-input"
              placeholder="travel, nature, work…"
              disabled={saving}
            />
          </div>

          {error && <div className="edit-dialog-error">{error}</div>}

          <div className="edit-dialog-actions">
            <button type="button" className="edit-dialog-btn edit-dialog-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="edit-dialog-btn edit-dialog-btn-save" disabled={saving}>
              {saving ? 'Saving…' : '✓ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
