import fs from 'fs/promises';
import path from 'path';

/**
 * Detects Java stack details.
 * @param {string} projectPath
 * @param {Array<{path: string}>} files
 * @returns {Promise<Array<{name: string, category: string, confidence: number, version: string|null}>>}
 */
export async function detectJava(projectPath, files) {
  const stack = [];
  const filePaths = new Set(files.map(f => f.path));

  const isJava = filePaths.has('pom.xml') || filePaths.has('build.gradle') || files.some(f => f.path.endsWith('.java'));
  if (isJava) {
    stack.push({ name: 'Java', category: 'Language', confidence: 1.0, version: null });

    if (filePaths.has('pom.xml')) {
      try {
        const pomContent = await fs.readFile(path.join(projectPath, 'pom.xml'), 'utf-8');
        if (pomContent.includes('spring-boot')) {
          stack.push({ name: 'Spring Boot', category: 'Backend Framework', confidence: 1.0, version: null });
        }
        if (pomContent.includes('hibernate')) {
          stack.push({ name: 'Hibernate', category: 'ORM', confidence: 1.0, version: null });
        }
        if (pomContent.includes('postgresql')) {
          stack.push({ name: 'PostgreSQL', category: 'Database', confidence: 0.8, version: null });
        }
      } catch (e) {
        console.warn('Failed to scan pom.xml for Java detection:', e);
      }
    }
  }

  return stack;
}
