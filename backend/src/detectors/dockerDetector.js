/**
 * Detects Docker stack details.
 * @param {string} projectPath
 * @param {Array<{name: string, path: string}>} files
 * @returns {Promise<Array<{name: string, category: string, confidence: number, version: string|null}>>}
 */
export async function detectDocker(projectPath, files) {
  const stack = [];
  const filePaths = new Set(files.map(f => f.path));

  if (filePaths.has('Dockerfile') || files.some(f => f.name === 'Dockerfile' || f.name.startsWith('Dockerfile.'))) {
    stack.push({ name: 'Docker', category: 'Infrastructure', confidence: 1.0, version: null });
  }

  if (filePaths.has('docker-compose.yml') || filePaths.has('docker-compose.yaml')) {
    stack.push({ name: 'Docker Compose', category: 'Infrastructure', confidence: 1.0, version: null });
  }

  return stack;
}
