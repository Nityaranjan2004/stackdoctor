import path from 'path';

/**
 * Fallback detector that inspects file extensions if no package manifests exist.
 * @param {Array<{name: string, path: string}>} files List of files in workspace
 * @returns {Array<{name: string, category: string, confidence: number}>}
 */
export function detectLanguageByExtension(files = []) {
  const stacks = [];
  const extSet = new Set(files.map(f => path.extname(f.path || f.name || '').toLowerCase()));
  const filenameSet = new Set(files.map(f => path.basename(f.path || f.name || '').toLowerCase()));

  if (extSet.has('.js') || extSet.has('.jsx') || extSet.has('.ts') || extSet.has('.tsx') || extSet.has('.mjs')) {
    stacks.push({ name: 'JavaScript', category: 'Language', confidence: 1.0 });
  }

  if (extSet.has('.py')) {
    stacks.push({ name: 'Python', category: 'Language', confidence: 1.0 });
  }

  if (extSet.has('.java')) {
    stacks.push({ name: 'Java', category: 'Language', confidence: 1.0 });
  }

  if (extSet.has('.go')) {
    stacks.push({ name: 'Go', category: 'Language', confidence: 1.0 });
  }

  if (extSet.has('.rs')) {
    stacks.push({ name: 'Rust', category: 'Language', confidence: 1.0 });
  }

  if (extSet.has('.html') || extSet.has('.css')) {
    stacks.push({ name: 'HTML / CSS', category: 'Frontend Framework', confidence: 0.9 });
  }

  if (filenameSet.has('manifest.json')) {
    stacks.push({ name: 'Web Extension / PWA', category: 'Frontend Framework', confidence: 1.0 });
  }

  if (extSet.has('.bat') || extSet.has('.cmd') || extSet.has('.ps1') || extSet.has('.sh')) {
    stacks.push({ name: 'Shell / Batch Script', category: 'Language', confidence: 1.0 });
  }

  if (filenameSet.has('dockerfile') || filenameSet.has('docker-compose.yml') || filenameSet.has('docker-compose.yaml')) {
    stacks.push({ name: 'Docker', category: 'Infrastructure', confidence: 1.0 });
  }

  return stacks;
}
