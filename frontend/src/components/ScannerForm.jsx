import React, { useState, useEffect } from 'react';

export default function ScannerForm({ onScanStart, isScanning, selectedProject }) {
  const [name, setName] = useState('StackDoctor');
  const [path, setPath] = useState('f:/DEVELOPEMENT/FINAL PROJECT/stackdoctor');

  // Update input fields whenever a project is selected from the sidebar
  useEffect(() => {
    if (selectedProject) {
      if (selectedProject.name) setName(selectedProject.name);
      if (selectedProject.path) setPath(selectedProject.path);
    }
  }, [selectedProject]);

  const handlePathChange = (newPath) => {
    let cleanedPath = newPath.trim();
    // If multiple URLs were accidentally pasted together (e.g. url1https://url2), extract the last URL
    if ((cleanedPath.match(/https?:\/\//g) || []).length > 1) {
      const lastHttpIndex = Math.max(cleanedPath.lastIndexOf('https://'), cleanedPath.lastIndexOf('http://'));
      if (lastHttpIndex > 0) {
        cleanedPath = cleanedPath.substring(lastHttpIndex);
      }
    }
    setPath(cleanedPath);
    // Auto infer project name if it looks like a Git URL
    if (cleanedPath.includes('github.com/')) {
      const parts = cleanedPath.replace(/\.git$/, '').split('/');
      const repo = parts[parts.length - 1];
      if (repo && (name === 'StackDoctor' || !name.trim())) {
        setName(repo.charAt(0).toUpperCase() + repo.slice(1));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !path.trim()) return;
    onScanStart({ name, path });
  };

  return (
    <div className="glass-card animate-slideup" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🔍</span> Scan Repository & Generate Setup Commands
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          Git URL or Local Workspace Supported
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Express API"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Git URL or Local Workspace Path</label>
            <input
              type="text"
              value={path}
              onChange={(e) => handlePathChange(e.target.value)}
              placeholder="e.g. https://github.com/expressjs/express or f:/my-project"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
              required
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Quick Scan Examples:</span>
          <button
            type="button"
            onClick={() => { setName('StackDoctor'); setPath('f:/DEVELOPEMENT/FINAL PROJECT/stackdoctor'); }}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: '#fff', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
          >
            Local Workspace
          </button>
          <button
            type="button"
            onClick={() => { setName('Chat Backend'); setPath('https://github.com/ppl8763/chat-backend'); }}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: '#a855f7', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
          >
            Chat Backend (FastAPI)
          </button>
          <button
            type="button"
            onClick={() => { setName('Express'); setPath('https://github.com/expressjs/express'); }}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: '#38bdf8', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
          >
            Express (Git)
          </button>
          <button
            type="button"
            onClick={() => { setName('Spring PetClinic'); setPath('https://github.com/spring-projects/spring-petclinic'); }}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: '#4ade80', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
          >
            Spring PetClinic (Git)
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={isScanning}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: isScanning ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isScanning ? (
              <>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Scanning Workspace & Analysing Requirements...
              </>
            ) : (
              <>
                <span>🚀</span> Scan Repo & Find Missing Tools
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

