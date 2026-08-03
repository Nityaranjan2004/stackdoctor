import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';

/**
 * Scans project configs for ports mapping/exposure.
 * @param {string} projectPath
 * @param {Array<{name: string, path: string}>} files
 * @returns {Promise<Array<{port: number, protocol: string, serviceName: string}>>}
 */
export async function extractPorts(projectPath, files) {
  const portsDiscovered = [];

  // 1. Docker Compose Port Scanning
  const composeFiles = files.filter(f => f.name === 'docker-compose.yml' || f.name === 'docker-compose.yaml');
  for (const docFile of composeFiles) {
    try {
      const content = await fs.readFile(path.join(projectPath, docFile.path), 'utf-8');
      const parsed = YAML.parse(content);
      if (parsed && parsed.services) {
        for (const [serviceName, serviceConfig] of Object.entries(parsed.services)) {
          if (serviceConfig.ports && Array.isArray(serviceConfig.ports)) {
            for (const portMap of serviceConfig.ports) {
              const portStr = String(portMap).split(':')[0]; // local port mapped
              const numericPort = parseInt(portStr.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(numericPort)) {
                portsDiscovered.push({
                  port: numericPort,
                  protocol: 'tcp',
                  serviceName: `${serviceName} (Docker Compose)`
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to parse ports from Docker Compose ${docFile.path}:`, e);
    }
  }

  // 2. package.json Port Scanning
  const packageJson = files.find(f => f.path === 'package.json');
  if (packageJson) {
    try {
      const content = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(content);
      if (pkg.scripts) {
        for (const [name, script] of Object.entries(pkg.scripts)) {
          const portMatch = script.match(/--port\s+(\d+)|PORT=(\d+)/);
          if (portMatch) {
            const portNum = parseInt(portMatch[1] || portMatch[2], 10);
            portsDiscovered.push({
              port: portNum,
              protocol: 'tcp',
              serviceName: `package.json script: ${name}`
            });
          }
        }
      }
    } catch (e) {
      // ignore package.json reading errors
    }
  }

  return portsDiscovered;
}
