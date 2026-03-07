'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileUploadAreaProps {
  onFileUploaded: () => void;
}

export default function FileUploadArea({ onFileUploaded }: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    if (!token) {
      setError('Not authenticated');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', description);
        formData.append('tags', tags);
        formData.append('token', token);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/files/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Upload failed');
        }
      }

      setSelectedFiles([]);
      setDescription('');
      setTags('');
      onFileUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Upload Files</h2>
        <p className="text-sm text-muted-foreground">
          Drag and drop files here or click to select
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="space-y-2">
          <p className="text-4xl">📁</p>
          <p className="font-medium text-foreground">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file(s) selected`
              : 'Drag files here or click to select'}
          </p>
          <p className="text-xs text-muted-foreground">
            Images, videos, and documents up to 100MB
          </p>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Selected Files:</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
              >
                <span className="truncate text-foreground">{file.name}</span>
                <span className="text-muted-foreground ml-2 whitespace-nowrap">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Fields */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
              Description (optional)
            </label>
            <Input
              id="description"
              placeholder="Add a description for these files"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-1">
              Tags (comma-separated, optional)
            </label>
            <Input
              id="tags"
              placeholder="e.g., vacation, family, important"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isUploading}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
        </Button>
      )}
    </div>
  );
}
