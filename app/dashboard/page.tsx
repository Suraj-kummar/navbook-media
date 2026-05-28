'use client';

import { useState, useCallback } from 'react';
import FileUploadArea from '@/components/file-upload-area';
import FileGrid from '@/components/file-grid';
import StorageStats from '@/components/storage-stats';
import BulkActionBar from '@/components/bulk-action-bar';
import { Input } from '@/components/ui/input';

type Tab = 'all' | 'favorites' | 'trash';
type FileFilter = 'all' | 'images' | 'videos' | 'documents';

const TAB_CONFIG = [
  { key: 'all' as Tab, label: 'All Files', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )},
  { key: 'favorites' as Tab, label: 'Starred', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )},
  { key: 'trash' as Tab, label: 'Trash', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )},
];

const FILTER_CONFIG: { key: FileFilter; label: string }[] = [
  { key: 'all', label: '🗂 All' },
  { key: 'images', label: '🖼️ Images' },
  { key: 'videos', label: '🎬 Videos' },
  { key: 'documents', label: '📄 Docs' },
];

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

  const handleClearSelection = () => { setSelectedIds([]); setSelectable(false); };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab); setSelectedIds([]); setSelectable(false);
    setSearchQuery(''); setFileFilter('all');
  };

  const isTrashView = activeTab === 'trash';
  const isFavoritesView = activeTab === 'favorites';

  return (
    <div className="dashboard-root">
      {/* Page Header */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-left">
          <h1 className="dashboard-title">Media Vault</h1>
          <p className="dashboard-subtitle">Your private, encrypted file storage</p>
        </div>
        <div className="dashboard-hero-right">
          <div className="dashboard-hero-glow" />
        </div>
      </div>

      {/* Storage Stats */}
      <StorageStats refreshTrigger={refreshTrigger} />

      {/* Upload */}
      {!isTrashView && !isFavoritesView && (
        <FileUploadArea onFileUploaded={refresh} />
      )}

      {/* Tabs + Select toggle */}
      <div className="dashboard-tabs-row">
        <div className="dashboard-tabs">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              className={`dashboard-tab ${activeTab === tab.key ? 'dashboard-tab--active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'all' && (
          <button
            className={`dashboard-select-btn ${selectable ? 'dashboard-select-btn--active' : ''}`}
            onClick={() => { setSelectable((s) => !s); setSelectedIds([]); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            {selectable ? 'Cancel' : 'Select'}
          </button>
        )}
      </div>

      {/* Search & Filter */}
      {!isTrashView && (
        <div className="dashboard-filters">
          <div className="dashboard-search-wrap">
            <svg className="dashboard-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <Input
              id="search-files"
              placeholder="Search by name, tags, description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dashboard-search"
            />
          </div>
          <div className="filter-chips">
            {FILTER_CONFIG.map((f) => (
              <button
                key={f.key}
                className={`filter-chip ${fileFilter === f.key ? 'filter-chip--active' : ''}`}
                onClick={() => setFileFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
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
