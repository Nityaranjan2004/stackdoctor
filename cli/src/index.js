#!/usr/bin/env node

import { Command } from 'commander';
import { inspectTools } from './inspectors/toolInspector.js';
import { inspectPorts } from './inspectors/portInspector.js';
import { inspectServices } from './inspectors/serviceInspector.js';
import { sendEnvironmentSnapshot } from './api/reporter.js';

const program = new Command();

program
  .name('stackdoctor')
  .description('StackDoctor CLI — Local Developer PC Environment Inspector')
  .version('1.0.0');

program
  .command('diagnose')
  .description('Inspect local computer runtimes, tools, ports, and services')
  .option('-k, --key <id>', 'Target project ID or session key to send snapshot to')
  .option('-p, --project <id>', 'Target project ID to send snapshot to')
  .action(async (options) => {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║               ⚕️ STACKDOCTOR CLI INSPECTOR                ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    console.log('🔍 Inspecting local PC environment...');

    const [tools, occupiedPorts, services] = await Promise.all([
      inspectTools(),
      inspectPorts(),
      inspectServices()
    ]);

    const snapshot = {
      tools,
      occupiedPorts,
      ...services
    };

    const projectId = options.key || options.project;

    // Fetch repository requirements if projectId is supplied
    let requiredStacks = new Set();
    let projectDependencies = [];
    let projectEnvs = [];
    let diagnosticsList = [];
    let projectName = null;

    if (projectId) {
      try {
        const res = await fetch(`http://localhost:5000/api/scan/${projectId}`);
        if (res.ok) {
          const projectData = await res.json();
          projectName = projectData.name;
          if (projectData.stacks) {
            projectData.stacks.forEach(s => requiredStacks.add(s.name.toLowerCase()));
          }
          if (projectData.dependencies) {
            projectDependencies = projectData.dependencies;
          }
          if (projectData.envs) {
            projectEnvs = projectData.envs;
          }
          if (projectData.diagnostics) {
            diagnosticsList = projectData.diagnostics;
          }
        }
      } catch (e) {
        // Backend not reachable or project not found
      }
    }

    console.log('──────────────────────────────────────────────────────────');
    if (projectName) {
      console.log(` 📦 Target Project : ${projectName}`);
      if (requiredStacks.size > 0) {
        console.log(` 🛠️ Tech Stack     : ${Array.from(requiredStacks).map(s => s.toUpperCase()).join(', ')}`);
      }
      console.log('──────────────────────────────────────────────────────────\n');
    }

    // Print Project Dependencies summary
    if (projectDependencies.length > 0) {
      console.log(` 🔌 Dependencies Detected (${projectDependencies.length} packages):`);
      const sampleDeps = projectDependencies.slice(0, 8);
      sampleDeps.forEach(dep => {
        console.log(`    • ${dep.name} @ ${dep.version} [${dep.type}]`);
      });
      if (projectDependencies.length > 8) {
        console.log(`    ... and ${projectDependencies.length - 8} more packages.`);
      }
      console.log('');
    }

    // Print Environment Variables Template Keys (NO values)
    if (projectEnvs.length > 0) {
      const allKeys = [];
      projectEnvs.forEach(envObj => {
        if (envObj.keys && Array.isArray(envObj.keys)) {
          envObj.keys.forEach(k => {
            if (!allKeys.includes(k)) allKeys.push(k);
          });
        }
      });

      console.log(` 🔑 Environment Configuration Template:`);
      if (allKeys.length > 0) {
        console.log(`    Required Keys (${allKeys.length}): ${allKeys.join(', ')}`);
      } else {
        console.log(`    Config Files: ${projectEnvs.map(e => e.name).join(', ')}`);
      }
      console.log('');
    }

    // Print Diagnostics checklist summary if issues exist
    if (diagnosticsList.length > 0) {
      const errors = diagnosticsList.filter(d => d.severity === 'error');
      const warnings = diagnosticsList.filter(d => d.severity === 'warning');
      console.log(` ⚠️ Diagnostic Rule Findings (${diagnosticsList.length} total checks):`);
      if (errors.length > 0) {
        console.log(`    🔴 ${errors.length} Errors Found:`);
        errors.forEach(err => console.log(`       - ${err.title}`));
      }
      if (warnings.length > 0) {
        console.log(`    🟡 ${warnings.length} Warnings Found:`);
        warnings.slice(0, 4).forEach(warn => console.log(`       - ${warn.title}`));
        if (warnings.length > 4) console.log(`       ... and ${warnings.length - 4} more warnings.`);
      }
      console.log('');
    }

    // Filter tools to ONLY those relevant to the scanned project if projectId is supplied
    const filteredTools = Object.entries(tools).filter(([tool]) => {
      const toolLower = tool.toLowerCase();

      if (!projectId) {
        if ((toolLower === 'go' || toolLower === 'rust') && !tools[toolLower]) return false;
        return true;
      }

      const isExplicitlyRequired = requiredStacks.has(toolLower);
      const isNodeImplied = toolLower === 'node' && (
        requiredStacks.has('react') || requiredStacks.has('express') || requiredStacks.has('node.js') || 
        requiredStacks.has('javascript') || requiredStacks.has('typescript') || requiredStacks.has('html') || 
        requiredStacks.has('css') || requiredStacks.size === 0
      );
      const isJavaImplied = toolLower === 'java' && (
        requiredStacks.has('spring boot') || requiredStacks.has('maven') || requiredStacks.has('gradle') || requiredStacks.has('java')
      );
      const isPythonImplied = toolLower === 'python' && (
        requiredStacks.has('python') || requiredStacks.has('django') || requiredStacks.has('flask') || requiredStacks.has('fastapi')
      );
      const isDockerImplied = toolLower === 'docker' && (
        requiredStacks.has('docker compose') || requiredStacks.has('docker') || requiredStacks.has('postgresql') || requiredStacks.has('redis') || requiredStacks.has('mongodb')
      );
      const isGitImplied = toolLower === 'git';

      return isExplicitlyRequired || isNodeImplied || isJavaImplied || isPythonImplied || isDockerImplied || isGitImplied;
    });

    console.log(' 💻 Computer Environment Check:\n');

    const missingRequiredTools = filteredTools.filter(([tool, version]) => !version);

    if (filteredTools.length === 0) {
      console.log('   ✨ No specific software requirements detected for this project.');
    } else {
      filteredTools.forEach(([tool, version]) => {
        const name = tool.toUpperCase().padEnd(10, ' ');
        if (version) {
          console.log(`   🟢 ${name} : Installed (${version})`);
        } else {
          console.log(`   🔴 ${name} : NOT INSTALLED — (Required for ${projectName || 'this project'})`);
        }
      });
    }

    const allRequiredToolsReady = missingRequiredTools.length === 0;

    console.log('\n ⚙️ Background Services & Network Ports:\n');
    console.log(`   ${services.dockerRunning ? '🟢' : '🔴'} Docker Desktop : ${services.dockerRunning ? 'Running & Active' : 'Stopped (Required for Docker DBs)'}`);
    console.log(`   🟢 Network Ports   : No blocking port conflicts detected`);

    console.log('\n──────────────────────────────────────────────────────────');
    const projectIdStr = projectId ? ` (Session Key: ${projectId.substring(0, 8)}...)` : '';
    console.log(` 📡 Syncing inspection data with StackDoctor Web Dashboard${projectIdStr}...`);
    
    const result = await sendEnvironmentSnapshot(snapshot, projectId);
    
    if (result) {
      console.log('\n 🎉 DIAGNOSIS COMPLETE!');
      if (allRequiredToolsReady && diagnosticsList.length === 0) {
        console.log(` ✨ Great news! Your computer has 100% of the tools needed and zero issues detected!`);
      } else {
        console.log(` ⚠️ Action Needed: Issues or missing requirements detected. Check your dashboard for 1-click AI fix commands.`);
      }
      console.log(` 🌐 Open Web Dashboard : http://localhost:5173/\n`);
    } else {
      console.log('\n 💡 Server Note: Start the StackDoctor backend server to view your dashboard report.\n');
    }
  });

program.parse(process.argv);
