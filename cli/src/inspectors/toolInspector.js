import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Runs system shell commands and extracts version numbers.
 * @param {string} cmd Shell command to run
 * @returns {Promise<string|null>} Version string or null
 */
async function getVersion(cmd) {
  try {
    const { stdout, stderr } = await execAsync(cmd);
    const output = (stdout || stderr).trim();
    // Extract semver format like 20.19.0, 1.22.0, 21.0.1
    const match = output.match(/(\d+\.\d+(\.\d+)?)/);
    return match ? match[1] : output;
  } catch (err) {
    return null; // Tool not installed or command failed
  }
}

/**
 * Inspects all developer runtimes and CLI tools on local PC.
 * @returns {Promise<Object>} Object containing installed tool versions
 */
export async function inspectTools() {
  const [node, java, python, go, rust, git, docker] = await Promise.all([
    getVersion('node -v'),
    getVersion('java -version'),
    getVersion('python --version'),
    getVersion('go version'),
    getVersion('rustc --version'),
    getVersion('git --version'),
    getVersion('docker -v')
  ]);

  return {
    node,
    java,
    python,
    go,
    rust,
    git,
    docker
  };
}
