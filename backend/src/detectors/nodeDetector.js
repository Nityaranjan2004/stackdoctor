import fs from 'fs/promises';
import path from 'path';

/**
 * Detects Node/JS/TS stack details.
 * @param {string} projectPath Absolute path
 * @param {Array<{path: string}>} files File list
 * @returns {Promise<Array<{name: string, category: string, confidence: number, version: string|null}>>}
 */
export async function detectNode(projectPath, files) {
  const stack = [];
  
  // Find package.json in root or subfolder (prefer root package.json if present)
  let packageFile = files.find(f => f.path === 'package.json') || files.find(f => f.name === 'package.json' && !f.isDirectory);

  if (packageFile) {
    const relativeSubDir = path.dirname(packageFile.path) === '.' ? '' : path.dirname(packageFile.path).replace(/\\/g, '/');
    
    stack.push({ 
      name: 'JavaScript', 
      category: 'Language', 
      confidence: 1.0, 
      version: relativeSubDir ? `subfolder:${relativeSubDir}` : null 
    });
    
    if (files.some(f => f.name === 'tsconfig.json') || files.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'))) {
      stack.push({ name: 'TypeScript', category: 'Language', confidence: 1.0, version: null });
    }

    try {
      const packageJsonPath = path.join(projectPath, packageFile.path);
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(packageJsonContent);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Frontends
      if (allDeps['react']) stack.push({ name: 'React', category: 'Frontend Framework', confidence: 1.0, version: allDeps['react'] });
      if (allDeps['vue']) stack.push({ name: 'Vue', category: 'Frontend Framework', confidence: 1.0, version: allDeps['vue'] });
      if (allDeps['@angular/core']) stack.push({ name: 'Angular', category: 'Frontend Framework', confidence: 1.0, version: allDeps['@angular/core'] });
      if (allDeps['svelte']) stack.push({ name: 'Svelte', category: 'Frontend Framework', confidence: 1.0, version: allDeps['svelte'] });
      if (allDeps['next']) stack.push({ name: 'Next.js', category: 'Fullstack Framework', confidence: 1.0, version: allDeps['next'] });

      // Backends
      if (allDeps['express']) stack.push({ name: 'Express', category: 'Backend Framework', confidence: 1.0, version: allDeps['express'] });
      if (allDeps['@nestjs/core']) stack.push({ name: 'NestJS', category: 'Backend Framework', confidence: 1.0, version: allDeps['@nestjs/core'] });

      // ORM & Database Inferences
      if (allDeps['prisma']) stack.push({ name: 'Prisma', category: 'ORM', confidence: 1.0, version: allDeps['prisma'] });
      if (allDeps['mongoose']) stack.push({ name: 'Mongoose', category: 'ORM', confidence: 1.0, version: allDeps['mongoose'] });
      if (allDeps['sequelize']) stack.push({ name: 'Sequelize', category: 'ORM', confidence: 1.0, version: allDeps['sequelize'] });

      if (allDeps['pg'] || allDeps['postgres']) stack.push({ name: 'PostgreSQL', category: 'Database', confidence: 0.8, version: null });
      if (allDeps['mysql'] || allDeps['mysql2']) stack.push({ name: 'MySQL', category: 'Database', confidence: 0.8, version: null });
      if (allDeps['mongodb']) stack.push({ name: 'MongoDB', category: 'Database', confidence: 0.8, version: null });
      
      // Build tool
      if (allDeps['vite']) stack.push({ name: 'Vite', category: 'Build Tool', confidence: 1.0, version: allDeps['vite'] });

    } catch (e) {
      console.warn('Failed to parse package.json for Node detection:', e);
    }
  }

  return stack;
}
