import semver from 'semver';

/**
 * Audit project stack, files, envs and dependencies to report issues.
 * @param {Array} stack Tech stack
 * @param {Array} dependencies Dependencies
 * @param {Array} files Files
 * @param {Array} envs Environment configurations
 * @param {Array} ports Ports
 * @returns {Array<{title: string, description: string, severity: 'info'|'warning'|'error', file: string|null}>}
 */
export function runDiagnostics(stack, dependencies, files, envs, ports) {
  const diagnostics = [];
  const fileNames = new Set(files.map(f => f.path));
  const stackNames = new Set(stack.map(s => s.name.toLowerCase()));
  const depMap = new Map(dependencies.map(d => [d.name, d]));

  const hasFile = (path) => fileNames.has(path);

  // 1. Missing gitignore
  if (!hasFile('.gitignore')) {
    diagnostics.push({
      title: 'Missing .gitignore File',
      description: 'Your project is missing a .gitignore file. Local dependencies, build outputs, or secrets might get committed to git.',
      severity: 'warning',
      file: '.gitignore'
    });
  }

  // 2. Secret exposure
  const committedSecrets = envs.filter(e => e.isSecret);
  for (const secret of committedSecrets) {
    diagnostics.push({
      title: 'Environment Secrets Committed',
      description: `Environment secrets file "${secret.path}" is committed to the repository. This is a severe security risk. Add it to .gitignore.`,
      severity: 'error',
      file: secret.path
    });
  }

  // 3. Node.js stack diagnostics
  if (stackNames.has('javascript') || stackNames.has('typescript')) {
    if (!hasFile('package.json')) {
      diagnostics.push({
        title: 'Missing package.json',
        description: 'JavaScript/TypeScript environment detected but no package.json found at the project root.',
        severity: 'error',
        file: 'package.json'
      });
    }

    if (stackNames.has('react')) {
      if (!hasFile('vite.config.js') && !hasFile('vite.config.ts') && !hasFile('webpack.config.js')) {
        diagnostics.push({
          title: 'React Project without Build Config',
          description: 'React is installed but no Vite or Webpack configuration file was found. Build tooling may be misconfigured.',
          severity: 'warning',
          file: null
        });
      }
    }

    const expressDep = depMap.get('express');
    if (expressDep) {
      try {
        const coerced = semver.coerce(expressDep.version);
        if (coerced && semver.lt(coerced, '4.18.0')) {
          diagnostics.push({
            title: 'Outdated Express Version',
            description: `The project is using Express ${expressDep.version}. Upgrading to at least 4.18.0 is recommended to avoid known security issues and performance bugs.`,
            severity: 'warning',
            file: 'package.json'
          });
        }
      } catch (e) {
        // ignore semver parser errors
      }
    }
  }

  // 4. Docker Compose matching
  if (stackNames.has('docker')) {
    if (hasFile('docker-compose.yml') && !hasFile('Dockerfile')) {
      diagnostics.push({
        title: 'Docker Compose without Dockerfile',
        description: 'Docker Compose configuration exists, but no local Dockerfile is defined at the root. Verify if local services require builds.',
        severity: 'info',
        file: 'docker-compose.yml'
      });
    }
  }

  // 5. Prisma
  if (stackNames.has('prisma') && !hasFile('prisma/schema.prisma') && !hasFile('schema.prisma')) {
    diagnostics.push({
      title: 'Prisma Client Missing Schema',
      description: 'Prisma dependency is defined, but no prisma schema file was found. Run "npx prisma init" to configure Prisma.',
      severity: 'error',
      file: null
    });
  }

  return diagnostics;
}
