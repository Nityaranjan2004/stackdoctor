import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export default function AiFixModal({ diagnostic, onClose }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fixContent, setFixContent] = useState(null);

  useEffect(() => {
    if (!diagnostic) return;
    fetchAiFix();
  }, [diagnostic]);

  const fetchAiFix = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/scan/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diagnostic)
      });
      const data = await res.json();
      setFixContent(data);
    } catch (e) {
      console.warn('Failed to fetch AI fix, using offline default:', e);
      setFixContent({
        explanation: diagnostic.description || 'An issue was detected in your development environment.',
        commands: '# Recommended fix command\nnpm install'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!diagnostic) return null;

  const handleCopy = () => {
    if (!fixContent?.commands) return;
    navigator.clipboard.writeText(fixContent.commands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div
        className="glass-card animate-slideup"
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px var(--accent-glow)',
          padding: '2rem'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <span style={{
              display: 'inline-block',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))',
              color: 'var(--accent-primary)',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              marginBottom: '0.4rem'
            }}>
              ✨ Gemini AI Fix Generator
            </span>
            <h3 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700 }}>
              Remediation: {diagnostic.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{
              width: '36px',
              height: '36px',
              border: '3px solid rgba(59, 130, 246, 0.2)',
              borderTopColor: 'var(--accent-primary)',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#fff' }}>
              Gemini AI is analyzing the diagnostic error and generating fix instructions...
            </p>
          </div>
        ) : (
          <>
            {/* Body Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 600 }}>Problem Analysis</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.45' }}>
                {fixContent?.explanation}
              </p>
            </div>

            {/* Code Editor Mock */}
            <div style={{ marginBottom: '1.8rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0d1117',
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                padding: '0.5rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>Terminal Script</span>
                <button
                  onClick={handleCopy}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    padding: '0.25rem 0.6rem',
                    color: copied ? 'var(--color-success)' : '#fff',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <pre style={{
                background: '#070a13',
                padding: '1.2rem',
                borderBottomLeftRadius: '6px',
                borderBottomRightRadius: '6px',
                overflowX: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: 'var(--color-info)',
                lineHeight: 1.4
              }}>
                <code>{fixContent?.commands}</code>
              </pre>
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.7rem 1.4rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.7rem 1.4rem',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
              >
                Copy Script
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
