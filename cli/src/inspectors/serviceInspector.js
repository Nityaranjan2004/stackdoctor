import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Inspects background services like Docker daemon.
 * @returns {Promise<{dockerRunning: boolean}>}
 */
export async function inspectServices() {
  try {
    const { stdout } = await execAsync('docker info');
    const isRunning = stdout && !stdout.includes('error during connect') && !stdout.includes('Is the docker daemon running');
    return { dockerRunning: Boolean(isRunning) };
  } catch (err) {
    return { dockerRunning: false };
  }
}
