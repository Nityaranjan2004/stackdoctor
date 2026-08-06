import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function chatController(req, res, next) {
  try {
    const { message, history, projectContext, mockEnv } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const projectName = projectContext?.name || 'Project';
    const stacks = (projectContext?.stacks || []).map(s => `${s.name} (${s.category})`).join(', ');
    const deps = (projectContext?.dependencies || []).map(d => d.name).join(', ');
    const pcTools = mockEnv?.tools ? Object.entries(mockEnv.tools).map(([k, v]) => `${k}: v${v}`).join(', ') : 'Unknown';

    const systemInstruction = `You are StackDoctor AI, an expert DevOps and repository setup assistant.
Help the developer run, configure, debug, and understand their local project.

Current Repository Context:
- Project Name: ${projectName}
- Path: ${projectContext?.path || 'Not specified'}
- Detected Stack: ${stacks || 'Standard Web Stack'}
- Services & Dependencies: ${deps || 'None specified'}
- Developer PC Tools: ${pcTools}

Instructions:
1. Provide helpful, concise, 2-4 sentence explanations.
2. Whenever you suggest terminal commands to install, fix, or run something, put the executable command in a fenced markdown code block like:
\`\`\`bash
git clone ...
\`\`\`
or
\`\`\`powershell
nvm install 22
\`\`\`
3. Keep the tone friendly, professional, and encouraging.`;

    if (apiKey && apiKey.trim()) {
      try {
        const aiInstance = new GoogleGenAI({ apiKey });
        const fullPrompt = `${systemInstruction}\n\nUser Question: ${message}`;
        const response = await aiInstance.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
        });

        if (response && response.text) {
          return res.json({ reply: response.text.trim() });
        }
      } catch (err) {
        console.warn('Gemini API chat error, using intelligent fallback rules:', err.message);
      }
    }

    // --- INTELLIGENT OFFLINE CHAT ENGINE ---
    const lowerMsg = message.toLowerCase();
    let reply = `I'm analyzing ${projectName}. `;

    if (lowerMsg.includes('run') || lowerMsg.includes('start') || lowerMsg.includes('how to')) {
      reply = `To run **${projectName}**, install dependencies and start the dev server:\n\`\`\`bash\nnpm install && npm run dev\n\`\`\`\nLet me know if you hit any port or version conflicts!`;
    } else if (lowerMsg.includes('node') || lowerMsg.includes('javascript') || lowerMsg.includes('npm')) {
      reply = `${projectName} relies on Node.js. Your PC has Node v${mockEnv?.tools?.node || '20'}. To upgrade to Node v22:\n\`\`\`powershell\nnvm install 22 && nvm use 22\n\`\`\``;
    } else if (lowerMsg.includes('docker') || lowerMsg.includes('database') || lowerMsg.includes('postgres')) {
      reply = `If ${projectName} requires background databases, start Docker Desktop or launch a PostgreSQL container:\n\`\`\`powershell\ndocker run --name postgres-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres\n\`\`\``;
    } else if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
      reply = `Hello! I'm StackDoctor AI. I can help you set up, run, or fix dependencies for **${projectName}**. What would you like to do?`;
    } else {
      reply = `Based on your setup for **${projectName}**, everything is configured. You can execute terminal commands directly or ask me about specific error logs!`;
    }

    res.json({ reply });
  } catch (err) {
    next(err);
  }
}
