'use client';

import { useState, useEffect } from 'react';
import FileCard from '@/components/file-card';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

interface File {
  id: number;
  original_filename: string;
  file_type: string;
  file_size: number;
  description: string | null;
  tags: string | null;
  created_at: string;
  file_key: string;
}

interface FileGridProps {
  searchQuery: string;
  fileFilter: 'all' | 'images' | 'videos' | 'documents';
  refreshTrigger: number;
}

export default function FileGrid({
  searchQuery,
  fileFilter,
  refreshTrigger,
}: FileGridProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchFiles = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(
          `${apiUrl}/files/list?search=${encodeURIComponent(searchQuery)}&filter=${fileFilter}&token=${encodeURIComponent(token)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }

        const data = await response.json();
        setFiles(data.files || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load files');
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [searchQuery, fileFilter, refreshTrigger, token]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {searchQuery ? 'No files match your search.' : 'No files yet. Upload your first file above!'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {files.map((file) => (
        <FileCard key={file.id} file={file} onDelete={() => {}} />
      ))}
    </div>
  );
}
