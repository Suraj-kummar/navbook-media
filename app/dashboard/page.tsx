'use client';

import { useState } from 'react';
import FileUploadArea from '@/components/file-upload-area';
import FileGrid from '@/components/file-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<'all' | 'images' | 'videos' | 'documents'>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFileUploaded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Media Vault</h1>
        <p className="text-muted-foreground">Securely store and manage your private media files</p>
      </div>

      {/* Upload Area */}
      <FileUploadArea onFileUploaded={handleFileUploaded} />

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search files by name, tags, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            {(['all', 'images', 'videos', 'documents'] as const).map((filter) => (
              <Button
                key={filter}
                variant={fileFilter === filter ? 'default' : 'outline'}
                onClick={() => setFileFilter(filter)}
                className="capitalize"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* File Grid */}
      <FileGrid
        searchQuery={searchQuery}
        fileFilter={fileFilter}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
