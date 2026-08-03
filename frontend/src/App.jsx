import React, { useState, useEffect } from 'react';
import ScannerForm from './components/ScannerForm';
import MockEnvSelector from './components/MockEnvSelector';
import HealthScore from './components/HealthScore';
import StackPanel from './components/StackPanel';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import AiFixModal from './components/AiFixModal';

export default function App() {
  const [projectsList, setProjectsList] = useState([]);
  const [project, setProject] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeDiagnostic, setActiveDiagnostic] = useState(null);
  const [activeTab, setActiveTab] = useState('diagnostics'); // diagnostics, stacks, dependencies
  
  // Simulated developer environment
  const [mockEnv, setMockEnv] = useState({
    os: 'windows',
    tools: {
      node: '20.19.0',
      java: '17',
      go: '1.18.0',
      rust: '1.72.0',
      git: '2.25.0',
      python: '3.12',
      docker: '27.1'
    },
    dockerRunning: false,
    occupiedPorts: [8080]
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/scan');
      const data = await res.json();
      setProjectsList(data);
      if (data.length > 0 && !project) {
        selectProject(data[0].id);
      }
    } catch (e) {
      console.warn('Backend server not reachable.');
    }
  };

  const selectProject = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/scan/${id}`);
      const details = await res.json();
      setProject(details);
    } catch (e) {
      console.error(e);
    }
  };

  const handleScanStart = async ({ name, path }) => {
    setIsScanning(true);
    try {
      const res = await fetch('http://localhost:5000/api/scan', {
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
      alert('Error connecting to backend server. Make sure it is running on port 5000.');
      setIsScanning(false);
    }
  };

  const pollScanStatus = async (id) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`http://localhost:5000/api/scan/${id}`);
        const details = await res.json();
        
        if (details.status === 'completed' || details.status === 'failed' || attempts > 20) {
          clearInterval(interval);
          setProject(details);
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
    const stackNames = new Set(project.stacks?.map(s => s.name.toLowerCase()) || []);
    
    // 1. Git (Check globally)
    const gitVer = mockEnv.tools?.git || '2.0.0';
    const gitMajor = parseInt(gitVer.split('.')[0], 10);
    const gitMinor = parseInt(gitVer.split('.')[1], 10);
    if (gitMajor < 2 || (gitMajor === 2 && gitMinor < 30)) {
      computed.push({
        title: 'Git Client Outdated',
        description: `Project operations require Git >=2.30. Your computer has Git v${gitVer} installed.`,
        severity: 'warning',
        file: null
      });
    }

    // 2. Node.js Version (Needs >= 22)
    if (stackNames.has('javascript') || stackNames.has('typescript')) {
      const nodeVer = mockEnv.tools?.node || '20.0.0';
      const major = parseInt(nodeVer.split('.')[0], 10);
      if (major < 22) {
        computed.push({
          title: 'Node.js Version Mismatch',
          description: `Project requires Node.js >=22. Your computer has version ${nodeVer} installed.`,
          severity: 'error',
          file: 'package.json'
        });
      }
    }

    // 3. Java Version (Needs 21)
    if (stackNames.has('java') || stackNames.has('spring boot')) {
      const javaVer = parseInt(mockEnv.tools?.java || '17', 10);
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
      const goVer = mockEnv.tools?.go || '1.16.0';
      const minor = parseInt(goVer.split('.')[1], 10);
      if (minor < 20) {
        computed.push({
          title: 'Go Language Version Mismatch',
          description: `Project requires Go Language >=1.20. Your computer has Go v${goVer} installed.`,
          severity: 'error',
          file: 'go.mod'
        });
      }
    }

    // 5. Rust Version (Needs 1.75)
    if (stackNames.has('rust')) {
      const rustVer = mockEnv.tools?.rust || '1.60.0';
      const minor = parseInt(rustVer.split('.')[1], 10);
      if (minor < 75) {
        computed.push({
          title: 'Rust Toolchain Mismatch',
          description: `Project requires Rust compiler >=1.75. Your computer has Rust v${rustVer} installed.`,
          severity: 'error',
          file: 'Cargo.toml'
        });
      }
    }

    // 6. Docker Daemon state
    if (stackNames.has('docker') || stackNames.has('docker compose')) {
      if (!mockEnv.dockerRunning) {
        computed.push({
          title: 'Docker Daemon Offline',
          description: 'Docker requirements are configured, but the Docker Desktop daemon is not running on your computer.',
          severity: 'error',
          file: 'docker-compose.yml'
        });
      }
    }

    // 7. Check occupied Ports
    if (mockEnv.occupiedPorts && mockEnv.occupiedPorts.length > 0) {
      for (const port of mockEnv.occupiedPorts) {
        computed.push({
          title: `Port Conflict Detected (Port ${port})`,
          description: `Local port ${port} is currently occupied by another process. This blocks the repository web server.`,
          severity: 'warning',
          file: null
        });
      }
    }

    // 8. Missing Environment Variables Checklist
    // We mock check if environment variables like DATABASE_URL or JWT_SECRET are set
    // (Usually set in .env. We simulate that we need it, and if it is in backend/.env, check if it's there)
    const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET'];
    requiredEnvs.forEach(envKey => {
      // Check if backend/.env warning exists or database connection is offline
      const hasSecretsWarning = project.diagnostics?.some(d => d.title.includes('Secrets') || d.title.includes('Environment'));
      if (hasSecretsWarning && envKey === 'DATABASE_URL') {
        computed.push({
          title: `Missing Environment Key: ${envKey}`,
          description: `The required variable ${envKey} is missing or has not been configured in your local environment.`,
          severity: 'warning',
          file: '.env'
        });
      }
    });

    // Append static diagnostics from backend scanner database
    if (project.diagnostics && project.diagnostics.length > 0) {
      project.diagnostics.forEach(d => {
        computed.push({
          title: d.title,
          description: d.description,
          severity: d.severity,
          file: d.file
        });
      });
    }

    // Deduplicate diagnostics by title
    const seenTitles = new Set();
    const uniqueDiagnostics = computed.filter(d => {
      if (seenTitles.has(d.title)) return false;
      seenTitles.add(d.title);
      return true;
    });

    // Score calculation
    let score = 100;
    uniqueDiagnostics.forEach(d => {
      if (d.severity === 'error') score -= 20;
      else if (d.severity === 'warning') score -= 10;
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
          {/* Scanner Input form */}
          <ScannerForm onScanStart={handleScanStart} isScanning={isScanning} selectedProject={project} />

          {project ? (
            <>
              {/* Dashboard Split Widgets */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                <HealthScore score={healthScore} />
                <MockEnvSelector currentEnv={mockEnv} onChange={setMockEnv} />
              </div>

              {/* Detail Tabs */}
              <div className="glass-card">
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.2rem' }}>
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
    </div>
  );
}
