import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import simpleGit from 'simple-git';

/**
 * Parses GitHub owner and repo name from URL.
 * @param {string} gitUrl
 * @returns {{owner: string, repo: string}|null}
 */
function parseGitHubUrl(gitUrl) {
  try {
    const match = gitUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (match) {
      return { owner: match[1], repo: match[2].replace('.git', '') };
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Fast GitHub API Fetcher: Fetches config files directly via GitHub API in <1s.
 * @param {string} owner GitHub owner username/org
 * @param {string} repo GitHub repository name
 * @param {string} targetDir Local destination directory
 * @returns {Promise<boolean>} True if fast fetch succeeded
 */
async function fastGitHubFetch(owner, repo, targetDir) {
  try {
    // 1. Fetch repository metadata to get exact default_branch name
    let activeBranch = 'main';
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { 'User-Agent': 'StackDoctor-App' }
      });
      if (repoRes.ok) {
        const repoMeta = await repoRes.json();
        if (repoMeta.default_branch) activeBranch = repoMeta.default_branch;
      } else {
        // If 404 or rate limited, fallback to git clone directly
        return false;
      }
    } catch (e) {
      return false;
    }

    let treeFiles = [];
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${activeBranch}?recursive=1`, {
      headers: { 'User-Agent': 'StackDoctor-App' }
    });
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      treeFiles = treeData.tree || [];
    }

    if (treeFiles.length === 0) return false;

    await fs.mkdir(targetDir, { recursive: true });

    // Save virtual file tree index for instant file extension detection
    const virtualFiles = treeFiles.map(item => ({
      name: path.basename(item.path),
      path: item.path,
      isDirectory: item.type === 'tree',
      size: item.size || 0
    }));
    await fs.writeFile(path.join(targetDir, 'file-index.json'), JSON.stringify(virtualFiles), 'utf-8');

    // Filter ALL manifest/config files for Node, Python, Java, Go, Rust, and DevOps
    const targetConfigFiles = treeFiles.filter(item => {
      if (item.type !== 'blob') return false;
      const filename = path.basename(item.path).toLowerCase();
      return (
        filename === 'package.json' ||
        filename === 'pom.xml' ||
        filename === 'build.gradle' ||
        filename === 'requirements.txt' ||
        filename === 'pipfile' ||
        filename === 'pyproject.toml' ||
        filename === 'docker-compose.yml' ||
        filename === 'docker-compose.yaml' ||
        filename === 'dockerfile' ||
        filename === 'go.mod' ||
        filename === 'cargo.toml' ||
        filename === 'cargo.lock' ||
        filename.startsWith('.env')
      );
    });

    await fs.mkdir(targetDir, { recursive: true });

    // Download relevant config files concurrently
    await Promise.all(
      targetConfigFiles.map(async (fileItem) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${activeBranch}/${fileItem.path}`;
          const rawRes = await fetch(rawUrl, {
            headers: { 'User-Agent': 'StackDoctor-App' }
          });

          if (rawRes.ok) {
            const content = await rawRes.text();
            const localFilePath = path.join(targetDir, fileItem.path);
            await fs.mkdir(path.dirname(localFilePath), { recursive: true });
            await fs.writeFile(localFilePath, content, 'utf-8');
          }
        } catch (e) {
          // Ignore individual file fetch errors
        }
      })
    );

    return true;
  } catch (err) {
    console.warn('Fast GitHub API fetch failed, falling back to git clone:', err.message);
    return false;
  }
}

/**
 * Clones a git repository or uses Fast GitHub API Fetch for <1s speed.
 * @param {string} gitUrl Git repository clone URL or local path
 * @param {string} [tempDir] Base temp directory
 * @returns {Promise<string>} The absolute path to the prepared repository
 */
export async function cloneRepository(gitUrl, tempDir = path.join(os.tmpdir(), 'stackdoctor-temp')) {
  // 1. If local directory path exists, return directly
  try {
    const stat = await fs.stat(gitUrl);
    if (stat.isDirectory()) {
      return path.resolve(gitUrl);
    }
  } catch (e) {
    // Not a local directory, proceed to URL handling
  }

  const repoInfo = parseGitHubUrl(gitUrl);
  const repoName = repoInfo ? repoInfo.repo : gitUrl.split('/').pop().replace('.git', '');
  const clonePath = path.resolve(path.join(tempDir, `${repoName}-${Date.now()}`));

  // 2. Fast GitHub API Fetch (<1s)
  if (repoInfo) {
    console.log(`⚡ Using Fast GitHub API Fetch for ${repoInfo.owner}/${repoInfo.repo}...`);
    const success = await fastGitHubFetch(repoInfo.owner, repoInfo.repo, clonePath);
    if (success) {
      console.log(`🚀 Fast fetch complete in <1s for ${repoName}`);
      return clonePath;
    }
  }

  // 3. Fallback to shallow git clone (--depth 1) for speed
  console.log(`⚡ Falling back to shallow git clone for ${gitUrl}...`);
  const git = simpleGit();
  await fs.mkdir(tempDir, { recursive: true });
  await git.clone(gitUrl, clonePath, ['--depth', '1', '--single-branch']);
  return clonePath;
}
