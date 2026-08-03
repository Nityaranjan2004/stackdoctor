import fs from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import YAML from 'yaml';

/**
 * Extracts dependencies and package requirements.
 * @param {string} projectPath
 * @param {Array<{name: string, path: string}>} files
 * @returns {Promise<Array<{name: string, version: string, type: string}>>}
 */
export async function extractServices(projectPath, files) {
  const dependencies = [];
  const filePaths = new Set(files.map(f => f.path));

  // 1. package.json
  if (filePaths.has('package.json')) {
    try {
      const content = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(content);
      const add = (deps, type) => {
        if (!deps) return;
        for (const [name, version] of Object.entries(deps)) {
          dependencies.push({ name, version: String(version), type: 'npm' });
        }
      };
      add(pkg.dependencies, 'npm');
      add(pkg.devDependencies, 'npm');
    } catch (e) {
      console.warn('Error extracting npm dependencies:', e);
    }
  }

  // 2. requirements.txt
  if (filePaths.has('requirements.txt')) {
    try {
      const content = await fs.readFile(path.join(projectPath, 'requirements.txt'), 'utf-8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-r')) continue;
        const match = trimmed.match(/^([a-zA-Z0-9_\-\[\]]+)(?:==|>=|<=|!=|>|<|~=|@)\s*(.+)$/);
        if (match) {
          dependencies.push({ name: match[1].trim(), version: match[2].trim(), type: 'pip' });
        } else {
          dependencies.push({ name: trimmed, version: 'latest', type: 'pip' });
        }
      }
    } catch (e) {
      console.warn('Error extracting Python dependencies:', e);
    }
  }

  // 3. pom.xml
  if (filePaths.has('pom.xml')) {
    try {
      const content = await fs.readFile(path.join(projectPath, 'pom.xml'), 'utf-8');
      const parser = new XMLParser();
      const jsonObj = parser.parse(content);
      const project = jsonObj.project;
      if (project && project.dependencies && project.dependencies.dependency) {
        let deps = project.dependencies.dependency;
        if (!Array.isArray(deps)) deps = [deps];
        for (const dep of deps) {
          dependencies.push({
            name: `${dep.groupId}:${dep.artifactId}`,
            version: dep.version ? String(dep.version) : 'managed',
            type: 'maven'
          });
        }
      }
    } catch (e) {
      console.warn('Error extracting Maven dependencies:', e);
    }
  }

  // 4. Docker Compose YAML
  const composeFiles = files.filter(f => f.name === 'docker-compose.yml' || f.name === 'docker-compose.yaml');
  for (const docFile of composeFiles) {
    try {
      const content = await fs.readFile(path.join(projectPath, docFile.path), 'utf-8');
      const parsed = YAML.parse(content);
      if (parsed && parsed.services) {
        for (const [sName, sConf] of Object.entries(parsed.services)) {
          if (sConf.image) {
            const parts = sConf.image.split(':');
            dependencies.push({
              name: `docker-image:${parts[0]}`,
              version: parts[1] || 'latest',
              type: 'docker'
            });
          }
        }
      }
    } catch (e) {
      console.warn(`Error extracting Docker services from ${docFile.path}:`, e);
    }
  }

  return dependencies;
}
