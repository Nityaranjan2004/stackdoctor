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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !path.trim()) return;
    onScanStart({ name, path });
  };

  return (
    <div className="glass-card animate-slideup" style={{ marginBottom: '2rem' }}>
      <h2 style={{ marginBottom: '1.2rem', fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🔍</span> Scan Repository
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My E-commerce"
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
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Git URL or Local Workspace Directory Path</label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="e.g. https://github.com/user/repo or f:/my-project"
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
                Scanning Workspace...
              </>
            ) : (
              <>
                <span>🚀</span> Start Deep Scan
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setPath('f:/DEVELOPEMENT/FINAL PROJECT/stackdoctor')}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1.2rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            Reset Path
          </button>
        </div>
      </form>
    </div>
  );
}
