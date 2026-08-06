import fs from 'fs/promises';
import path from 'path';
import prisma from '../db.js';
import { cloneRepository } from '../scanner/repositoryCloner.js';
import { scanRepository } from '../scanner/repositoryScanner.js';
import { detectNode } from '../detectors/nodeDetector.js';
import { detectJava } from '../detectors/javaDetector.js';
import { detectPython } from '../detectors/pythonDetector.js';
import { detectDocker } from '../detectors/dockerDetector.js';
import { detectLanguageByExtension } from '../detectors/extensionDetector.js';
import { extractEnv } from '../extractors/envExtractor.js';
import { extractServices } from '../extractors/serviceExtractor.js';
import { extractPorts } from '../extractors/portExtractor.js';
import { runDiagnostics } from '../diagnostics/diagnosticEngine.js';

const envCache = new Map();

export function storeProjectEnvs(projectId, envs) {
  envCache.set(projectId, envs);
}

export function getProjectEnvs(projectId) {
  return envCache.get(projectId) || [];
}

/**
 * Executes a full workspace/repository scan.
 * @param {string} projectId 
 */
export async function executeScan(projectId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  let scanPath = null;
  let isTemp = false;

  try {
    // 1. Update project status to scanning
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'scanning' }
    });

    // 2. Determine target path (clone if git URL)
    const target = project.path;
    if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('git@')) {
      scanPath = await cloneRepository(target);
      isTemp = true;
    } else {
      scanPath = path.resolve(target);
      const stats = await fs.stat(scanPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path ${target} is not a directory`);
      }
    }

    // 3. Scan directory files listing
    const files = await scanRepository(scanPath);

    // 4. Run detectors in parallel
    const [nodeStack, javaStack, pythonStack, dockerStack] = await Promise.all([
      detectNode(scanPath, files),
      detectJava(scanPath, files),
      detectPython(scanPath, files),
      detectDocker(scanPath, files)
    ]);

    const extensionStack = detectLanguageByExtension(files);

    // Merge stacks
    const mergedStack = [...nodeStack, ...javaStack, ...pythonStack, ...dockerStack, ...extensionStack];
    const uniqueStack = [];
    const seenStackNames = new Set();
    for (const item of mergedStack) {
      const key = item.name.toLowerCase();
      if (!seenStackNames.has(key)) {
        seenStackNames.add(key);
        uniqueStack.push(item);
      }
    }

    // 5. Run extractors in parallel
    const [envs, services, ports] = await Promise.all([
      extractEnv(scanPath, files),
      extractServices(scanPath, files),
      extractPorts(scanPath, files)
    ]);

    // 6. Run diagnostics
    const { diagnostics, health } = runDiagnostics(uniqueStack, services, files, envs, ports);

    // 7. Store results using Prisma Client in a transaction
    await prisma.$transaction(async (tx) => {
      // Clean old details
      await tx.stack.deleteMany({ where: { projectId } });
      await tx.dependency.deleteMany({ where: { projectId } });
      await tx.diagnostic.deleteMany({ where: { projectId } });

      // Insert Stack
      if (uniqueStack.length > 0) {
        await tx.stack.createMany({
          data: uniqueStack.map(s => ({
            name: s.name,
            version: s.version,
            category: s.category,
            confidence: s.confidence,
            projectId
          }))
        });
      }

      // Insert dependencies
      if (services.length > 0) {
        const seenDeps = new Set();
        const uniqueDeps = [];
        for (const dep of services) {
          const key = `${dep.type}-${dep.name}`;
          if (!seenDeps.has(key)) {
            seenDeps.add(key);
            uniqueDeps.push(dep);
          }
        }
        await tx.dependency.createMany({
          data: uniqueDeps.map(d => ({
            name: d.name,
            version: d.version,
            type: d.type,
            projectId
          }))
        });
      }

      // Insert diagnostics
      if (diagnostics.length > 0) {
        await tx.diagnostic.createMany({
          data: diagnostics.map(d => ({
            title: d.title,
            description: d.description,
            severity: d.severity,
            file: d.file,
            projectId
          }))
        });
      }

      // Update status to completed
      await tx.project.update({
        where: { id: projectId },
        data: { status: 'completed' }
      });
    });

    // Store envs in memory or attach to cache for active project details
    storeProjectEnvs(projectId, envs);

  } catch (err) {
    console.error(`Scan execution error for project ${projectId}:`, err);
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'failed' }
    });
  } finally {
    // 8. Cleanup git clone path if temporary
    if (isTemp && scanPath) {
      try {
        await fs.rm(scanPath, { recursive: true, force: true });
      } catch (rmErr) {
        console.error(`Cleanup failed for temp path ${scanPath}:`, rmErr);
      }
    }
  }
}
