import fs from 'fs/promises';
import path from 'path';

/**
 * Scans for env configuration files and extracts environment KEY names ONLY (never the secret values).
 * 
 * @param {string} projectPath
 * @param {Array<{name: string, path: string, content?: string}>} files
 * @returns {Promise<Array<{name: string, path: string, isSecret: boolean, keys: string[]}>>}
 */
export async function extractEnv(projectPath, files) {
  const envConfigs = [];
  
  for (const file of files) {
    const lowerName = file.name.toLowerCase();
    if (lowerName === '.env' || lowerName.startsWith('.env.')) {
      const isExample = lowerName.includes('example') || lowerName.includes('sample') || lowerName.includes('template');
      const keys = [];

      try {
        let content = file.content;
        if (!content) {
          content = await fs.readFile(path.join(projectPath, file.path), 'utf-8');
        }

        if (content) {
          const lines = content.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const eqIndex = trimmed.indexOf('=');
              if (eqIndex > 0) {
                const keyName = trimmed.substring(0, eqIndex).trim();
                if (keyName && !keys.includes(keyName)) {
                  keys.push(keyName);
                }
              }
            }
          }
        }
      } catch (e) {
        // Ignore read errors
      }

      envConfigs.push({
        name: file.name,
        path: file.path,
        isSecret: !isExample,
        keys
      });
    }
  }

  return envConfigs;
}
