import fs from 'fs/promises';
import path from 'path';

const DEFAULT_IGNORE = [
  'node_modules',
  '.git',
  '.github',
  'dist',
  'build',
  'out',
  'bin',
  'obj',
  '.venv',
  'venv',
  'env',
  '__pycache__',
  'target',
  '.gradle',
  '.idea',
  '.vscode',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

/**
 * Scans a folder recursively and returns file names, sizes and paths.
 * @param {string} dirPath The directory path to scan
 * @param {string} [rootPath] The project base folder path for relative names
 * @param {Array<string>} [ignoreList] Excluded folder/file names
 * @returns {Promise<Array<{name: string, path: string, isDirectory: boolean, size: number}>>}
 */
export async function scanRepository(dirPath, rootPath = dirPath, ignoreList = DEFAULT_IGNORE) {
  let results = [];
  try {
    // If fast GitHub fetch created a virtual file-index.json, use it directly
    const indexPath = path.join(dirPath, 'file-index.json');
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const virtualFiles = JSON.parse(indexContent);
      if (Array.isArray(virtualFiles) && virtualFiles.length > 0) {
        return virtualFiles.filter(f => !ignoreList.includes(f.name));
      }
    } catch (e) {
      // index file does not exist, fallback to fs.readdir
    }

    const list = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of list) {
      if (ignoreList.includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        results.push({
          name: entry.name,
          path: relativePath,
          isDirectory: true,
          size: 0
        });
        const subResults = await scanRepository(fullPath, rootPath, ignoreList);
        results = results.concat(subResults);
      } else {
        let size = 0;
        try {
          const stats = await fs.stat(fullPath);
          size = stats.size;
        } catch (e) {
          // ignore stat reading failures
        }
        results.push({
          name: entry.name,
          path: relativePath,
          isDirectory: false,
          size
        });
      }
    }
  } catch (err) {
    console.error(`Error scanning path ${dirPath}:`, err);
  }
  return results;
}
