/**
 * Security & Workspace Hygiene Diagnostic Rules
 */
export function runSecurityRules(stackNames, files, envs) {
  const diagnostics = [];
  const fileNames = new Set(files.map(f => f.path.toLowerCase()));
  const rawFileNamesList = files.map(f => f.path);

  // SEC-01: Environment secrets file committed to Git
  const sensitiveFiles = ['.env', '.env.local', '.env.production', '.env.staging', 'id_rsa', 'credentials.json'];
  for (const sf of sensitiveFiles) {
    if (fileNames.has(sf)) {
      diagnostics.push({
        id: 'SEC-01',
        title: `Sensitive File Committed (${sf})`,
        description: `File "${sf}" is committed directly into git tracking. Secrets or sensitive environment variables may be exposed.`,
        severity: 'error',
        category: 'Security',
        file: sf
      });
    }
  }

  // SEC-02: Missing .gitignore file
  if (!fileNames.has('.gitignore')) {
    diagnostics.push({
      id: 'SEC-02',
      title: 'Missing .gitignore File',
      description: 'Your project is missing a .gitignore file. Local dependencies, build outputs, or secrets might get committed to git.',
      severity: 'warning',
      category: 'Security',
      file: '.gitignore'
    });
  }

  // SEC-03: Missing .env.example when environment variables are detected
  const hasEnvConfig = envs && envs.length > 0;
  if (hasEnvConfig && !fileNames.has('.env.example') && !fileNames.has('.env.template')) {
    diagnostics.push({
      id: 'SEC-03',
      title: 'Missing .env.example Template',
      description: 'Environment variables are detected but no .env.example or .env.template file was found to guide new developers.',
      severity: 'warning',
      category: 'Security',
      file: '.env.example'
    });
  }

  // SEC-04: node_modules or build target committed to git
  const committedArtifacts = ['node_modules', 'vendor', 'target', 'dist', 'build', '.venv'];
  for (const artifact of committedArtifacts) {
    if (rawFileNamesList.some(p => p.startsWith(`${artifact}/`) || p === artifact)) {
      diagnostics.push({
        id: 'SEC-04',
        title: `Build Artifact Committed (${artifact})`,
        description: `Build artifact directory "${artifact}" is checked into git. Add it to .gitignore to keep repository lightweight.`,
        severity: 'warning',
        category: 'Hygiene',
        file: artifact
      });
      break;
    }
  }

  // SEC-05: Committed secret variables check
  const committedSecrets = (envs || []).filter(e => e.isSecret);
  for (const secret of committedSecrets) {
    diagnostics.push({
      id: 'SEC-05',
      title: 'Exposed Secret Variable',
      description: `Environment secret variable in "${secret.path}" is committed to repository. Add sensitive env files to .gitignore.`,
      severity: 'error',
      category: 'Security',
      file: secret.path
    });
  }

  return diagnostics;
}

export function runDocRules(files) {
  const diagnostics = [];
  const fileNames = new Set(files.map(f => f.path.toLowerCase()));

  // DOC-01: Missing README.md
  const hasReadme = Array.from(fileNames).some(f => f.startsWith('readme'));
  if (!hasReadme) {
    diagnostics.push({
      id: 'DOC-01',
      title: 'Missing README File',
      description: 'Project is missing a README.md file. Add documentation for installation and usage instructions.',
      severity: 'warning',
      category: 'Documentation',
      file: 'README.md'
    });
  }

  // DOC-02: Missing Open Source License
  const hasLicense = Array.from(fileNames).some(f => f.includes('license'));
  if (!hasLicense) {
    diagnostics.push({
      id: 'DOC-02',
      title: 'Missing LICENSE File',
      description: 'No LICENSE file detected. Consider adding an open source license (e.g. MIT, Apache-2.0) or proprietary notice.',
      severity: 'info',
      category: 'Documentation',
      file: 'LICENSE'
    });
  }

  // DOC-03: Missing Contributing guide
  if (!fileNames.has('contributing.md')) {
    diagnostics.push({
      id: 'DOC-03',
      title: 'Missing CONTRIBUTING Guide',
      description: 'Project has no CONTRIBUTING.md file detailing contribution guidelines for collaborators.',
      severity: 'info',
      category: 'Documentation',
      file: 'CONTRIBUTING.md'
    });
  }

  // DOC-04: Missing GitHub issue templates
  const hasTemplates = Array.from(fileNames).some(f => f.includes('.github/issue_template') || f.includes('.github/pull_request_template'));
  if (!hasTemplates) {
    diagnostics.push({
      id: 'DOC-04',
      title: 'Missing GitHub Templates',
      description: 'No issue or PR templates found under .github/. Adding templates streamlines bug reports and feature requests.',
      severity: 'info',
      category: 'Documentation',
      file: '.github/ISSUE_TEMPLATE'
    });
  }

  return diagnostics;
}
