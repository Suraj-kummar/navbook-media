import { Metadata } from 'next';
import Link from 'next/link';

interface SharedFileInfo {
  id: number;
  original_filename: string;
  file_type: string;
  file_size: number;
  description: string | null;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getFileEmoji(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎬';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📕';
  if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
  return '📄';
}

async function fetchSharedFile(token: string): Promise<SharedFileInfo | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
  try {
    const res = await fetch(`${apiUrl}/shared/${token}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const file = await fetchSharedFile(params.token);
  if (!file) {
    return {
      title: 'File Not Found – Navbook',
      description: 'This shared file could not be found or the link has expired.',
    };
  }
  return {
    title: `${file.original_filename} – Shared via Navbook`,
    description: file.description ?? `Download ${file.original_filename} (${formatBytes(file.file_size)}) shared via Navbook.`,
  };
}

export default async function SharedFilePage({
  params,
}: {
  params: { token: string };
}) {
  const file = await fetchSharedFile(params.token);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
  const downloadUrl = `${apiUrl}/shared/${params.token}/download`;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: '#06060f' }}>
      {/* Animated orb background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div style={{ position: 'absolute', width: 300, height: 300, background: '#ec4899', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.2, top: '40%', left: '50%', transform: 'translateX(-50%)' }} />
      </div>

      {/* Card */}
      <div className="login-card" style={{ maxWidth: 480, textAlign: 'center' }}>
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">N</div>
          <span className="login-logo-text">Navbook</span>
        </div>

        {file ? (
          <>
            {/* File Icon */}
            <div style={{ fontSize: '4rem', margin: '1.5rem 0 0.75rem', lineHeight: 1 }}>
              {getFileEmoji(file.file_type)}
            </div>

            {/* File name */}
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem', wordBreak: 'break-word', lineHeight: 1.3 }}>
              {file.original_filename}
            </h1>

            {/* Meta chips */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 9999, padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>
                {formatBytes(file.file_size)}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '0.2rem 0.7rem', fontSize: '0.75rem' }}>
                {file.file_type}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '0.2rem 0.7rem', fontSize: '0.75rem' }}>
                {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Description */}
            {file.description && (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.5rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                {file.description}
              </p>
            )}

            {/* Download button */}
            <a
              href={downloadUrl}
              download={file.original_filename}
              className="login-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', marginTop: '0.5rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download File
            </a>

            {/* Shared-by note */}
            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>
              🔗 Shared securely via Navbook
            </p>
          </>
        ) : (
          <>
            {/* Not found */}
            <div style={{ fontSize: '3.5rem', margin: '1.5rem 0 0.75rem' }}>🔒</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>
              File Not Found
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              This share link may have expired or been revoked by the owner.
            </p>
            <Link
              href="/login"
              className="login-btn"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            >
              Go to Navbook
            </Link>
          </>
        )}

        {/* Footer CTA */}
        <p className="login-footer" style={{ marginTop: '2rem' }}>
          <Link href="/login" style={{ color: 'rgba(165,180,252,0.5)', textDecoration: 'none' }}>
            Sign in to manage your own secure vault →
          </Link>
        </p>
      </div>
    </main>
  );
}
