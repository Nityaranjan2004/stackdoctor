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
  const reqFile = files.find(f => f.path === 'requirements.txt') || files.find(f => f.name === 'requirements.txt' && !f.isDirectory);
  const isPython = reqFile || files.some(f => f.name === 'Pipfile' || f.name === 'pyproject.toml') || files.some(f => f.path.endsWith('.py'));
  
  if (isPython) {
    const relativeSubDir = reqFile && path.dirname(reqFile.path) !== '.' ? path.dirname(reqFile.path).replace(/\\/g, '/') : null;
    stack.push({ 
      name: 'Python', 
      category: 'Language', 
      confidence: 1.0, 
      version: relativeSubDir ? `subfolder:${relativeSubDir}` : null 
    });

    if (reqFile) {
      try {
        const reqsContent = await fs.readFile(path.join(projectPath, reqFile.path), 'utf-8');
        
        if (/django/i.test(reqsContent)) {
          stack.push({ name: 'Django', category: 'Backend Framework', confidence: 1.0, version: null });
        }
        if (/flask/i.test(reqsContent)) {
          stack.push({ name: 'Flask', category: 'Backend Framework', confidence: 1.0, version: null });
        }
        if (/fastapi/i.test(reqsContent)) {
          stack.push({ name: 'FastAPI', category: 'Backend Framework', confidence: 1.0, version: null });
        }
        if (/streamlit/i.test(reqsContent)) {
          stack.push({ name: 'Streamlit', category: 'Frontend Framework', confidence: 1.0, version: null });
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

    // Detect Python entry file from scanned file list
    const pyFiles = files.filter(f => !f.isDirectory && f.name.endsWith('.py'));
    const entryFile = pyFiles.find(f => /main|app|dashboard|server|manage/i.test(f.name)) || pyFiles[0];
    if (entryFile) {
      stack.push({
        name: 'Python Entry Point',
        category: 'Entry File',
        confidence: 1.0,
        version: entryFile.path.replace(/\\/g, '/')
      });
    }
  }

  return stack;
}
