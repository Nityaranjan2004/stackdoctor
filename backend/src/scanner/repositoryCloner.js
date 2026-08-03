import fs from 'fs/promises';
import path from 'path';
import simpleGit from 'simple-git';

/**
 * Clones a git repository to a local temporary directory.
 * @param {string} gitUrl Git repository clone URL (HTTP or SSH)
 * @param {string} [tempDir] Base temp directory
 * @returns {Promise<string>} The absolute path to the cloned repository
 */
export async function cloneRepository(gitUrl, tempDir = './temp') {
  const git = simpleGit();
  const repoName = gitUrl.split('/').pop().replace('.git', '');
  const clonePath = path.resolve(path.join(tempDir, `${repoName}-${Date.now()}`));

  await fs.mkdir(tempDir, { recursive: true });
  await git.clone(gitUrl, clonePath);
  return clonePath;
}
