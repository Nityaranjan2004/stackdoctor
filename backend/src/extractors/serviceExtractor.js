import fs from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import YAML from 'yaml';

/**
 * Extracts dependencies and package requirements across multiple ecosystems.
 * Reuses pre-loaded file content from scanner for maximum I/O performance.
 * 
 * @param {string} projectPath Absolute path to project
 * @param {Array<{name: string, path: string, content?: string}>} files
 * @returns {Promise<Array<{name: string, version: string, type: string, isDev?: boolean}>>}
 */
export async function extractServices(projectPath, files) {
  const dependencies = [];
  const fileMap = new Map(files.map(f => [f.path.toLowerCase(), f]));

  const getFileContent = async (relativePath) => {
    const item = fileMap.get(relativePath.toLowerCase());
    if (!item) return null;
    if (item.content) return item.content;
    try {
      return await fs.readFile(path.join(projectPath, item.path), 'utf-8');
    } catch (e) {
      return null;
    }
  };

  // 1. package.json (Node.js)
  const pkgContent = await getFileContent('package.json');
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          dependencies.push({ name, version: String(version), type: 'npm', isDev: false });
        }
      }
      if (pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          dependencies.push({ name, version: String(version), type: 'npm', isDev: true });
        }
      }
    } catch (e) {
      console.warn('Error parsing package.json:', e);
    }
  }

  // 2. requirements.txt / pyproject.toml (Python)
  const reqContent = await getFileContent('requirements.txt');
  if (reqContent) {
    try {
      const lines = reqContent.split(/\r?\n/);
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
      console.warn('Error parsing requirements.txt:', e);
    }
  }

  // 3. go.mod (Go)
  const goModContent = await getFileContent('go.mod');
  if (goModContent) {
    try {
      const lines = goModContent.split(/\r?\n/);
      let inRequireBlock = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('require (')) {
          inRequireBlock = true;
          continue;
        }
        if (inRequireBlock && trimmed === ')') {
          inRequireBlock = false;
          continue;
        }

        if (inRequireBlock || trimmed.startsWith('require ')) {
          const parts = trimmed.replace('require ', '').trim().split(/\s+/);
          if (parts.length >= 2) {
            dependencies.push({ name: parts[0], version: parts[1], type: 'go' });
          }
        }
      }
    } catch (e) {
      console.warn('Error parsing go.mod:', e);
    }
  }

  // 4. Cargo.toml (Rust)
  const cargoContent = await getFileContent('cargo.toml');
  if (cargoContent) {
    try {
      const parsedCargo = YAML.parse(cargoContent); // TOML compatible basic parser
      if (parsedCargo && parsedCargo.dependencies) {
        for (const [name, val] of Object.entries(parsedCargo.dependencies)) {
          const version = typeof val === 'string' ? val : (val.version || 'latest');
          dependencies.push({ name, version: String(version), type: 'cargo' });
        }
      }
    } catch (e) {
      console.warn('Error parsing Cargo.toml:', e);
    }
  }

  // 5. pom.xml (Java Maven)
  const pomContent = await getFileContent('pom.xml');
  if (pomContent) {
    try {
      const parser = new XMLParser();
      const jsonObj = parser.parse(pomContent);
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
      console.warn('Error parsing pom.xml:', e);
    }
  }

  // 6. Docker Compose YAML
  const composeFiles = files.filter(f => f.name.toLowerCase() === 'docker-compose.yml' || f.name.toLowerCase() === 'docker-compose.yaml');
  for (const docFile of composeFiles) {
    const composeContent = await getFileContent(docFile.path);
    if (composeContent) {
      try {
        const parsed = YAML.parse(composeContent);
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
        console.warn(`Error parsing Docker Compose ${docFile.path}:`, e);
      }
    }
  }

  return dependencies;
}
