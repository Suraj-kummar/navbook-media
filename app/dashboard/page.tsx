'use client';

import { useState, useCallback } from 'react';
import FileUploadArea from '@/components/file-upload-area';
import FileGrid from '@/components/file-grid';
import StorageStats from '@/components/storage-stats';
import BulkActionBar from '@/components/bulk-action-bar';
import { Input } from '@/components/ui/input';

type Tab = 'all' | 'favorites' | 'trash';
type FileFilter = 'all' | 'images' | 'videos' | 'documents';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<FileFilter>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectable, setSelectable] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const refresh = useCallback(() => setRefreshTrigger((n) => n + 1), []);

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleClearSelection = () => {
    setSelectedIds([]);
    setSelectable(false);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedIds([]);
    setSelectable(false);
    setSearchQuery('');
    setFileFilter('all');
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'all', label: 'All Files', icon: '📂' },
    { key: 'favorites', label: 'Starred', icon: '⭐' },
    { key: 'trash', label: 'Trash', icon: '🗑️' },
  ];

  const isTrashView = activeTab === 'trash';
  const isFavoritesView = activeTab === 'favorites';

  return (
    <div className="dashboard-root">
      {/* Page title */}
      <div className="dashboard-title-block">
        <h1 className="dashboard-title">Media Vault</h1>
        <p className="dashboard-subtitle">Your private, secure file storage</p>
      </div>

      {/* Storage Stats */}
      <StorageStats refreshTrigger={refreshTrigger} />

      {/* Upload (only on All Files tab) */}
      {!isTrashView && !isFavoritesView && (
        <FileUploadArea onFileUploaded={refresh} />
      )}

      {/* Tabs */}
      <div className="dashboard-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`dashboard-tab ${activeTab === tab.key ? 'dashboard-tab--active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}

        {/* Bulk-select toggle (only in All Files tab) */}
        {activeTab === 'all' && (
          <button
            className={`dashboard-tab dashboard-tab--select ${selectable ? 'dashboard-tab--active' : ''}`}
            onClick={() => {
              setSelectable((s) => !s);
              setSelectedIds([]);
            }}
            title="Toggle bulk select"
          >
            <span>☑️</span>
            <span>Select</span>
          </button>
        )}
      </div>

      {/* Search & Type Filter (hidden in trash) */}
      {!isTrashView && (
        <div className="dashboard-filters">
          <Input
            id="search-files"
            placeholder="Search by name, tags, description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dashboard-search"
          />
          <div className="filter-chips">
            {(['all', 'images', 'videos', 'documents'] as FileFilter[]).map((f) => (
              <button
                key={f}
                className={`filter-chip ${fileFilter === f ? 'filter-chip--active' : ''}`}
                onClick={() => setFileFilter(f)}
              >
                {f === 'all' ? '🗂 All' : f === 'images' ? '🖼️ Images' : f === 'videos' ? '🎬 Videos' : '📄 Docs'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
        onBulkDeleted={refresh}
      />

      {/* File Grid */}
      <FileGrid
        searchQuery={searchQuery}
        fileFilter={fileFilter}
        refreshTrigger={refreshTrigger}
        showTrash={isTrashView}
        favoritesOnly={isFavoritesView}
        selectable={selectable}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onRefresh={refresh}
      />
    </div>
  );
}
