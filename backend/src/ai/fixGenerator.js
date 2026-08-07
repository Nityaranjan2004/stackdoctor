import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generates an AI-powered explanation and terminal fix script using Google Gemini API.
 * @param {Object} diagnosticInput Diagnostic JSON containing code, title, description, required, installed, etc.
 * @returns {Promise<{explanation: string, commands: string}>}
 */
export async function generateFix(diagnosticInput) {
  // If Gemini API Key is available, call Gemini 2.5 Flash model
  if (ai) {
    try {
      const prompt = `You are an expert DevOps AI assistant for StackDoctor.
A developer is trying to run a repository on their computer, but a diagnostic issue was detected.

Diagnostic Input JSON:
${JSON.stringify(diagnosticInput, null, 2)}

Provide a clear explanation and terminal commands to fix this issue.
Respond STRICTLY with a JSON object matching this schema (do NOT include markdown backticks or any extra text):
{
  "explanation": "Clear 2-3 sentence explanation of why this error happens and why fixing it is necessary.",
  "commands": "# PowerShell/Bash command to fix or install\\n..."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text ? response.text.trim() : '';
      
      // Clean markdown JSON fences if present
      const cleanedJson = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(cleanedJson);

      if (parsed.explanation && parsed.commands) {
        return {
          explanation: parsed.explanation,
          commands: parsed.commands
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed, using intelligent fallback rules:', err.message);
    }
  }

  // --- INTELLIGENT OFFLINE FALLBACK ENGINE ---
  const title = (diagnosticInput.title || '').toLowerCase();
  const desc = (diagnosticInput.description || '').toLowerCase();

  if (title.includes('git') || desc.includes('git')) {
    return {
      explanation: `Project operations require Git version ${diagnosticInput.required || '>=2.30'}, but your computer has ${diagnosticInput.installed || 'an outdated version'} installed. Updating Git resolves repository cloning and tracking issues.`,
      commands: `# Upgrade Git on Windows:\nwinget install Git.Git\n\n# Or update directly via Git:\ngit update-git-for-windows\n\n# Verify version:\ngit --version`
    };
  }

  if (title.includes('node') || desc.includes('node')) {
    return {
      explanation: `The project requires Node.js ${diagnosticInput.required || '>=22'}, but your computer has Node.js ${diagnosticInput.installed || 'an older version'} installed. Upgrading Node ensures all modern package dependencies run cleanly.`,
      commands: `# Upgrade Node.js on Windows (using winget):\nwinget install OpenJS.NodeJS.LTS\n\n# Or using fnm / nvm:\nfnm install 22\nfnm use 22\n\n# Verify version:\nnode -v`
    };
  }

  if (title.includes('java') || desc.includes('java')) {
    return {
      explanation: `The project requires Java JDK ${diagnosticInput.required || '21'}, but your local machine is pointing to an older JDK (${diagnosticInput.installed || '17'}). Updating JAVA_HOME to JDK 21 is required for compilation.`,
      commands: `# Install OpenJDK 21 on Windows:\nwinget install Eclipse.Temurin.Jdk.21\n\n# Verify Java version:\njava -version`
    };
  }

  if (title.includes('python') || desc.includes('python')) {
    return {
      explanation: `The project requires Python ${diagnosticInput.required || '>=3.11'}, but your computer has Python ${diagnosticInput.installed || 'an older version'} installed.`,
      commands: `# Install Python 3.12 on Windows:\nwinget install Python.Python.3.12\n\n# Verify version:\npython --version`
    };
  }

  if (title.includes('go') || desc.includes('go')) {
    return {
      explanation: `The project requires Go language toolchain ${diagnosticInput.required || '>=1.20'}, but Go is not installed on your system.`,
      commands: `# Install Go language on Windows:\nwinget install GoLang.Go\n\n# Verify version:\ngo version`
    };
  }

  if (title.includes('rust') || desc.includes('rust')) {
    return {
      explanation: `The project requires Rust compiler ${diagnosticInput.required || '>=1.75'}, but Rustup is missing on your computer.`,
      commands: `# Install Rustup toolchain on Windows:\nwinget install Rustlang.Rustup\n\n# Verify version:\nrustc --version`
    };
  }

  if (title.includes('docker') || desc.includes('docker')) {
    return {
      explanation: `The repository specifies Docker microservices (like PostgreSQL or Redis), but the Docker Desktop daemon is currently stopped on your machine.`,
      commands: `# Start Docker Desktop on Windows:\nStart-Process "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"\n\n# Or start Docker service on Linux:\nsudo systemctl start docker`
    };
  }

  if (title.includes('port') || desc.includes('port')) {
    return {
      explanation: `A required network port is currently occupied by another process on your computer, preventing the web server from binding to it.`,
      commands: `# Check and terminate process running on port 8080 (Windows PowerShell):\nStop-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess -Force`
    };
  }

  if (title.includes('missing .env') || desc.includes('missing .env')) {
    return {
      explanation: `Your project code relies on environment variables (such as API keys, secret tokens, or database connection strings), but no local .env configuration file was detected in your project directory.`,
      commands: `# PowerShell command to auto-generate a template .env file:\n@"\n# Environment Configuration\nGROQ_API_KEY=your_groq_api_key_here\nPORT=8000\nDATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db\n"@ | Out-File -Encoding utf8 .env\n\n# Verify created .env file:\nGet-Content .env`
    };
  }

  if (title.includes('secrets') || title.includes('env') || desc.includes('.env')) {
    return {
      explanation: `Your repository contains local secret files (.env) that are being tracked by Git. Secret credentials should never be committed to source control.`,
      commands: `# Untrack .env file without deleting local copy:\ngit rm --cached .env\n\n# Commit untracking change:\ngit commit -m "chore: remove secrets from git tracking"`
    };
  }

  return {
    explanation: diagnosticInput.description || 'A configuration mismatch was detected between the repository requirements and your local machine.',
    commands: `# Check installed packages:\nnpm install`
  };
}
