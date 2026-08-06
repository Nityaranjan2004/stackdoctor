/**
 * DevOps, Docker & CI/CD Diagnostic Rules
 */
export function runDevopsRules(stackNames, files) {
  const diagnostics = [];
  const fileNames = new Set(files.map(f => f.path.toLowerCase()));

  // OPS-01: Docker Compose without Dockerfile
  if (fileNames.has('docker-compose.yml') || fileNames.has('docker-compose.yaml')) {
    if (!fileNames.has('dockerfile') && !fileNames.has('dockerfile.dev')) {
      diagnostics.push({
        id: 'OPS-01',
        title: 'Docker Compose without Dockerfile',
        description: 'Docker Compose configuration exists, but no local Dockerfile is defined at root. Verify if custom service builds are needed.',
        severity: 'info',
        category: 'DevOps',
        file: 'docker-compose.yml'
      });
    }
  }

  // OPS-02: Dockerfile without .dockerignore
  if (fileNames.has('dockerfile') && !fileNames.has('.dockerignore')) {
    diagnostics.push({
      id: 'OPS-02',
      title: 'Dockerfile Missing .dockerignore',
      description: 'Container image build has no .dockerignore file. Local node_modules, secrets, or git data might pollute Docker context.',
      severity: 'warning',
      category: 'DevOps',
      file: '.dockerignore'
    });
  }

  // OPS-03: Missing CI/CD pipeline
  const hasCI = Array.from(fileNames).some(f => f.startsWith('.github/workflows/') || f === '.gitlab-ci.yml' || f === 'jenkinsfile' || f === 'azure-pipelines.yml' || f === '.circleci/config.yml');
  if (!hasCI) {
    diagnostics.push({
      id: 'OPS-03',
      title: 'Missing CI/CD Workflow Pipeline',
      description: 'No automated testing or deployment pipeline (GitHub Actions, GitLab CI) found. Automated checks improve release stability.',
      severity: 'info',
      category: 'DevOps',
      file: '.github/workflows'
    });
  }

  // OPS-04: Prisma schema missing
  if (stackNames.has('prisma')) {
    const hasSchema = fileNames.has('prisma/schema.prisma') || fileNames.has('schema.prisma');
    if (!hasSchema) {
      diagnostics.push({
        id: 'OPS-04',
        title: 'Prisma Client Missing Schema',
        description: 'Prisma dependency detected, but no schema.prisma file was found. Run "npx prisma init" to set up schema.',
        severity: 'error',
        category: 'Database',
        file: 'prisma/schema.prisma'
      });
    }
  }

  // OPS-05: Missing Kubernetes / Deployment config check
  if (fileNames.has('k8s') || fileNames.has('helm')) {
    if (!fileNames.has('values.yaml') && !fileNames.has('deployment.yaml')) {
      diagnostics.push({
        id: 'OPS-05',
        title: 'Incomplete Kubernetes Configuration',
        description: 'Kubernetes folder detected but missing core deployment.yaml or values.yaml manifests.',
        severity: 'warning',
        category: 'DevOps',
        file: null
      });
    }
  }

  return diagnostics;
}
