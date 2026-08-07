import { z } from 'zod';
import { spawn, exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../db.js';
import { executeScan, getProjectEnvs } from '../services/scan.service.js';
import { generateFix } from '../ai/fixGenerator.js';

const execPromise = util.promisify(exec);

const scanRequestSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  path: z.string().min(1, 'Project path or Git URL is required'),
});

export async function createProject(req, res, next) {
  try {
    const validatedData = scanRequestSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        path: validatedData.path,
        status: 'idle'
      }
    });

    // Run scanning in background
    executeScan(project.id).catch(err => console.error('Scan execution error:', err));

    res.status(201).json(project);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    next(err);
  }
}

export async function listProjects(req, res, next) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
}

export async function getProjectDetails(req, res, next) {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        stacks: true,
        dependencies: true,
        diagnostics: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const snapshot = getLatestCliSnapshot(id);
    const envs = getProjectEnvs(id);
    res.json({ ...project, envs, cliSnapshot: snapshot });
  } catch (err) {
    next(err);
  }
}

export async function rescanProject(req, res, next) {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    executeScan(project.id).catch(err => console.error('Rescan execution error:', err));

    res.json({ message: 'Scan triggered successfully', status: 'scanning' });
  } catch (err) {
    next(err);
  }
}

// Memory store for latest CLI environment snapshots
let latestCliSnapshot = null;
const snapshotsByProject = new Map();

export async function updateEnvironmentSnapshot(req, res, next) {
  try {
    latestCliSnapshot = req.body;
    const projectId = req.body.projectId;
    if (projectId) {
      snapshotsByProject.set(projectId, req.body);
    }
    console.log(`Received CLI Environment Snapshot (Project Key: ${projectId || 'global'}):`, latestCliSnapshot);
    res.json({ message: 'Environment snapshot updated successfully', projectId, snapshot: latestCliSnapshot });
  } catch (err) {
    next(err);
  }
}

export function getLatestCliSnapshot(projectId = null) {
  if (projectId && snapshotsByProject.has(projectId)) {
    return snapshotsByProject.get(projectId);
  }
  return latestCliSnapshot;
}

export async function preCloneInspectController(req, res, next) {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL or path is required' });
    }

    const startTime = Date.now();
    const gitUrl = repoUrl.trim();

    const match = gitUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    let owner = null, repo = null;
    if (match) {
      owner = match[1];
      repo = match[2].replace(/\.git$/, '');
    }

    let treeFiles = [];
    let activeBranch = 'main';

    if (owner && repo) {
      try {
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: { 'User-Agent': 'StackDoctor-App' }
        });
        if (repoRes.ok) {
          const repoMeta = await repoRes.json();
          if (repoMeta.default_branch) activeBranch = repoMeta.default_branch;
        }

        const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${activeBranch}?recursive=1`, {
          headers: { 'User-Agent': 'StackDoctor-App' }
        });
        if (treeRes.ok) {
          const treeData = await treeRes.json();
          treeFiles = treeData.tree || [];
        }
      } catch (e) {}
    }

    const fileNames = treeFiles.map(t => path.basename(t.path).toLowerCase());
    const isPython = fileNames.includes('requirements.txt') || fileNames.some(f => f.endsWith('.py'));
    const isNode = fileNames.includes('package.json');
    const isRust = fileNames.includes('cargo.toml');
    const isGo = fileNames.includes('go.mod');
    const isJava = fileNames.includes('pom.xml') || fileNames.includes('build.gradle');

    let rawManifestContent = '';
    if (owner && repo && (isPython || isNode || isRust || isGo)) {
      const manifestFile = treeFiles.find(t => {
        const name = path.basename(t.path).toLowerCase();
        return name === 'requirements.txt' || name === 'package.json' || name === 'cargo.toml' || name === 'go.mod';
      });
      if (manifestFile) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${activeBranch}/${manifestFile.path}`;
          const rawRes = await fetch(rawUrl, { headers: { 'User-Agent': 'StackDoctor-App' } });
          if (rawRes.ok) rawManifestContent = await rawRes.text();
        } catch (e) {}
      }
    }

    const stacks = [];
    if (isPython) {
      stacks.push('Python 3.12');
      if (rawManifestContent.includes('fastapi')) stacks.push('FastAPI Framework');
      if (rawManifestContent.includes('groq')) stacks.push('Groq AI Vision Engine');
      if (rawManifestContent.includes('uvicorn')) stacks.push('Uvicorn ASGI Server');
      if (rawManifestContent.includes('django')) stacks.push('Django Framework');
      if (rawManifestContent.includes('flask')) stacks.push('Flask Framework');
      if (rawManifestContent.includes('streamlit')) stacks.push('Streamlit Dashboard');
    }
    if (isNode) {
      stacks.push('Node.js / JavaScript');
      if (rawManifestContent.includes('react')) stacks.push('React.js');
      if (rawManifestContent.includes('next')) stacks.push('Next.js');
      if (rawManifestContent.includes('vite')) stacks.push('Vite');
      if (rawManifestContent.includes('express')) stacks.push('Express.js');
    }
    if (isRust) stacks.push('Rust Cargo Crate');
    if (isGo) stacks.push('Go Modules');
    if (isJava) stacks.push('Java Spring Boot');

    const entryFileItem = treeFiles.find(t => {
      const name = path.basename(t.path).toLowerCase();
      return name === 'main.py' || name === 'app.py' || name === 'index.js' || name === 'server.js' || name === 'main.go' || name === 'main.rs';
    });

    const entryPoint = entryFileItem ? entryFileItem.path : (isPython ? 'main.py' : isNode ? 'index.js' : 'main');

    let runCmd = 'npm run dev';
    if (isPython) {
      if (rawManifestContent.includes('fastapi')) runCmd = `uvicorn ${entryPoint.replace(/\.py$/, '')}:app --reload`;
      else if (rawManifestContent.includes('streamlit')) runCmd = `streamlit run ${entryPoint}`;
      else runCmd = `python ${entryPoint}`;
    } else if (isRust) runCmd = 'cargo run';
    else if (isGo) runCmd = 'go run .';

    const scanTimeMs = Date.now() - startTime;

    res.json({
      repoUrl: gitUrl,
      owner,
      repo,
      activeBranch,
      scanTimeMs,
      totalFiles: treeFiles.length,
      isFastScanned: true,
      manifestsFound: Array.from(new Set(fileNames.filter(f => ['requirements.txt', 'package.json', 'cargo.toml', 'go.mod', 'pom.xml', '.env', '.gitignore', 'readme.md'].includes(f)))),
      entryPoint,
      stacks: stacks.length > 0 ? stacks : ['Web Workspace'],
      runCommand: runCmd,
      installCommand: isPython ? 'pip install -r requirements.txt' : isNode ? 'npm install' : isRust ? 'cargo build' : 'go mod download'
    });
  } catch (err) {
    next(err);
  }
}

export async function generateAiFix(req, res, next) {
  try {
    const diagnosticInput = req.body;
    const fixResult = await generateFix(diagnosticInput);
    res.json(fixResult);
  } catch (err) {
    next(err);
  }
}

export async function getSystemToolsController(req, res, next) {
  try {
    const getVer = async (cmd) => {
      try {
        const { stdout, stderr } = await execPromise(cmd);
        const output = (stdout || stderr).trim();
        const match = output.match(/(\d+\.\d+(\.\d+)?)/);
        return match ? match[1] : (output || null);
      } catch (err) {
        return null;
      }
    };

    const [node, java, python, go, rust, git, docker] = await Promise.all([
      getVer('node -v'),
      getVer('java -version'),
      getVer('python --version'),
      getVer('go version'),
      getVer('cargo --version'),
      getVer('git --version'),
      getVer('docker -v')
    ]);

    let dockerRunning = false;
    try {
      await execPromise('docker info');
      dockerRunning = true;
    } catch (e) {}

    res.json({
      os: process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux',
      tools: { node, java, python, go, rust, git, docker },
      dockerRunning
    });
  } catch (err) {
    next(err);
  }
}

export async function openTerminalController(req, res, next) {
  try {
    const { command, targetFolder } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const safeCmd = command.trim();
    let folderPath = targetFolder ? path.resolve(targetFolder.trim()) : process.cwd();

    try {
      await fs.mkdir(folderPath, { recursive: true });
    } catch (e) {}

    const winPath = folderPath.replace(/\//g, '\\');

    if (process.platform === 'win32') {
      // Build safe PowerShell execution pipeline that checks for binary existence before running
      const commandsList = safeCmd.split('&&').map(c => c.trim()).filter(Boolean);

      const psStepStatements = commandsList.map((cmd) => {
        const firstWord = cmd.split(' ')[0].replace(/^["']|["']$/g, '');
        if (['cd', 'set', 'echo', 'mkdir', 'dir'].includes(firstWord.toLowerCase())) {
          return `${cmd}; if (-not $?) { Write-Host '❌ Step failed: ${cmd.replace(/'/g, "''")}' -ForegroundColor Red; exit 1 }`;
        }
        return `
if (Test-Path ".\\venv\\Scripts\\Activate.ps1") {
    Write-Host '🐍 Activating local Python virtual environment (venv)...' -ForegroundColor DarkGreen
    .\\venv\\Scripts\\Activate.ps1
}
if (Get-Command "${firstWord}" -ErrorAction SilentlyContinue) {
    Write-Host '▶ Running: ${cmd.replace(/'/g, "''")}' -ForegroundColor Cyan
    ${cmd}
    if (-not $?) {
        Write-Host '❌ Step failed: ${cmd.replace(/'/g, "''")}' -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host '❌ ERROR: Command "${firstWord}" is not installed or not in system PATH.' -ForegroundColor Red
    Write-Host '👉 Please install missing prerequisites (e.g. winget install Rustlang.Rustup for cargo, NVM/Node for npm) and restart your terminal.' -ForegroundColor Yellow
    exit 1
}
`;
      }).join('\n');

      const psScript = `
$Host.UI.RawUI.WindowTitle = 'StackDoctor Terminal Launcher';
Clear-Host;
Set-Location -Path '${winPath.replace(/'/g, "''")}';
Write-Host '============================================================' -ForegroundColor Cyan;
Write-Host ' ⚕️  StackDoctor Local Execution & Tech Stack Dashboard' -ForegroundColor Yellow;
Write-Host '============================================================' -ForegroundColor Cyan;
Write-Host '📂 Folder: ${winPath}' -ForegroundColor DarkCyan;
Write-Host '';

Write-Host '📁 Project Directory Structure:' -ForegroundColor Yellow;
Get-ChildItem -Path '.' -Exclude '.git','venv','__pycache__','node_modules','target' | Select-Object -First 15 | ForEach-Object {
    $icon = if ($_.PSIsContainer) { '📁' } else { '📄' }
    Write-Host ("  {0} {1,-35} ({2})" -f $icon, $_.Name, $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm")) -ForegroundColor Gray
}
Write-Host '';

Write-Host '⚡ Detected Tech Stack & Runtimes:' -ForegroundColor Yellow;
if (Test-Path 'main.py') { Write-Host '  🐍 Python (Entry point: main.py detected)' -ForegroundColor Green }
if (Test-Path 'requirements.txt') { Write-Host '  📦 Python Dependencies (requirements.txt detected)' -ForegroundColor Green }
if (Test-Path 'package.json') { Write-Host '  🟢 Node.js / JavaScript (package.json detected)' -ForegroundColor Green }
if (Test-Path 'Cargo.toml') { Write-Host '  🦀 Rust Crate (Cargo.toml detected)' -ForegroundColor Green }
if (Test-Path 'Dockerfile') { Write-Host '  🐳 Docker Container (Dockerfile detected)' -ForegroundColor Green }
Write-Host '';

Write-Host '============================================================' -ForegroundColor DarkGray;
Write-Host '⚡ Auto-Executing Command Sequence:' -ForegroundColor Yellow;
Write-Host '  ${safeCmd.replace(/'/g, "''")}' -ForegroundColor Green;
Write-Host '============================================================' -ForegroundColor DarkGray;
Write-Host '';
Write-Host '🚀 Starting execution now...' -ForegroundColor Cyan;
Start-Sleep -Seconds 1;
Write-Host '';
${psStepStatements}
`;

      const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');

      try {
        const wtChild = spawn('wt.exe', ['-d', winPath, 'powershell.exe', '-NoExit', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodedScript], {
          detached: true,
          stdio: 'ignore'
        });
        wtChild.unref();
        wtChild.on('error', () => {
          const child = spawn('cmd.exe', ['/c', 'start', '""', 'powershell.exe', '-NoExit', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodedScript], {
            detached: true,
            stdio: 'ignore',
            cwd: winPath
          });
          child.unref();
        });
      } catch (e) {
        const child = spawn('cmd.exe', ['/c', 'start', '""', 'powershell.exe', '-NoExit', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodedScript], {
          detached: true,
          stdio: 'ignore',
          cwd: winPath
        });
        child.unref();
      }
    } else if (process.platform === 'darwin') {
      const appleScript = `
        tell application "Terminal"
          activate
          do script "cd \\"${folderPath.replace(/"/g, '\\"')}\\" && ${safeCmd.replace(/"/g, '\\"')}"
        end tell
      `;
      const child = spawn('osascript', ['-e', appleScript], { detached: true, stdio: 'ignore' });
      child.unref();
    } else {
      const child = spawn('x-terminal-emulator', ['-e', `bash -c "cd \\"${folderPath.replace(/"/g, '\\"')}\\" && ${safeCmd.replace(/"/g, '\\"')}; exec bash"`], {
        detached: true,
        stdio: 'ignore',
        cwd: folderPath
      });
      child.unref();
    }

    res.json({ message: 'Terminal opened successfully. Press Enter in the opened terminal to execute.' });
  } catch (err) {
    next(err);
  }
}

export async function openFolderController(req, res, next) {
  try {
    const { folderPath } = req.body;
    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    let resolvedPath = path.resolve(folderPath.trim());

    // Automatically create folder if it does not exist on disk yet
    try {
      await fs.mkdir(resolvedPath, { recursive: true });
    } catch (e) {
      // folder creation fallback
    }

    const winPath = resolvedPath.replace(/\//g, '\\');

    if (process.platform === 'win32') {
      spawn('cmd.exe', ['/c', 'start', '""', winPath], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [resolvedPath], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [resolvedPath], { detached: true, stdio: 'ignore' }).unref();
    }

    res.json({ message: 'Folder opened successfully in system File Explorer.' });
  } catch (err) {
    next(err);
  }
}

export async function pickFolderController(req, res, next) {
  try {
    if (process.platform === 'win32') {
      const psScript = `
$app = New-Object -ComObject Shell.Application
$folder = $app.BrowseForFolder(0, 'Select target destination folder for project', 0, 0)
if ($folder) {
    Write-Output $folder.Self.Path
}
`;
      const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');
      const { stdout } = await execPromise(`powershell -NoProfile -EncodedCommand ${encodedScript}`, { timeout: 30000 });
      const folder = stdout ? stdout.trim() : null;
      return res.json({ selectedFolder: folder });
    } else if (process.platform === 'darwin') {
      const appleScript = 'POSIX path of (choose folder with prompt "Select target destination folder")';
      const { stdout } = await execPromise(`osascript -e '${appleScript}'`, { timeout: 30000 });
      const folder = stdout ? stdout.trim() : null;
      return res.json({ selectedFolder: folder });
    } else {
      const { stdout } = await execPromise('zenity --file-selection --directory', { timeout: 30000 });
      const folder = stdout ? stdout.trim() : null;
      return res.json({ selectedFolder: folder });
    }
  } catch (err) {
    res.json({ selectedFolder: null });
  }
}





