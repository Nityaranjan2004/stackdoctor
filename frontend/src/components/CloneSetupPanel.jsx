import React, { useState } from 'react';

export default function CloneSetupPanel({ project, mockEnv }) {
  const [copiedStep, setCopiedStep] = useState(null);
  const [isOpeningTerminal, setIsOpeningTerminal] = useState(false);
  const [terminalMessage, setTerminalMessage] = useState(null);

  const pathOrUrl = project?.path || '';
  const isGitUrl = pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('git@');

  const defaultFolder = isGitUrl ? 'f:/DEVELOPEMENT/FINAL PROJECT' : pathOrUrl;
  const [targetFolder, setTargetFolder] = useState(defaultFolder);

  if (!project) return null;

  const handleOpenTerminal = async (cmdToRun) => {
    setIsOpeningTerminal(true);
    setTerminalMessage(null);
    try {
      const res = await fetch('http://localhost:5000/api/scan/open-terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmdToRun, targetFolder })
      });
      const data = await res.json();
      if (res.ok) {
        setTerminalMessage(`✨ Terminal opened in ${targetFolder || 'system folder'}! Press ENTER inside terminal to execute.`);
      } else {
        setTerminalMessage('⚠️ ' + (data.error || 'Failed to open terminal'));
      }
    } catch (e) {
      setTerminalMessage('❌ Could not connect to backend to open terminal.');
    } finally {
      setIsOpeningTerminal(false);
      setTimeout(() => setTerminalMessage(null), 6000);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/scan/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: targetFolder })
      });
      const data = await res.json();
      if (res.ok) {
        setTerminalMessage(`📁 Opened folder: ${targetFolder}`);
      } else {
        setTerminalMessage('⚠️ ' + (data.error || 'Failed to open folder'));
      }
    } catch (e) {
      setTerminalMessage('❌ Failed to open folder.');
    } finally {
      setTimeout(() => setTerminalMessage(null), 5000);
    }
  };

  const handlePickFolder = async () => {
    try {
      setTerminalMessage('⏳ Opening system folder browser...');
      const res = await fetch('http://localhost:5000/api/scan/pick-folder', { method: 'POST' });
      const data = await res.json();
      if (data.selectedFolder) {
        setTargetFolder(data.selectedFolder);
        setTerminalMessage(`✅ Selected target folder: ${data.selectedFolder}`);
      } else {
        setTerminalMessage('Folder selection cancelled.');
      }
    } catch (e) {
      setTerminalMessage('❌ Failed to open folder picker.');
    } finally {
      setTimeout(() => setTerminalMessage(null), 5000);
    }
  };

  // Extract folder name
  let folderName = project.name ? project.name.toLowerCase().replace(/\s+/g, '-') : 'project-repo';
  if (isGitUrl) {
    const parts = pathOrUrl.replace(/\.git$/, '').split('/');
    if (parts.length > 0 && parts[parts.length - 1]) {
      folderName = parts[parts.length - 1];
    }
  }

  // Detect tech stacks & requirements
  const stacks = project.stacks || [];
  const stackNames = new Set(stacks.map(s => s.name.toLowerCase()));
  const deps = project.dependencies || [];

  // Check missing tools / versions
  const missingChecks = [];

  // Git check
  const gitVer = mockEnv?.tools?.git || '0.0.0';
  const gitOk = parseInt(gitVer.split('.')[0] || '0', 10) >= 2;
  missingChecks.push({
    name: 'Git Version Control',
    required: '>= 2.30',
    installed: mockEnv?.tools?.git ? `v${mockEnv.tools.git}` : 'Not installed',
    isMissing: !mockEnv?.tools?.git,
    category: 'System Tool',
    fixCmd: 'https://git-scm.com/downloads'
  });

  // Node check
  if (stackNames.has('javascript') || stackNames.has('typescript') || stackNames.has('node') || stackNames.has('react') || stackNames.has('next.js')) {
    const nodeVer = mockEnv?.tools?.node || null;
    const nodeMajor = nodeVer ? parseInt(nodeVer.split('.')[0], 10) : 0;
    const isNodeOk = nodeMajor >= 22;
    missingChecks.push({
      name: 'Node.js Runtime',
      required: 'v22.x',
      installed: nodeVer ? `v${nodeVer}` : 'Not installed',
      isMissing: !nodeVer || !isNodeOk,
      category: 'Runtime',
      fixCmd: 'nvm install 22 && nvm use 22'
    });
  }

  // Python check
  if (stackNames.has('python') || stackNames.has('django') || stackNames.has('fastapi') || stackNames.has('flask')) {
    const pyVer = mockEnv?.tools?.python || null;
    missingChecks.push({
      name: 'Python Environment',
      required: '>= 3.10',
      installed: pyVer ? `v${pyVer}` : 'Not installed',
      isMissing: !pyVer,
      category: 'Runtime',
      fixCmd: 'winget install Python.Python.3.12'
    });
  }

  // Java check
  if (stackNames.has('java') || stackNames.has('spring boot') || stackNames.has('maven')) {
    const javaVer = mockEnv?.tools?.java || null;
    missingChecks.push({
      name: 'Java JDK',
      required: 'JDK 21',
      installed: javaVer ? `v${javaVer}` : 'Not installed',
      isMissing: !javaVer,
      category: 'Runtime',
      fixCmd: 'winget install EclipseAdoptium.Temurin.21.JDK'
    });
  }

  // Docker check
  if (stackNames.has('docker') || deps.some(d => d.name.toLowerCase().includes('docker'))) {
    const isDockerRunning = mockEnv?.dockerRunning || false;
    missingChecks.push({
      name: 'Docker Daemon',
      required: 'Running',
      installed: isDockerRunning ? 'Running' : 'Stopped / Not Running',
      isMissing: !isDockerRunning,
      category: 'Container Engine',
      fixCmd: 'docker desktop start'
    });
  }

  // Database checks
  const hasPostgres = deps.some(d => d.name.toLowerCase().includes('postgres')) || stackNames.has('postgresql');
  if (hasPostgres) {
    missingChecks.push({
      name: 'PostgreSQL Database Service',
      required: 'Port 5432 / Service',
      installed: 'Check local port 5432',
      isMissing: true,
      category: 'Database',
      fixCmd: 'docker run --name postgres-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres'
    });
  }

  // Build step-by-step commands
  const steps = [];

  // Step 1: Clone
  if (isGitUrl) {
    steps.push({
      num: 1,
      title: 'Clone Repository to local machine',
      command: `git clone ${pathOrUrl}`,
      description: 'Downloads all project source code, configurations, and assets into your system.'
    });
  } else {
    steps.push({
      num: 1,
      title: 'Navigate to project directory',
      command: `cd "${pathOrUrl}"`,
      description: 'Open terminal inside your local workspace directory.'
    });
  }

  // Step 2: Change directory (if cloned)
  if (isGitUrl) {
    steps.push({
      num: 2,
      title: 'Navigate into project folder',
      command: `cd ${folderName}`,
      description: 'Change directory to the cloned repository root.'
    });
  }

  // Step 3: Install Missing System Runtimes/Containers (if any)
  const fixableToolCmds = missingChecks.filter(c => c.isMissing && c.fixCmd && !c.fixCmd.startsWith('http')).map(c => c.fixCmd);
  if (fixableToolCmds.length > 0) {
    steps.push({
      num: steps.length + 1,
      title: 'Install / Start missing local tools',
      command: fixableToolCmds.join(' && '),
      description: 'Ensures required database containers and runtime versions are active on your PC.'
    });
  }

  // Step 4: Install Dependencies
  let installCmd = 'npm install';
  if (stackNames.has('python')) installCmd = 'pip install -r requirements.txt';
  else if (stackNames.has('java') || stackNames.has('maven')) installCmd = './mvnw clean install';
  
  steps.push({
    num: steps.length + 1,
    title: 'Install project dependencies',
    command: installCmd,
    description: 'Installs all required package libraries specified in the manifest.'
  });

  // Step 5: Start / Run Project
  let runCmd = 'npm run dev';
  if (stackNames.has('python')) runCmd = 'python main.py';
  else if (stackNames.has('java')) runCmd = './mvnw spring-boot:run';
  else if (stackNames.has('docker')) runCmd = 'docker compose up';

  steps.push({
    num: steps.length + 1,
    title: 'Launch application',
    command: runCmd,
    description: 'Starts the development server or containerized application.'
  });

  // Construct full one-liner execution command
  const fullChainedCommand = steps.map(s => s.command).join(' && ');

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(label);
    setTimeout(() => setCopiedStep(null), 2500);
  };

  return (
    <div className="glass-card animate-slideup" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🚀</span> Project Clone & Local Execution Guide
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            StackDoctor has analyzed <strong style={{ color: 'var(--accent-primary)' }}>{project.name}</strong>. Here is what is missing on your PC and the commands to run it.
          </p>
        </div>
      </div>

      {/* Target Destination Directory Selector */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-sm)',
        padding: '1rem 1.2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>📂</span> Target Folder on Your System:
          </label>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Terminal will open inside this directory
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={targetFolder}
            onChange={(e) => setTargetFolder(e.target.value)}
            placeholder="e.g. C:\Users\nitya\Projects or f:\DEVELOPEMENT\FINAL PROJECT"
            style={{
              flex: 1,
              minWidth: '260px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-glass)',
              borderRadius: '6px',
              padding: '0.65rem 0.85rem',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />

          <button
            onClick={handlePickFolder}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.65rem 1rem',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
          >
            <span>🔍 Choose System Folder</span>
          </button>

          <button
            onClick={() => handleOpenTerminal(fullChainedCommand)}
            disabled={isOpeningTerminal}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '6px',
              padding: '0.65rem 1.2rem',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: isOpeningTerminal ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <span>🖥️ Launch Terminal in Folder</span>
          </button>
        </div>
      </div>

      {terminalMessage && (
        <div style={{
          padding: '0.85rem 1.2rem',
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '6px',
          color: '#60a5fa',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <span>{terminalMessage}</span>
        </div>
      )}

      {/* Missing Tools & System Inspection Summary */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '1.1rem' }}>
        <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🔍</span> System Tools & Dependency Scan
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem' }}>
          {missingChecks.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: item.isMissing ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${item.isMissing ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                borderRadius: '6px',
                padding: '0.75rem 0.9rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Req: {item.required} | PC: {item.installed}
                </div>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: item.isMissing ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: item.isMissing ? 'var(--color-danger)' : 'var(--color-success)'
              }}>
                {item.isMissing ? 'MISSING / ISSUE' : 'INSTALLED'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-Step Terminal Instructions */}
      <div>
        <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>💻</span> Run in Your Terminal ({isGitUrl ? 'Git Clone & Setup' : 'Local Project Setup'})
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {steps.map((st) => (
            <div
              key={st.num}
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '1rem 1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {st.num}
                  </span>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>
                    {st.title}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(st.command, `step-${st.num}`)}
                  style={{
                    background: copiedStep === `step-${st.num}` ? 'var(--color-success)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '4px',
                    padding: '0.3rem 0.7rem',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {copiedStep === `step-${st.num}` ? '✓ Copied' : 'Copy Step'}
                </button>
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '6px',
                padding: '0.65rem 0.85rem',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: '#38bdf8',
                wordBreak: 'break-all'
              }}>
                $ {st.command}
              </div>
              
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                {st.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* One-Liner Shell Box */}
      <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '1rem 1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Complete 1-Liner Terminal Execution Command:
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Paste in Terminal / PowerShell</span>
        </div>
        <div style={{
          background: '#020617',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          color: '#4ade80',
          overflowX: 'auto'
        }}>
          {fullChainedCommand}
        </div>
      </div>

    </div>
  );
}
