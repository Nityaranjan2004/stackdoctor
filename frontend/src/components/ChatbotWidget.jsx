import React, { useState, useRef, useEffect } from 'react';

export default function ChatbotWidget({ project, mockEnv }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hi! I'm StackDoctor AI. Ask me anything about running, configuring, or fixing ${project?.name || 'your project'}!`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (messageToSend) => {
    const textQuery = messageToSend || input;
    if (!textQuery.trim() || isLoading) return;

    const userMsg = { sender: 'user', text: textQuery };
    setMessages(prev => [...prev, userMsg]);
    if (!messageToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/scan/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textQuery,
          history: messages,
          projectContext: project,
          mockEnv
        })
      });
      const data = await res.json();
      const botReply = data && data.reply ? data.reply : (data && data.error ? `⚠️ ${data.error}` : 'Sorry, I could not process your request.');
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    } catch (err) {
      console.error('Chatbot fetch error:', err);
      setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ Connection error with StackDoctor AI backend.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchTerminal = async (cmd) => {
    setTerminalStatus('Opening terminal...');
    try {
      const targetFolder = project?.path || '';
      const res = await fetch('http://localhost:5000/api/scan/open-terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, targetFolder })
      });
      if (res.ok) {
        setTerminalStatus('✨ Terminal launched! Press Enter in terminal window.');
      }
    } catch (e) {
      setTerminalStatus('❌ Could not open terminal.');
    } finally {
      setTimeout(() => setTerminalStatus(null), 4000);
    }
  };

  // Extract code snippets from bot text
  const renderMessageContent = (rawText) => {
    const text = String(rawText || '');
    const codeBlockRegex = /```(?:bash|powershell|sh|cmd)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'code', content: match[1].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return parts.map((part, idx) => {
      if (part.type === 'text') {
        return <span key={idx}>{part.content}</span>;
      } else {
        return (
          <div key={idx} style={{ marginTop: '0.6rem', marginBottom: '0.6rem' }}>
            <div style={{
              background: '#020617',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '0.6rem 0.8rem',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#38bdf8',
              overflowX: 'auto'
            }}>
              $ {part.content}
            </div>
            <button
              onClick={() => handleLaunchTerminal(part.content)}
              style={{
                marginTop: '0.4rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '4px',
                padding: '0.35rem 0.75rem',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              <span>🖥️ Launch in Terminal</span>
            </button>
          </div>
        );
      }
    });
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            border: 'none',
            borderRadius: '50px',
            padding: '0.85rem 1.4rem',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        >
          <span style={{ fontSize: '1.2rem' }}>🤖</span> Ask StackDoctor AI
        </button>
      )}

      {/* Expandable Glass Chat Drawer */}
      {isOpen && (
        <div style={{
          width: '400px',
          height: '540px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.2rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🤖</span> StackDoctor AI Assistant
              </h4>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Context: {project?.name || 'Workspace'}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ✕
            </button>
          </div>

          {/* Status Toast */}
          {terminalStatus && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.4rem 1rem',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 600
            }}>
              {terminalStatus}
            </div>
          )}

          {/* Quick Action Presets */}
          <div style={{ padding: '0.6rem 0.8rem', display: 'flex', gap: '0.4rem', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => handleSend('How to run this project?')}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.2rem 0.6rem', color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              🚀 How to run?
            </button>
            <button
              onClick={() => handleSend('What dependencies or databases are needed?')}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.2rem 0.6rem', color: '#4ade80', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              📦 Required deps
            </button>
            <button
              onClick={() => handleSend('Fix Node.js or version issues')}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.2rem 0.6rem', color: '#fbbf24', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              ⚡ Fix versions
            </button>
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'user' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(255, 255, 255, 0.05)',
                  border: m.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  padding: '0.7rem 0.95rem',
                  borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  maxWidth: '85%',
                  fontSize: '0.84rem',
                  lineHeight: 1.45,
                  wordBreak: 'break-word'
                }}
              >
                {renderMessageContent(m.text)}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', color: '#94a3b8', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '8px', height: '8px', background: '#38bdf8', borderRadius: '50%', animation: 'ping 1s infinite' }} />
                StackDoctor AI is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ padding: '0.8rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.6rem' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about repository setup, Docker, ports..."
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.1rem',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
