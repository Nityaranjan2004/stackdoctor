import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

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
      const res = await fetch(`${API_BASE_URL}/api/scan/open-terminal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmdToRun, targetFolder })
      });
      const data = await res.json();
      if (res.ok) {
        setTerminalMessage(`✨ Terminal opened in ${targetFolder || 'system folder'}! Commands are auto-executing now.`);
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
      const res = await fetch(`${API_BASE_URL}/api/scan/open-folder`, {
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
      const res = await fetch(`${API_BASE_URL}/api/scan/pick-folder`, { method: 'POST' });
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

  // Check missing tools required specifically by this project
  const missingChecks = [];

  // Git check (only if Git is missing and project is a Git repository)
  const gitVer = mockEnv?.tools?.git || null;
  if (isGitUrl && !gitVer) {
    missingChecks.push({
      name: 'Git Version Control',
      required: '>= 2.30',
      installed: 'Not installed',
      isMissing: true,
      category: 'System Tool',
      fixCmd: 'https://git-scm.com/downloads'
    });
  }

  // Node check (only if project requires JS/TS/Node)
  if (stackNames.has('javascript') || stackNames.has('typescript') || stackNames.has('node') || stackNames.has('react') || stackNames.has('next.js')) {
    const nodeVer = mockEnv?.tools?.node || null;
    const nodeMajor = nodeVer ? parseInt(nodeVer.split('.')[0], 10) : 0;
    if (!nodeVer || nodeMajor < 18) {
      missingChecks.push({
        name: 'Node.js Runtime',
        required: '>= v18.x',
        installed: nodeVer ? `v${nodeVer}` : 'Not installed',
        isMissing: true,
        category: 'Runtime',
        fixCmd: 'nvm install 22 && nvm use 22'
      });
    }
  }

  // Python check (only if project requires Python/Django/FastAPI/Flask)
  if (stackNames.has('python') || stackNames.has('django') || stackNames.has('fastapi') || stackNames.has('flask')) {
    const pyVer = mockEnv?.tools?.python || null;
    if (!pyVer) {
      missingChecks.push({
        name: 'Python Environment',
        required: '>= 3.10',
        installed: 'Not installed',
        isMissing: true,
        category: 'Runtime',
        fixCmd: 'winget install Python.Python.3.12'
      });
    }
  }

  // Java check (only if project requires Java/Spring/Maven)
  if (stackNames.has('java') || stackNames.has('spring boot') || stackNames.has('maven')) {
    const javaVer = mockEnv?.tools?.java || null;
    if (!javaVer) {
      missingChecks.push({
        name: 'Java JDK',
        required: 'JDK 21',
        installed: 'Not installed',
        isMissing: true,
        category: 'Runtime',
        fixCmd: 'winget install EclipseAdoptium.Temurin.21.JDK'
      });
    }
  }

  // Rust check (only if project requires Rust)
  if (stackNames.has('rust')) {
    const rustVer = mockEnv?.tools?.rust || null;
    if (!rustVer) {
      missingChecks.push({
        name: 'Rust Toolchain (cargo & rustc)',
        required: '>= 1.70',
        installed: 'Not installed',
        isMissing: true,
        category: 'Runtime',
        fixCmd: 'winget install Rustlang.Rustup'
      });
    }
  }

  // Go check (only if project requires Go)
  if (stackNames.has('go') || stackNames.has('golang')) {
    const goVer = mockEnv?.tools?.go || null;
    if (!goVer) {
      missingChecks.push({
        name: 'Go Programming Language',
        required: '>= 1.20',
        installed: 'Not installed',
        isMissing: true,
        category: 'Runtime',
        fixCmd: 'winget install GoLang.Go'
      });
    }
  }

  // Docker check (only if project has docker files or dependencies)
  if (stackNames.has('docker') || deps.some(d => d.name.toLowerCase().includes('docker'))) {
    const isDockerRunning = mockEnv?.dockerRunning || false;
    if (!isDockerRunning) {
      missingChecks.push({
        name: 'Docker Daemon',
        required: 'Running',
        installed: 'Stopped / Not Running',
        isMissing: true,
        category: 'Container Engine',
        fixCmd: 'docker desktop start'
      });
    }
  }

  // Database check (only if project explicitly requires PostgreSQL)
  const hasPostgres = deps.some(d => d.name.toLowerCase().includes('postgres')) || stackNames.has('postgresql');
  if (hasPostgres && !mockEnv?.services?.postgres) {
    missingChecks.push({
      name: 'PostgreSQL Database Service',
      required: 'Port 5432 / Service',
      installed: 'Service not active on 5432',
      isMissing: true,
      category: 'Database',
      fixCmd: 'docker run --name postgres-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres'
    });
  }

  // Check if manifest lives in a subfolder (e.g. subfolder:backend)
  let subDir = '';
  stacks.forEach(s => {
    if (s.version && typeof s.version === 'string' && s.version.startsWith('subfolder:')) {
      subDir = s.version.replace('subfolder:', '');
    }
  });

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
  } else if (pathOrUrl && pathOrUrl.trim() !== '') {
    steps.push({
      num: 1,
      title: 'Navigate to project directory',
      command: `cd "${pathOrUrl}"`,
      description: 'Open terminal inside your local workspace directory.'
    });
  }

  // Step 2: Change directory (if cloned)
  if (isGitUrl) {
    const targetCd = subDir ? `${folderName}/${subDir}` : folderName;
    steps.push({
      num: 2,
      title: subDir ? `Navigate into project subfolder (${subDir})` : 'Navigate into project folder',
      command: `cd ${targetCd}`,
      description: subDir
        ? `StackDoctor detected manifest file inside subfolder '${subDir}'.`
        : 'Change directory to the cloned repository root.'
    });
  } else if (subDir) {
    steps.push({
      num: 2,
      title: `Navigate into subfolder (${subDir})`,
      command: `cd ${subDir}`,
      description: `StackDoctor detected manifest file inside subfolder '${subDir}'.`
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

  // Extract Python Entry File if detected by backend scanner
  const pyEntryStack = stacks.find(s => s.name === 'Python Entry Point');
  const entryPyFile = pyEntryStack ? pyEntryStack.version : null;

  // Check stack types dynamically from scanner output
  const isRustProject = stackNames.has('rust');
  const isGoProject = stackNames.has('go') || stackNames.has('golang');
  const isPythonProject = stackNames.has('python') || stackNames.has('fastapi') || stackNames.has('django') || stackNames.has('flask') || stackNames.has('streamlit') || !!entryPyFile;
  const isNodeProject = stackNames.has('javascript') || stackNames.has('typescript') || stackNames.has('node') || stackNames.has('react') || stackNames.has('express') || stackNames.has('next.js') || stackNames.has('vite');
  const isJavaProject = stackNames.has('java') || stackNames.has('spring boot') || stackNames.has('maven');

  // Step 4: Install Dependencies / Build
  let installCmd = null;
  let installDesc = '';

  if (isRustProject) {
    installCmd = 'cargo build';
    installDesc = 'Fetches Rust dependencies and compiles crate binaries.';
  } else if (isGoProject) {
    installCmd = 'go mod download';
    installDesc = 'Downloads Go module dependencies specified in go.mod.';
  } else if (isPythonProject) {
    installCmd = 'pip install -r requirements.txt';
    installDesc = subDir ? `Installs Python packages from ${subDir}/requirements.txt.` : 'Installs all Python dependencies from requirements.txt.';
  } else if (isJavaProject) {
    installCmd = './mvnw clean install';
    installDesc = 'Builds Java project dependencies using Maven wrapper.';
  } else if (isNodeProject) {
    installCmd = 'npm install';
    installDesc = subDir ? `Installs package dependencies inside ${subDir}/ manifest.` : 'Installs all required package libraries specified in package.json.';
  }

  if (installCmd) {
    steps.push({
      num: steps.length + 1,
      title: 'Install project dependencies & build',
      command: installCmd,
      description: installDesc
    });
  }

  // Step 5: Start / Run Project
  let runCmd = null;
  let runTitle = 'Launch application';
  let runDesc = 'Starts the development server or containerized application.';

  if (isRustProject) {
    runCmd = 'cargo run';
    runTitle = 'Launch Rust Binary';
    runDesc = 'Compiles and executes the Rust binary crate.';
  } else if (isGoProject) {
    runCmd = 'go run .';
    runTitle = 'Launch Go Application';
    runDesc = 'Compiles and runs main Go package.';
  } else if (isPythonProject) {
    if (stackNames.has('streamlit')) {
      runCmd = `streamlit run ${entryPyFile || 'app.py'}`;
      runTitle = 'Launch Streamlit Dashboard';
      runDesc = 'Starts Streamlit web application server.';
    } else if (stackNames.has('fastapi')) {
      const modulePath = entryPyFile ? entryPyFile.replace(/\.py$/, '').replace(/\//g, '.') : 'main';
      runCmd = `uvicorn ${modulePath}:app --reload`;
      runTitle = 'Launch FastAPI Server';
      runDesc = 'Starts Uvicorn ASGI server for FastAPI.';
    } else if (stackNames.has('django')) {
      runCmd = 'python manage.py runserver';
      runTitle = 'Launch Django Server';
      runDesc = 'Starts Django development web server.';
    } else {
      runCmd = `python ${entryPyFile || 'main.py'}`;
      runTitle = 'Launch Python Application';
      runDesc = `Executes Python entry point script (${entryPyFile || 'main.py'}).`;
    }
  } else if (isJavaProject) {
    runCmd = './mvnw spring-boot:run';
    runTitle = 'Launch Spring Boot Server';
  } else if (isNodeProject) {
    runCmd = 'npm run dev';
    runTitle = 'Launch Node Server';
  } else if (stackNames.has('docker')) {
    runCmd = 'docker compose up';
  }

  if (runCmd) {
    steps.push({
      num: steps.length + 1,
      title: runTitle,
      command: runCmd,
      description: runDesc
    });
  }

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

      {/* Auto-Detected Project Manifest & Entry Points Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7), rgba(30, 41, 59, 0.7))',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 'var(--radius-sm)',
        padding: '1.1rem 1.3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎯</span> Auto-Detected Project Manifest & Entry Points:
          </span>
          <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
            ✓ StackDoctor Inspector Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem', marginTop: '0.2rem' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>📄 Primary Entry File:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#facc15', fontFamily: 'monospace' }}>
              {entryPyFile || (isNodeProject ? 'package.json / index.js' : isRustProject ? 'main.rs' : isJavaProject ? 'Application.java' : 'main.py')}
            </span>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>📦 Requirements Manifest:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#a78bfa', fontFamily: 'monospace' }}>
              {isPythonProject ? 'requirements.txt' : isNodeProject ? 'package.json' : isRustProject ? 'Cargo.toml' : isJavaProject ? 'pom.xml' : 'requirements.txt'}
            </span>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>⚡ Primary Framework & AI Stack:</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {stacks.length > 0 ? (
                stacks.slice(0, 4).map((s, idx) => (
                  <span key={idx} style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    {s.name}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Python / FastAPI Stack</span>
              )}
            </div>
          </div>
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
            onClick={() => handleOpenTerminal(fullChainedCommand || 'echo StackDoctor Terminal Active')}
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
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.6))',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-sm)',
        padding: '1.2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔍</span> System Runtimes & Tool Inspector
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
              StackDoctor cross-verifies required runtimes against your local PC environment.
            </p>
          </div>

          <div style={{
            background: missingChecks.length === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${missingChecks.length === 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            borderRadius: '20px',
            padding: '0.35rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: missingChecks.length === 0 ? '#34d399' : '#fbbf24' }}>
              {missingChecks.length === 0 ? '💯 100% SYSTEM COMPATIBLE' : `⚠️ ${missingChecks.length} ACTION REQUIRED`}
            </span>
          </div>
        </div>

        {missingChecks.length === 0 ? (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '8px',
            padding: '0.85rem 1.1rem',
            color: '#34d399',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <span>✨ All required runtimes & tools for this project are verified and active on your computer!</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem' }}>
            {missingChecks.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '0.8rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Required: {item.required} | Status: {item.installed}
                  </div>
                </div>
                {item.fixCmd && (
                  <button
                    onClick={() => handleCopy(item.fixCmd, `fix-${idx}`)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '4px',
                      padding: '0.3rem 0.6rem',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {copiedStep === `fix-${idx}` ? '✓ Copied' : 'Copy Fix'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Local Environment Tool Matrix Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem', marginTop: '0.2rem' }}>
          {[
            { name: 'Python', icon: '🐍', ver: mockEnv?.tools?.python, req: stackNames.has('python') || stackNames.has('fastapi') || stackNames.has('django') || stackNames.has('flask') || !!entryPyFile },
            { name: 'Node.js', icon: '🟢', ver: mockEnv?.tools?.node, req: stackNames.has('javascript') || stackNames.has('typescript') || stackNames.has('node') || stackNames.has('react') },
            { name: 'Git', icon: '🐙', ver: mockEnv?.tools?.git, req: isGitUrl },
            { name: 'Docker', icon: '🐳', ver: mockEnv?.dockerRunning ? (mockEnv?.tools?.docker || 'Active') : null, req: stackNames.has('docker') },
            { name: 'Java JDK', icon: '☕', ver: mockEnv?.tools?.java, req: stackNames.has('java') || stackNames.has('maven') },
            { name: 'Rust Cargo', icon: '🦀', ver: mockEnv?.tools?.rust, req: stackNames.has('rust') }
          ].map((t, i) => {
            const isInstalled = !!t.ver;
            const isRequiredForProj = t.req;

            return (
              <div key={i} style={{
                background: isRequiredForProj
                  ? (isInstalled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)')
                  : 'rgba(0, 0, 0, 0.3)',
                border: `1px solid ${isRequiredForProj ? (isInstalled ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)') : 'var(--border-glass)'}`,
                borderRadius: '8px',
                padding: '0.65rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{t.icon}</span>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', display: 'block' }}>{t.name}</span>
                    <span style={{ fontSize: '0.7rem', color: isInstalled ? '#34d399' : 'var(--text-muted)' }}>
                      {isInstalled ? `v${t.ver}` : 'Not Detected'}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '0.85rem' }}>
                  {isInstalled ? '✅' : isRequiredForProj ? '❌' : '⚪'}
                </span>
              </div>
            );
          })}
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
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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

                  <button
                    onClick={() => handleOpenTerminal(st.command)}
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: '4px',
                      padding: '0.3rem 0.7rem',
                      color: '#34d399',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    🖥️ Run Step
                  </button>
                </div>
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
