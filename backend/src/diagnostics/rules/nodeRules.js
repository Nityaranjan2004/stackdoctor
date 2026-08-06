import semver from 'semver';

/**
 * Node.js & JavaScript Ecosystem Diagnostic Rules
 */
export function runNodeRules(stackNames, dependencies, files) {
  const diagnostics = [];
  const fileNames = new Set(files.map(f => f.path.toLowerCase()));
  const depMap = new Map(dependencies.map(d => [d.name.toLowerCase(), d]));

  const isNodeProject = stackNames.has('javascript') || stackNames.has('typescript') || fileNames.has('package.json');

  if (!isNodeProject) return diagnostics;

  // NODE-01: Missing package.json
  if (!fileNames.has('package.json')) {
    diagnostics.push({
      id: 'NODE-01',
      title: 'Missing package.json',
      description: 'JavaScript/TypeScript environment detected but no package.json found at the project root.',
      severity: 'error',
      category: 'Node.js',
      file: 'package.json'
    });
  }

  // NODE-02: Missing lockfile
  const hasLockfile = fileNames.has('package-lock.json') || fileNames.has('yarn.lock') || fileNames.has('pnpm-lock.yaml') || fileNames.has('bun.lockb');
  if (!hasLockfile) {
    diagnostics.push({
      id: 'NODE-02',
      title: 'Missing Package Lockfile',
      description: 'No lockfile (package-lock.json, yarn.lock, pnpm-lock.yaml) found. Dependency versions might drift across environments.',
      severity: 'warning',
      category: 'Node.js',
      file: 'package-lock.json'
    });
  }

  // NODE-03: Conflicting lockfiles
  const lockfileCount = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'].filter(f => fileNames.has(f)).length;
  if (lockfileCount > 1) {
    diagnostics.push({
      id: 'NODE-03',
      title: 'Conflicting Lockfiles Detected',
      description: 'Multiple package manager lockfiles detected (e.g. yarn.lock & package-lock.json). Stick to a single package manager.',
      severity: 'warning',
      category: 'Node.js',
      file: null
    });
  }

  // NODE-04: React bundler config check
  if (stackNames.has('react')) {
    const hasBundler = fileNames.has('vite.config.js') || fileNames.has('vite.config.ts') || fileNames.has('webpack.config.js') || fileNames.has('next.config.js') || fileNames.has('craco.config.js');
    if (!hasBundler) {
      diagnostics.push({
        id: 'NODE-04',
        title: 'React Project without Bundler Config',
        description: 'React is installed but no Vite, Next.js, or Webpack configuration file was found at root.',
        severity: 'warning',
        category: 'Node.js',
        file: null
      });
    }
  }

  // NODE-05: Outdated Express version
  const expressDep = depMap.get('express');
  if (expressDep) {
    try {
      const coerced = semver.coerce(expressDep.version);
      if (coerced && semver.lt(coerced, '4.18.0')) {
        diagnostics.push({
          id: 'NODE-05',
          title: 'Outdated Express Framework Version',
          description: `Project uses Express ${expressDep.version}. Upgrade to at least v4.18.0+ to prevent security vulnerabilities.`,
          severity: 'warning',
          category: 'Node.js',
          file: 'package.json'
        });
      }
    } catch (e) {
      // ignore semver parser errors
    }
  }

  // NODE-06: TypeScript missing @types or typescript dependency
  if (stackNames.has('typescript')) {
    const hasTSConfig = fileNames.has('tsconfig.json');
    if (!hasTSConfig) {
      diagnostics.push({
        id: 'NODE-06',
        title: 'TypeScript Project Missing tsconfig.json',
        description: 'TypeScript code detected but no tsconfig.json configuration file exists at project root.',
        severity: 'warning',
        category: 'TypeScript',
        file: 'tsconfig.json'
      });
    }
  }

  // NODE-07: Deprecated ORM / Library checks
  if (depMap.has('request')) {
    diagnostics.push({
      id: 'NODE-07',
      title: 'Deprecated Library Detected (request)',
      description: 'The "request" HTTP library is officially deprecated. Consider replacing it with axios, node-fetch, or native fetch.',
      severity: 'warning',
      category: 'Node.js',
      file: 'package.json'
    });
  }

  // NODE-08: Production devDependencies leak check
  if (depMap.has('nodemon') && !dependencies.find(d => d.name === 'nodemon')?.isDev) {
    diagnostics.push({
      id: 'NODE-08',
      title: 'Dev Tooling in Production Dependencies',
      description: 'Development packages like "nodemon" should be listed under devDependencies rather than dependencies.',
      severity: 'info',
      category: 'Node.js',
      file: 'package.json'
    });
  }

  return diagnostics;
}
