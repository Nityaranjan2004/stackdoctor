import React from 'react';

const CATEGORY_ICONS = {
  'Language': '🔤',
  'Frontend Framework': '💻',
  'Backend Framework': '⚙️',
  'Database': '🗄️',
  'Database/Cache': '⚡',
  'Infrastructure': '🐳',
  'ORM': '🔌',
  'CI/CD': '🚀',
  'Build Tool': '🛠️'
};

export default function StackPanel({ stacks }) {
  return (
    <div className="glass-card animate-slideup" style={{ gridColumn: 'span 2' }}>
      <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>📦</span> Project Tech Stack Profile
      </h3>
      
      {stacks.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No specific tech stack detected. Add configuration files to start.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {stacks.map((stackItem) => {
            const icon = CATEGORY_ICONS[stackItem.category] || '📦';
            return (
              <div
                key={stackItem.id || stackItem.name}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
              >
                <div style={{ fontSize: '1.8rem' }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{stackItem.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stackItem.category}</div>
                  {stackItem.version && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '0.3rem',
                      fontSize: '0.7rem',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      color: 'var(--text-secondary)'
                    }}>
                      v{stackItem.version.replace(/[^0-9.]/g, '')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
