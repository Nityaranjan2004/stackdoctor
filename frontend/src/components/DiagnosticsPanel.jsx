import React, { useState } from 'react';

export default function DiagnosticsPanel({ diagnostics, onShowFix }) {
  const [filter, setFilter] = useState('all'); // all, errors, warnings, success

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'error':
        return {
          border: 'rgba(239, 68, 68, 0.25)',
          bg: 'rgba(239, 68, 68, 0.08)',
          color: 'var(--color-danger)',
          icon: '🔴',
          badge: 'ERROR'
        };
      case 'warning':
        return {
          border: 'rgba(245, 158, 11, 0.25)',
          bg: 'rgba(245, 158, 11, 0.08)',
          color: 'var(--color-warning)',
          icon: '🟡',
          badge: 'WARNING'
        };
      default:
        return {
          border: 'rgba(16, 185, 129, 0.25)',
          bg: 'rgba(16, 185, 129, 0.08)',
          color: 'var(--color-success)',
          icon: '🟢',
          badge: 'PASSED'
        };
    }
  };

  const filteredDiagnostics = diagnostics.filter(d => {
    if (filter === 'errors') return d.severity === 'error';
    if (filter === 'warnings') return d.severity === 'warning';
    return true;
  });

  return (
    <div className="glass-card animate-slideup" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Title & Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.8rem', flexWrap: 'wrap', gap: '0.8rem' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚠️</span> Environment Diagnostic Checklist
        </h3>
        
        {/* Toggle Filters */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '0.2rem', border: '1px solid var(--border-glass)' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '4px',
              border: 'none',
              background: filter === 'all' ? '#1e293b' : 'transparent',
              color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            All ({diagnostics.length})
          </button>
          <button
            onClick={() => setFilter('errors')}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '4px',
              border: 'none',
              background: filter === 'errors' ? 'var(--color-danger-bg)' : 'transparent',
              color: filter === 'errors' ? 'var(--color-danger)' : 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Errors ({diagnostics.filter(d => d.severity === 'error').length})
          </button>
          <button
            onClick={() => setFilter('warnings')}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '4px',
              border: 'none',
              background: filter === 'warnings' ? 'var(--color-warning-bg)' : 'transparent',
              color: filter === 'warnings' ? 'var(--color-warning)' : 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Warnings ({diagnostics.filter(d => d.severity === 'warning').length})
          </button>
        </div>
      </div>

      {filteredDiagnostics.length === 0 ? (
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-success)',
          fontWeight: 600,
          fontSize: '0.92rem'
        }}>
          ✨ All checks passed! Your local PC matches the project requirements perfectly.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {filteredDiagnostics.map((diag, index) => {
            const styles = getSeverityStyles(diag.severity);
            return (
              <div
                key={index}
                style={{
                  background: styles.bg,
                  border: `1px solid ${styles.border}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem 1.2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem', marginTop: '0.1rem' }}>{styles.icon}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                        {diag.title}
                      </h4>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: diag.severity === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: styles.color
                      }}>
                        {styles.badge}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      {diag.description}
                    </p>
                    {diag.file && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>File link:</span>
                        <a
                          href={`file:///${diag.file}`}
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: 'var(--accent-primary)',
                            textDecoration: 'none'
                          }}
                          onClick={(e) => e.preventDefault()}
                        >
                          {diag.file}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onShowFix(diag)}
                  style={{
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '0.45rem 0.9rem',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#334155';
                    e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#1e293b';
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  ⚡ View Fix
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
