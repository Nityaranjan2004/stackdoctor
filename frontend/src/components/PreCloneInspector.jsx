import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

export default function PreCloneInspector({ onSelectProject }) {
  const [repoUrl, setRepoUrl] = useState('https://github.com/ppl8763/leafdieases_detection_bakcend');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePreScan = async (e) => {
    if (e) e.preventDefault();
    if (!repoUrl.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/scan/pre-clone-inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Pre-scan failed');
      }
    } catch (err) {
      setError('Could not connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const [activeFile, setActiveFile] = useState(null);

  const previewFiles = result?.filePreviews ? Object.keys(result.filePreviews) : [];

  return (
    <div className="glass-card animate-slideup" style={{ marginBottom: '2rem', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7), rgba(30, 41, 59, 0.6))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div>
          <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>⚡</span> Pre-Clone AI Instant Repository Inspector
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
            Inspect any remote GitHub repository tech stack, manifest files, and requirements in <strong>&lt; 0.5s</strong> without downloading code to your hard drive.
          </p>
        </div>
        <span style={{ fontSize: '0.72rem', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', padding: '0.25rem 0.75rem', borderRadius: '15px', border: '1px solid rgba(139, 92, 246, 0.3)', fontWeight: 600 }}>
          Zero Disk Usage Engine
        </span>
      </div>

      <form onSubmit={handlePreScan} style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: result ? '1.2rem' : '0' }}>
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="Paste GitHub Repository URL (e.g. https://github.com/ppl8763/leafdieases_detection_bakcend)"
          style={{
            flex: 1,
            minWidth: '280px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-glass)',
            borderRadius: '6px',
            padding: '0.7rem 1rem',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            border: 'none',
            borderRadius: '6px',
            padding: '0.7rem 1.4rem',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? '⚡ Inspecting Remote Tree...' : '⚡ Run Pre-Clone AI Analysis'}
        </button>
      </form>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.82rem', marginTop: '0.8rem' }}>
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '8px', padding: '1.2rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.8rem' }}>
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                📁 Repository: <strong style={{ color: '#38bdf8' }}>{result.owner}/{result.repo || 'Project'}</strong>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.8rem' }}>
                Branch: {result.activeBranch} | Files: {result.totalFiles}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.3)', fontWeight: 600 }}>
              ⏱️ Inspected in {result.scanTimeMs}ms
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.7rem 0.9rem', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>📄 Primary Entry File:</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#facc15', fontFamily: 'monospace' }}>
                {result.entryPoint}
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.7rem 0.9rem', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>📦 Manifests Found:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c084fc', fontFamily: 'monospace' }}>
                {result.manifestsFound?.join(', ') || 'requirements.txt'}
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.7rem 0.9rem', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>🚀 Auto-Launch Command:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399', fontFamily: 'monospace' }}>
                {result.runCommand}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginRight: '0.3rem' }}>Detected Stacks:</span>
            {result.stacks.map((st, i) => (
              <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.65rem', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 600 }}>
                {st}
              </span>
            ))}
          </div>

          {/* Interactive File Inspector Section */}
          {previewFiles.length > 0 && (
            <div style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border-glass)', paddingTop: '0.8rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🔍 Remote File Viewer (View Content Without Cloning):
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                {previewFiles.map(filePath => {
                  const isSelected = activeFile === filePath;
                  return (
                    <button
                      key={filePath}
                      onClick={() => setActiveFile(isSelected ? null : filePath)}
                      style={{
                        padding: '0.35rem 0.8rem',
                        fontSize: '0.78rem',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        borderRadius: '5px',
                        cursor: 'pointer',
                        background: isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
                        color: isSelected ? '#fff' : '#cbd5e1',
                        border: isSelected ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.12)'
                      }}
                    >
                      📄 {filePath} {isSelected ? '▲ Hide' : '▼ View'}
                    </button>
                  );
                })}
              </div>

              {activeFile && result.filePreviews[activeFile] && (
                <div style={{ background: '#090d16', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '6px', padding: '0.8rem 1rem', overflowX: 'auto', maxHeight: '280px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700, marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.3rem' }}>
                    Content of {activeFile}:
                  </div>
                  <pre style={{ margin: 0, fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                    {result.filePreviews[activeFile]}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
