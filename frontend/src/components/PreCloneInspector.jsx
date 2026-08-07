import React, { useState } from 'react';

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
      const res = await fetch('http://localhost:5000/api/scan/pre-clone-inspect', {
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
        </div>
      )}
    </div>
  );
}
