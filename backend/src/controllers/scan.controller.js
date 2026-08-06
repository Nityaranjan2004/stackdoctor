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

export async function generateAiFix(req, res, next) {
  try {
    const diagnosticInput = req.body;
    const fixResult = await generateFix(diagnosticInput);
    res.json(fixResult);
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

    const winPath = folderPath.replace(/\//g, '\\');

    if (process.platform === 'win32') {
      // Convert && to PowerShell sequential chaining (;) so cd changes working directory in current shell
      const psCommand = safeCmd.split('&&').map(cmd => cmd.trim()).join(' ; ');

      const psScript = `
$Host.UI.RawUI.WindowTitle = 'StackDoctor Terminal Launcher';
Clear-Host;
Set-Location -Path '${winPath.replace(/'/g, "''")}';
Write-Host '============================================================' -ForegroundColor Cyan;
Write-Host ' ⚕️  StackDoctor Auto-Generated Project Execution Command' -ForegroundColor Yellow;
Write-Host '============================================================' -ForegroundColor Cyan;
Write-Host 'Working Directory: ${winPath}' -ForegroundColor DarkCyan;
Write-Host '';
Write-Host 'The following command has been prepared for your system:' -ForegroundColor Gray;
Write-Host '';
Write-Host '  ${safeCmd.replace(/'/g, "''")}' -ForegroundColor Green;
Write-Host '';
Write-Host '============================================================' -ForegroundColor DarkGray;
Write-Host '👉 Press [ENTER] in this terminal to execute the command now.' -ForegroundColor Magenta;
Write-Host '============================================================' -ForegroundColor DarkGray;
Write-Host '';
$null = Read-Host;
Write-Host 'Executing command: ${safeCmd.replace(/'/g, "''")}' -ForegroundColor Cyan;
Write-Host '';
${psCommand}
`;

      const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');

      const child = spawn('cmd.exe', ['/c', 'start', 'powershell', '-NoExit', '-EncodedCommand', encodedScript], {
        detached: true,
        stdio: 'ignore',
        cwd: winPath
      });
      child.unref();
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
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Select target destination folder for project"
$dialog.ShowNewFolderButton = $true
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $dialog.SelectedPath
}
`;
      const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');
      const { stdout } = await execPromise(`powershell -NoProfile -EncodedCommand ${encodedScript}`);
      const folder = stdout ? stdout.trim() : null;
      return res.json({ selectedFolder: folder });
    } else if (process.platform === 'darwin') {
      const appleScript = 'POSIX path of (choose folder with prompt "Select target destination folder")';
      const { stdout } = await execPromise(`osascript -e '${appleScript}'`);
      const folder = stdout ? stdout.trim() : null;
      return res.json({ selectedFolder: folder });
    } else {
      const { stdout } = await execPromise('zenity --file-selection --directory');
      const folder = stdout ? stdout.trim() : null;
      return res.json({ selectedFolder: folder });
    }
  } catch (err) {
    res.json({ selectedFolder: null });
  }
}





