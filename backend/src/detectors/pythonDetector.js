import fs from 'fs/promises';
import path from 'path';

/**
 * Detects Python stack details.
 * @param {string} projectPath
 * @param {Array<{path: string}>} files
 * @returns {Promise<Array<{name: string, category: string, confidence: number, version: string|null}>>}
 */
export async function detectPython(projectPath, files) {
  const stack = [];
  const filePaths = new Set(files.map(f => f.path));

  const isPython = filePaths.has('requirements.txt') || filePaths.has('Pipfile') || filePaths.has('pyproject.toml') || files.some(f => f.path.endsWith('.py'));
  if (isPython) {
    stack.push({ name: 'Python', category: 'Language', confidence: 1.0, version: null });

    if (filePaths.has('requirements.txt')) {
      try {
        const reqsContent = await fs.readFile(path.join(projectPath, 'requirements.txt'), 'utf-8');
        
        if (/django/i.test(reqsContent)) {
          stack.push({ name: 'Django', category: 'Backend Framework', confidence: 1.0, version: null });
        }
        if (/flask/i.test(reqsContent)) {
          stack.push({ name: 'Flask', category: 'Backend Framework', confidence: 1.0, version: null });
        }
        if (/fastapi/i.test(reqsContent)) {
          stack.push({ name: 'FastAPI', category: 'Backend Framework', confidence: 1.0, version: null });
        }
        if (/sqlalchemy/i.test(reqsContent)) {
          stack.push({ name: 'SQLAlchemy', category: 'ORM', confidence: 1.0, version: null });
        }
        if (/psycopg2|postgres/i.test(reqsContent)) {
          stack.push({ name: 'PostgreSQL', category: 'Database', confidence: 0.8, version: null });
        }
      } catch (e) {
        console.warn('Failed to parse requirements.txt for Python detection:', e);
      }
    }
  }

  return stack;
}
