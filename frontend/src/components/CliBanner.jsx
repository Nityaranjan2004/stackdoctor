import React, { useState } from 'react';

export default function CliBanner({ projectId }) {
  const [copied, setCopied] = useState(false);

  if (!projectId) return null;

  const cliCommand = `npx stackdoctor diagnose --key ${projectId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="glass-card animate-slideup"
      style={{
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(16, 185, 129, 0.08))',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.2rem 1.5rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
        <span style={{ fontSize: '1.5rem', marginTop: '-0.2rem' }}>💡</span>
        <div>
          <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            Inspect Your Local Laptop Compatibility
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Run this command in your terminal to inspect installed runtimes on your PC and sync with this report:
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <code style={{
          background: '#090d16',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.6rem 1rem',
          borderRadius: '6px',
          color: 'var(--color-info)',
          fontFamily: 'monospace',
          fontSize: '0.88rem',
          fontWeight: 600,
          userSelect: 'all'
        }}>
          {cliCommand}
        </code>

        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'var(--color-success-bg)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            border: copied ? '1px solid var(--color-success)' : 'none',
            borderRadius: '6px',
            padding: '0.6rem 1.2rem',
            color: copied ? 'var(--color-success)' : '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: copied ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy Command'}
        </button>
      </div>
    </div>
  );
}
