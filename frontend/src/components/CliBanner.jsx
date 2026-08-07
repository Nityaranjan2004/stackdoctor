import React, { useState } from 'react';

export default function CliBanner({ projectId }) {
  const [copied, setCopied] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [message, setMessage] = useState(null);

  if (!projectId) return null;

  const cliCommand = `npx stackdoctor diagnose --key ${projectId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchTerminal = async () => {
    setIsLaunching(true);
    setMessage(null);
    try {
      const res = await fetch('http://localhost:5000/api/scan/open-terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cliCommand })
      });
      if (res.ok) {
        setMessage('✨ Terminal opened! Press ENTER inside terminal to execute.');
      } else {
        setMessage('⚠️ Failed to launch terminal');
      }
    } catch (e) {
      setMessage('❌ Connection to backend failed');
    } finally {
      setIsLaunching(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div
        className="glass-card animate-slideup"
        style={{
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
              Inspect & Sync Local System Compatibility
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              StackDoctor auto-detects <code>requirements.txt</code>, <code>README.md</code>, and project manifests directly. Run this command to verify local runtime sync:
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

          <button
            onClick={handleLaunchTerminal}
            disabled={isLaunching}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.6rem 1.2rem',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: isLaunching ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            {isLaunching ? 'Launching...' : '🖥️ Launch & Run'}
          </button>
        </div>
      </div>
      {message && (
        <div style={{
          padding: '0.6rem 1rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '6px',
          color: '#60a5fa',
          fontSize: '0.8rem',
          fontWeight: 600
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
