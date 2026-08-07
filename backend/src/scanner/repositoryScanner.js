import fs from 'fs/promises';
import path from 'path';

// Only ignore heavy binary/package install directories from traversal, NEVER ignore lockfiles or config files!
const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'bin',
  'obj',
  '.venv',
  'venv',
  '__pycache__',
  'target',
  '.gradle',
  '.idea',
  '.vscode'
]);

/**
 * Optimized & Accurate Repository Scanner.
 * Performs parallel async directory traversal and populates file contents for key config files.
 * 
 * @param {string} dirPath Absolute target directory path
 * @param {string} [rootPath] Project root path
 * @returns {Promise<Array<{name: string, path: string, isDirectory: boolean, size: number, content?: string}>>}
 */
export async function scanRepository(dirPath, rootPath = dirPath) {
  let results = [];
  try {
    // 1. If fast GitHub fetch created a virtual file-index.json, use it directly
    const indexPath = path.join(dirPath, 'file-index.json');
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const virtualFiles = JSON.parse(indexContent);
      if (Array.isArray(virtualFiles) && virtualFiles.length > 0) {
        return virtualFiles.filter(f => !DEFAULT_IGNORE_DIRS.has(f.name));
      }
    } catch (e) {
      // index file does not exist, fallback to fast fs scanning
    }

    // 2. Parallel directory reading
    const list = await fs.readdir(dirPath, { withFileTypes: true });

    const entries = await Promise.all(
      list.map(async (entry) => {
        if (DEFAULT_IGNORE_DIRS.has(entry.name)) {
          return [];
        }

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          const dirResult = {
            name: entry.name,
            path: relativePath,
            isDirectory: true,
            size: 0
          };
          const subResults = await scanRepository(fullPath, rootPath);
          return [dirResult, ...subResults];
        } else {
          let size = 0;
          let content = null;
          try {
            const stats = await fs.stat(fullPath);
            size = stats.size;

            // Pre-read content for configuration & manifest files (under 100KB) for maximum accuracy
            const lowerName = entry.name.toLowerCase();
            const isConfigFile = (
              lowerName === 'package.json' ||
              lowerName === 'requirements.txt' ||
              lowerName === 'pyproject.toml' ||
              lowerName === 'pipfile' ||
              lowerName === 'go.mod' ||
              lowerName === 'cargo.toml' ||
              lowerName === 'docker-compose.yml' ||
              lowerName === 'docker-compose.yaml' ||
              lowerName === 'dockerfile' ||
              lowerName === '.gitignore' ||
              lowerName.endsWith('.md') ||
              lowerName.startsWith('.env')
            );

            if (isConfigFile && size < 100000) {
              content = await fs.readFile(fullPath, 'utf-8');
            }
          } catch (e) {
            // Ignore stat/read errors
          }

          return [{
            name: entry.name,
            path: relativePath,
            isDirectory: false,
            size,
            ...(content ? { content } : {})
          }];
        }
      })
    );

    results = entries.flat();
  } catch (err) {
    console.error(`Error scanning path ${dirPath}:`, err);
  }

  return results;
}
