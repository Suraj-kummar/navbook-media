'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Stats {
  total_files: number;
  total_size: number;
  images_count: number;
  images_size: number;
  videos_count: number;
  videos_size: number;
  documents_count: number;
  documents_size: number;
  trash_count: number;
  favorites_count: number;
  storage_limit: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

interface StatCardProps {
  label: string;
  count: number;
  size: number;
  color: string;
  icon: string;
  pct: number;
}

function StatCard({ label, count, size, color, icon, pct }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-count">{count}</div>
      <div className="stat-size">{formatBytes(size)}</div>
      <div className="stat-bar-track">
        <div
          className="stat-bar-fill"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

interface StorageStatsProps {
  refreshTrigger: number;
}

export default function StorageStats({ refreshTrigger }: StorageStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const token = session?.access_token;

  useEffect(() => {
    if (!token) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setStats(await res.json());
      } catch (_) {}
      setLoading(false);
    };
    fetchStats();
  }, [token, refreshTrigger]);

  if (loading || !stats) {
    return (
      <div className="stats-skeleton">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </div>
    );
  }

  const usedPct = stats.storage_limit > 0
    ? (stats.total_size / stats.storage_limit) * 100
    : 0;

  const maxSize = Math.max(stats.images_size, stats.videos_size, stats.documents_size, 1);

  return (
    <div className="storage-stats-root">
      {/* Top overview bar */}
      <div className="stats-overview">
        <div className="stats-overview-left">
          <span className="stats-total-files">{stats.total_files}</span>
          <span className="stats-total-label">total files</span>
        </div>
        <div className="stats-overview-center">
          <div className="storage-bar-wrap">
            <div className="storage-bar-track">
              <div
                className="storage-bar-fill"
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>
            <span className="storage-bar-text">
              {formatBytes(stats.total_size)} / {formatBytes(stats.storage_limit)} used
            </span>
          </div>
        </div>
        <div className="stats-overview-right">
          <span className="stats-badge stats-badge-star">⭐ {stats.favorites_count} starred</span>
          <span className="stats-badge stats-badge-trash">🗑️ {stats.trash_count} in trash</span>
        </div>
      </div>

      {/* Per-type cards */}
      <div className="stat-cards-row">
        <StatCard
          label="Images"
          count={stats.images_count}
          size={stats.images_size}
          color="linear-gradient(90deg,#6366f1,#8b5cf6)"
          icon="🖼️"
          pct={(stats.images_size / maxSize) * 100}
        />
        <StatCard
          label="Videos"
          count={stats.videos_count}
          size={stats.videos_size}
          color="linear-gradient(90deg,#ec4899,#f43f5e)"
          icon="🎬"
          pct={(stats.videos_size / maxSize) * 100}
        />
        <StatCard
          label="Documents"
          count={stats.documents_count}
          size={stats.documents_size}
          color="linear-gradient(90deg,#10b981,#06b6d4)"
          icon="📄"
          pct={(stats.documents_size / maxSize) * 100}
        />
        <div className="stat-card stat-card-total">
          <div className="stat-card-header">
            <span className="stat-icon">💾</span>
            <span className="stat-label">Storage</span>
          </div>
          <div className="stat-count">{usedPct.toFixed(1)}%</div>
          <div className="stat-size">{formatBytes(stats.total_size)}</div>
          <div className="stat-bar-track">
            <div
              className="stat-bar-fill"
              style={{
                width: `${Math.min(usedPct, 100)}%`,
                background: usedPct > 80
                  ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
                  : 'linear-gradient(90deg,#3b82f6,#6366f1)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
