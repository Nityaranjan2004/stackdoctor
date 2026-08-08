import React, { useState, useEffect } from 'react';
import ScannerForm from './components/ScannerForm';
import MockEnvSelector from './components/MockEnvSelector';
import HealthScore from './components/HealthScore';
import StackPanel from './components/StackPanel';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import CloneSetupPanel from './components/CloneSetupPanel';
import AiFixModal from './components/AiFixModal';
import CliBanner from './components/CliBanner';
import ChatbotWidget from './components/ChatbotWidget';
import PreCloneInspector from './components/PreCloneInspector';
import { API_BASE_URL } from './config/api';

export default function App() {
  const [projectsList, setProjectsList] = useState([]);
  const [project, setProject] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeDiagnostic, setActiveDiagnostic] = useState(null);
  const [activeTab, setActiveTab] = useState('clone-setup'); // clone-setup, diagnostics, stacks, dependencies
  
  // Simulated developer environment
  const [mockEnv, setMockEnv] = useState({
    os: 'windows',
    tools: {
      node: null,
      java: null,
      go: null,
      rust: null,
      git: null,
      python: null,
      docker: null
    },
    dockerRunning: false,
    occupiedPorts: []
  });

  useEffect(() => {
    fetchSystemTools();
    fetchProjects();
  }, []);

  const fetchSystemTools = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/scan/system-tools`);
      if (res.ok) {
        const sysEnv = await res.json();
        setMockEnv(prev => ({
          ...prev,
          os: sysEnv.os || prev.os,
          tools: sysEnv.tools || prev.tools,
          dockerRunning: sysEnv.dockerRunning ?? prev.dockerRunning
        }));
      }
    } catch (e) {
      console.warn('System tools check unreachable', e);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/scan`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProjectsList(data);
          
          const savedProjectId = localStorage.getItem('stackdoctor_last_project_id');
          let targetProject = data.find(p => p.id === savedProjectId) || data[0];
          
          if (targetProject) {
            selectProject(targetProject.id);
          }
        }
      }
    } catch (e) {
      console.warn('Backend server not reachable.', e);
    }
  };

  const applyProjectDetails = (details) => {
    setProject(details);
    if (details.cliSnapshot) {
      setMockEnv({
        os: details.cliSnapshot.os || 'windows',
        tools: details.cliSnapshot.tools || {},
        dockerRunning: details.cliSnapshot.dockerRunning ?? false,
        occupiedPorts: details.cliSnapshot.occupiedPorts || []
      });
    }
  };

  const selectProject = async (id) => {
    try {
      localStorage.setItem('stackdoctor_last_project_id', id);
      const res = await fetch(`${API_BASE_URL}/api/scan/${id}`);
      const details = await res.json();
      applyProjectDetails(details);
    } catch (e) {
      console.error(e);
    }
  };

  const handleScanStart = async ({ name, path }) => {
    setIsScanning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, path })
      });
      const data = await res.json();
      
      // Update projects list
      fetchProjects();
      
      // Poll details
      pollScanStatus(data.id);
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server. Make sure backend is accessible.');
      setIsScanning(false);
    }
  };

  const pollScanStatus = async (id) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_BASE_URL}/api/scan/${id}`);
        const details = await res.json();
        
        if (details.status === 'completed' || details.status === 'failed' || attempts > 20) {
          clearInterval(interval);
          applyProjectDetails(details);
          setIsScanning(false);
          fetchProjects(); // refresh sidebar list
        }
      } catch (e) {
        clearInterval(interval);
        setIsScanning(false);
      }
    }, 1500);
  };

  // --- DYNAMIC COMPARATIVE RULES ENGINE ---
  const computeDiagnosticsAndScore = () => {
    if (!project) return { diagnostics: [], score: 100 };

    const computed = [];
    try {
      const stackNames = new Set(project.stacks?.map(s => s.name?.toLowerCase()).filter(Boolean) || []);
      
      // 1. Git (Check globally)
      const gitVer = mockEnv?.tools?.git || '2.0.0';
      if (typeof gitVer === 'string' && gitVer.includes('.')) {
        const parts = gitVer.split('.');
        const gitMajor = parseInt(parts[0], 10) || 0;
        const gitMinor = parseInt(parts[1], 10) || 0;
        if (gitMajor < 2 || (gitMajor === 2 && gitMinor < 30)) {
          computed.push({
            title: 'Git Client Outdated',
            description: `Project operations require Git >=2.30. Your computer has Git v${gitVer} installed.`,
            severity: 'warning',
            file: null
          });
        }
      }

      // 2. Node.js Version (Needs >= 22)
      if (stackNames.has('javascript') || stackNames.has('typescript')) {
        const nodeVer = mockEnv?.tools?.node || '20.0.0';
        if (typeof nodeVer === 'string' && nodeVer.includes('.')) {
          const major = parseInt(nodeVer.split('.')[0], 10) || 0;
          if (major < 22) {
            computed.push({
              title: 'Node.js Version Mismatch',
              description: `Project requires Node.js >=22. Your computer has version ${nodeVer} installed.`,
              severity: 'error',
              file: 'package.json'
            });
          }
        }
      }

      // 3. Java Version (Needs 21)
      if (stackNames.has('java') || stackNames.has('spring boot')) {
        const javaVer = mockEnv?.tools?.java ? parseInt(String(mockEnv.tools.java), 10) : 17;
        if (javaVer < 21) {
          computed.push({
            title: 'Java JDK Version Mismatch',
            description: `Project requires JDK 21. Your computer has JDK ${javaVer} installed.`,
            severity: 'error',
            file: 'pom.xml'
          });
        }
      }

      // 4. Go Version (Needs 1.20)
      if (stackNames.has('go') || stackNames.has('go lang')) {
        const goVer = mockEnv?.tools?.go || null;
        if (goVer && typeof goVer === 'string' && goVer.includes('.')) {
          const parts = goVer.split('.');
          const minor = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
          if (minor < 20) {
            computed.push({
              title: 'Go Language Version Mismatch',
              description: `Project requires Go Language >=1.20. Your computer has Go v${goVer} installed.`,
              severity: 'error',
              file: 'go.mod'
            });
          }
        } else {
          computed.push({
            title: 'Go Runtime Missing',
            description: 'Go language is detected in project manifest but Go runtime is not installed on your PC.',
            severity: 'error',
            file: 'go.mod'
          });
        }
      }

      // 5. Rust Version (Needs 1.75)
      if (stackNames.has('rust')) {
        const rustVer = mockEnv?.tools?.rust || null;
        if (rustVer && typeof rustVer === 'string' && rustVer.includes('.')) {
          const parts = rustVer.split('.');
          const minor = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
          if (minor < 75) {
            computed.push({
              title: 'Rust Toolchain Mismatch',
              description: `Project requires Rust compiler >=1.75. Your computer has Rust v${rustVer} installed.`,
              severity: 'error',
              file: 'Cargo.toml'
            });
          }
        } else {
          computed.push({
            title: 'Rust Toolchain Missing',
            description: 'Rust compiler (rustc & cargo) is required for this project but is missing on your PC.',
            severity: 'error',
            file: 'Cargo.toml'
          });
        }
      }

      // 6. Docker Daemon state
      if (stackNames.has('docker') || stackNames.has('docker compose')) {
        if (!mockEnv?.dockerRunning) {
          computed.push({
            title: 'Docker Daemon Offline',
            description: 'Docker requirements are configured, but the Docker Desktop daemon is not running on your computer.',
            severity: 'error',
            file: 'docker-compose.yml'
          });
        }
      }

      // 7. Check occupied Ports ONLY if the project requires/exposes that port
      const projectPorts = new Set(project.dependencies?.filter(d => d.type === 'docker').map(d => 5432) || []);
      if (stackNames.has('express') || stackNames.has('react')) projectPorts.add(5000);
      if (stackNames.has('docker compose') || stackNames.has('postgresql')) projectPorts.add(5432);

      if (mockEnv?.occupiedPorts && Array.isArray(mockEnv.occupiedPorts)) {
        for (const port of mockEnv.occupiedPorts) {
          if (projectPorts.has(port)) {
            computed.push({
              title: `Port Conflict Detected (Port ${port})`,
              description: `Project port ${port} is currently occupied by another process on your computer.`,
              severity: 'warning',
              file: null
            });
          }
        }
      }

      // 8. Missing Environment Variables Checklist
      if (project.envs && Array.isArray(project.envs)) {
        const projectKeys = [];
        project.envs.forEach(envObj => {
          if (envObj?.keys && Array.isArray(envObj.keys)) {
            envObj.keys.forEach(k => {
              if (k && !projectKeys.includes(k)) projectKeys.push(k);
            });
          }
        });

        if (projectKeys.length > 0) {
          projectKeys.forEach(envKey => {
            const hasSecretsWarning = project.diagnostics?.some(d => d?.title?.includes('Secrets') || d?.title?.includes('Environment'));
            if (hasSecretsWarning) {
              computed.push({
                title: `Environment Key Present: ${envKey}`,
                description: `Key "${envKey}" detected in project env template. Ensure key is configured in your local environment.`,
                severity: 'warning',
                file: '.env'
              });
            }
          });
        }
      }

      // Append static diagnostics from backend scanner database
      if (project.diagnostics && Array.isArray(project.diagnostics)) {
        project.diagnostics.forEach(d => {
          if (d && d.title) {
            computed.push({
              title: d.title,
              description: d.description || '',
              severity: d.severity || 'info',
              file: d.file || null
            });
          }
        });
      }
    } catch (err) {
      console.error('Error computing diagnostics:', err);
    }

    // Deduplicate diagnostics by title
    const seenTitles = new Set();
    const uniqueDiagnostics = computed.filter(d => {
      if (seenTitles.has(d.title)) return false;
      seenTitles.add(d.title);
      return true;
    });

    // Score calculation (Accurate weighting)
    let score = 100;
    uniqueDiagnostics.forEach(d => {
      if (d.severity === 'error') score -= 15;
      else if (d.severity === 'warning') score -= 7;
      else if (d.severity === 'info') score -= 2;
    });

    return {
      diagnostics: uniqueDiagnostics,
      score: Math.max(0, score)
    };
  };

  const { diagnostics: activeDiagnostics, score: healthScore } = computeDiagnosticsAndScore();

  return (
    <div className="container">
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-glass)',
        paddingBottom: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.8rem',
            background: 'linear-gradient(135deg, #fff 0%, #9ca3af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            ⚕️ StackDoctor <span style={{
              fontSize: '0.75rem',
              verticalAlign: 'middle',
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              color: '#fff',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              WebkitTextFillColor: 'initial'
            }}>AI EDITION</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            SCAN ──► INSPECT ──► COMPARE ──► DIAGNOSE ──► FIX
          </p>
        </div>
      </header>

      {/* Grid Layout (Sidebar + Main Content) */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.8rem', fontWeight: 600 }}>
              Recent Scans ({projectsList.length})
            </h3>
            
            {projectsList.length === 0 ? (
              <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                No scan history.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                {projectsList.map((p) => (
                  <div
                    key={p.id}
                    className={`sidebar-project-item ${project?.id === p.id ? 'active' : ''}`}
                    onClick={() => selectProject(p.id)}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7 }} title={p.path}>{p.path}</div>
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: p.status === 'completed' ? 'rgba(16,185,129,0.15)' : p.status === 'scanning' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                      color: p.status === 'completed' ? 'var(--color-success)' : p.status === 'scanning' ? 'var(--accent-primary)' : 'var(--color-danger)'
                    }}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Pre-Clone AI Instant Inspector Section */}
          <PreCloneInspector />

          {/* Scanner Input form */}
          <ScannerForm onScanStart={handleScanStart} isScanning={isScanning} selectedProject={project} />

          {project ? (
            <>
              {/* CLI Terminal Command Banner */}
              <CliBanner projectId={project.id} />

              {/* Dashboard Split Widgets */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <HealthScore score={healthScore} diagnostics={activeDiagnostics} />
              </div>

              {/* Detail Tabs */}
              <div className="glass-card">
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.2rem', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    className={`report-tab-btn ${activeTab === 'clone-setup' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clone-setup')}
                  >
                    🚀 Clone & Setup Guide
                  </button>
                  <button
                    className={`report-tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('diagnostics')}
                  >
                    🔍 Diagnostic Checklist ({activeDiagnostics.length})
                  </button>
                  <button
                    className={`report-tab-btn ${activeTab === 'stacks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stacks')}
                  >
                    📦 Technology Profile ({project.stacks?.length || 0})
                  </button>
                  <button
                    className={`report-tab-btn ${activeTab === 'dependencies' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dependencies')}
                  >
                    🔌 Dependencies ({project.dependencies?.length || 0})
                  </button>
                </div>

                {activeTab === 'clone-setup' && (
                  <CloneSetupPanel project={project} mockEnv={mockEnv} />
                )}

                {activeTab === 'diagnostics' && (
                  <DiagnosticsPanel diagnostics={activeDiagnostics} onShowFix={setActiveDiagnostic} />
                )}

                {activeTab === 'stacks' && (
                  <StackPanel stacks={project.stacks || []} />
                )}

                {activeTab === 'dependencies' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {project.dependencies?.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No package dependencies extracted.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.8rem' }}>
                        {project.dependencies?.map((dep) => (
                          <div
                            key={dep.id}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border-glass)',
                              padding: '0.85rem 1rem',
                              borderRadius: '6px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={dep.name}>
                                {dep.name}
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>type: {dep.type}</span>
                            </div>
                            <span style={{
                              fontSize: '0.72rem',
                              fontFamily: 'monospace',
                              background: 'rgba(255,255,255,0.08)',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              color: 'var(--text-secondary)'
                            }}>
                              {dep.version}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
              <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Active Project Selected</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                Paste a workspace path or Git URL above, or select a past project scan from the sidebar to view diagnostics reports.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details AI Remediation popup */}
      {activeDiagnostic && (
        <AiFixModal
          diagnostic={activeDiagnostic}
          onClose={() => setActiveDiagnostic(null)}
        />
      )}

      {/* Floating StackDoctor AI Chatbot */}
      <ChatbotWidget project={project} mockEnv={mockEnv} />
    </div>
  );
}
