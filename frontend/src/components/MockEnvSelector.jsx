import React from 'react';

const PRESETS = {
  matching: {
    label: '🟢 Environment Match (Everything OK)',
    os: 'windows',
    node: '22.4.0',
    java: '21',
    go: '1.22.0',
    rust: '1.78.0',
    git: '2.44.0',
    dockerRunning: true,
    occupiedPorts: []
  },
  mismatched: {
    label: '🔴 Conflicts (Node/Java/Go outdated & Docker Stopped)',
    os: 'windows',
    node: '20.19.0',
    java: '17',
    go: '1.18.0',
    rust: '1.72.0',
    git: '2.25.0',
    dockerRunning: false,
    occupiedPorts: [8080]
  },
  severelyOutdated: {
    label: '💀 Severe Mismatch (Outdated Runtimes & Port Conflicts)',
    os: 'linux',
    node: '16.14.0',
    java: '11',
    go: '1.16.0',
    rust: '1.60.0',
    git: '2.18.0',
    dockerRunning: false,
    occupiedPorts: [8080, 5432]
  }
};

export default function MockEnvSelector({ currentEnv, onChange }) {
  const handlePresetSelect = (presetKey) => {
    const preset = PRESETS[presetKey];
    onChange({
      os: preset.os,
      tools: {
        node: preset.node,
        java: preset.java,
        go: preset.go,
        rust: preset.rust,
        git: preset.git,
        python: '3.12',
        docker: '27.1'
      },
      dockerRunning: preset.dockerRunning,
      occupiedPorts: preset.occupiedPorts
    });
  };

  return (
    <div className="glass-card animate-slideup" style={{ height: '100%', overflowY: 'auto' }}>
      <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>💻</span> Developer PC Simulator
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
        Configure the simulated developer machine to check how StackDoctor compares local PC settings with repository requirements.
      </p>

      {/* Preset Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.2rem' }}>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => handlePresetSelect(key)}
            style={{
              textAlign: 'left',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glass)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-glass)'}
          >
            {p.label}
          </button>
        ))}
      </div>

      <hr style={{ border: 'none', height: '1px', background: 'var(--border-glass)', margin: '1rem 0' }} />

      {/* Manual Inspector Config */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>Local Node.js</label>
          <select
            value={currentEnv.tools?.node || '20.19.0'}
            onChange={(e) => onChange({
              ...currentEnv,
              tools: { ...currentEnv.tools, node: e.target.value }
            })}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem',
              color: '#fff',
              fontSize: '0.8rem'
            }}
          >
            <option value="22.5.0">22.5.0 (Latest)</option>
            <option value="20.19.0">20.19.0 (LTS)</option>
            <option value="18.2.0">18.2.0 (Outdated)</option>
            <option value="16.14.0">16.14.0 (Outdated)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>Local Java JDK</label>
          <select
            value={currentEnv.tools?.java || '17'}
            onChange={(e) => onChange({
              ...currentEnv,
              tools: { ...currentEnv.tools, java: e.target.value }
            })}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem',
              color: '#fff',
              fontSize: '0.8rem'
            }}
          >
            <option value="21">JDK 21 (LTS)</option>
            <option value="17">JDK 17 (LTS)</option>
            <option value="11">JDK 11 (Outdated)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>Local Go Lang</label>
          <select
            value={currentEnv.tools?.go || '1.18.0'}
            onChange={(e) => onChange({
              ...currentEnv,
              tools: { ...currentEnv.tools, go: e.target.value }
            })}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem',
              color: '#fff',
              fontSize: '0.8rem'
            }}
          >
            <option value="1.22.0">Go 1.22 (Latest)</option>
            <option value="1.20.0">Go 1.20 (LTS)</option>
            <option value="1.18.0">Go 1.18 (Outdated)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>Local Rust</label>
          <select
            value={currentEnv.tools?.rust || '1.72.0'}
            onChange={(e) => onChange({
              ...currentEnv,
              tools: { ...currentEnv.tools, rust: e.target.value }
            })}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem',
              color: '#fff',
              fontSize: '0.8rem'
            }}
          >
            <option value="1.78.0">Rust 1.78 (Latest)</option>
            <option value="1.75.0">Rust 1.75 (LTS)</option>
            <option value="1.65.0">Rust 1.65 (Outdated)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>Local Git Cli</label>
          <select
            value={currentEnv.tools?.git || '2.25.0'}
            onChange={(e) => onChange({
              ...currentEnv,
              tools: { ...currentEnv.tools, git: e.target.value }
            })}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem',
              color: '#fff',
              fontSize: '0.8rem'
            }}
          >
            <option value="2.44.0">Git v2.44</option>
            <option value="2.30.0">Git v2.30</option>
            <option value="2.20.0">Git v2.20 (Outdated)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: 'span 2', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            id="dockerRunning"
            checked={currentEnv.dockerRunning}
            onChange={(e) => onChange({
              ...currentEnv,
              dockerRunning: e.target.checked
            })}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="dockerRunning" style={{ color: 'var(--text-primary)', fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none' }}>
            Docker Daemon Running
          </label>
        </div>
      </div>
    </div>
  );
}
