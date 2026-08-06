import { runSecurityRules, runDocRules } from './rules/securityRules.js';
import { runNodeRules } from './rules/nodeRules.js';
import { runPythonRules } from './rules/pythonRules.js';
import { runGoRustRules } from './rules/goRustRules.js';
import { runDevopsRules } from './rules/devopsRules.js';

/**
 * Runs complete 30+ rule diagnostic analysis suite on the project workspace.
 * 
 * @param {Array} stack Detected technology stack items
 * @param {Array} dependencies Parsed project dependencies
 * @param {Array} files Workspace file tree objects
 * @param {Array} envs Parsed environment variables
 * @param {Array} ports Active project ports
 * @returns {Object} Diagnostic result including list of issues and computed health score details
 */
export function runDiagnostics(stack = [], dependencies = [], files = [], envs = [], ports = []) {
  const stackNames = new Set((stack || []).map(s => s.name ? s.name.toLowerCase() : ''));
  
  // Combine all diagnostic rules across security, doc, Node, Python, Go, Rust, DevOps
  const allDiagnostics = [
    ...runSecurityRules(stackNames, files, envs),
    ...runDocRules(files),
    ...runNodeRules(stackNames, dependencies, files),
    ...runPythonRules(stackNames, dependencies, files),
    ...runGoRustRules(stackNames, files),
    ...runDevopsRules(stackNames, files)
  ];

  // -------------------------------------------------------------
  // HEALTH SCORE COMPUTATION FORMULA
  // Base Score: 100
  // Penalties:
  //   - Error (Critical Issue) : -15 points
  //   - Warning (Major Issue)  : -7 points
  //   - Info (Minor Notice)    : -2 points
  // -------------------------------------------------------------
  const errorsCount = allDiagnostics.filter(d => d.severity === 'error').length;
  const warningsCount = allDiagnostics.filter(d => d.severity === 'warning').length;
  const infoCount = allDiagnostics.filter(d => d.severity === 'info').length;

  const totalDeduction = (errorsCount * 15) + (warningsCount * 7) + (infoCount * 2);
  const healthScore = Math.max(0, 100 - totalDeduction);

  return {
    diagnostics: allDiagnostics,
    health: {
      score: healthScore,
      errorsCount,
      warningsCount,
      infoCount,
      rulesEvaluatedCount: 32,
      formulaExplanation: "Base Score (100) - [Errors × 15] - [Warnings × 7] - [Info × 2]"
    }
  };
}
