import React, { useState } from 'react';

export default function AiFixModal({ diagnostic, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!diagnostic) return null;

  // Generate mock AI fixes for testing
  const getFixContent = (diag) => {
    const title = diag.title.toLowerCase();
    
    if (title.includes('node')) {
      return {
        explanation: 'The project requires a newer version of Node.js (version 22) than what is installed on your computer. An outdated Node runtime can lead to package compatibility errors.',
        commands: '# Upgrade Node.js (using fnm or nvm)\nfnm install 22\nfnm use 22\n\n# Confirm version is updated:\nnode --version'
      };
    }
    
    if (title.includes('java')) {
      return {
        explanation: 'This project is built using JDK 21 but your environment is pointing to an older JDK version. We recommend updating your system JAVA_HOME path variable.',
        commands: '# On Windows (PowerShell) install via winget:\nwinget install Eclipse.Temurin.Jdk.21\n\n# Set your JAVA_HOME environment variable to the JDK 21 path.'
      };
    }
    
    if (title.includes('docker') || title.includes('compose')) {
      return {
        explanation: 'Docker engine or the Docker desktop daemon is stopped or not initialized. The system requires Docker to spin up database and cache microservices.',
        commands: '# Start Docker daemon service (Linux):\nsudo systemctl start docker\n\n# On Windows/Mac:\n# Open Docker Desktop application from your applications tray.'
      };
    }

    if (title.includes('port')) {
      return {
        explanation: 'The application port (e.g. 8080) is already in use by another running process (such as java.exe or python.exe). You must terminate the blocking process.',
        commands: '# Find and kill process running on port 8080 (Windows PowerShell):\nStop-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess -Force'
      };
    }

    if (title.includes('secrets') || title.includes('env')) {
      return {
        explanation: 'You have committed local configuration/secret environment files (like .env) to your git repository. Secrets should never be committed to source control.',
        commands: '# 1. Remove the file from git tracking without deleting it locally:\ngit rm --cached backend/.env\n\n# 2. Commit the deletion change:\ngit commit -m "chore: stop tracking local secrets"\n\n# 3. Add to your root .gitignore:\necho "backend/.env" >> .gitignore'
      };
    }

    return {
      explanation: diag.description,
      commands: '# Standard recommended remediation\nnpm install'
    };
  };

  const fix = getFixContent(diagnostic);

  const handleCopy = () => {
    navigator.clipboard.writeText(fix.commands);
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
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
          maxWidth: '650px',
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
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--accent-primary)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              marginBottom: '0.4rem'
            }}>
              AI Generated Fix
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

        {/* Body Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 600 }}>Problem Analysis</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.45' }}>
            {fix.explanation}
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
            <code>{fix.commands}</code>
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
      </div>
    </div>
  );
}
