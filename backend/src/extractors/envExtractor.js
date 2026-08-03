import fs from 'fs/promises';
import path from 'path';

/**
 * Scans for env configuration files (committed .env, .env.example, etc.).
 * @param {string} projectPath
 * @param {Array<{name: string, path: string}>} files
 * @returns {Promise<Array<{name: string, path: string, isSecret: boolean}>>}
 */
export async function extractEnv(projectPath, files) {
  const envConfigs = [];
  
  for (const file of files) {
    if (file.name === '.env' || file.name.startsWith('.env.')) {
      const isExample = file.name.includes('example') || file.name.includes('sample') || file.name.includes('template');
      envConfigs.push({
        name: file.name,
        path: file.path,
        isSecret: !isExample
      });
    }
  }

  return envConfigs;
}
