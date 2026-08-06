import React, { useState } from 'react';

export default function HealthScore({ score, diagnostics = [] }) {
  const [showFormula, setShowFormula] = useState(false);

  // Compute breakdown stats dynamically if diagnostics passed
  const errorsCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningsCount = diagnostics.filter(d => d.severity === 'warning').length;
  const infoCount = diagnostics.filter(d => d.severity === 'info').length;

  const getStatusColor = (val) => {
    if (val >= 90) return 'var(--color-success)';
    if (val >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getStatusMessage = (val) => {
    if (val >= 90) return 'Excellent — Repository passes standard health checks.';
    if (val >= 60) return 'Warning — Some configuration issues or security risks detected.';
    return 'Critical — Important config files, lockfiles, or secret exposures found.';
  };

  const color = getStatusColor(score);

  // Radial calculation helper
  const size = 150;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card animate-slideup" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <span>📊</span> Health Score
        </h3>
        <button 
          onClick={() => setShowFormula(!showFormula)}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'var(--text-secondary)',
            borderRadius: '6px',
            fontSize: '0.72rem',
            padding: '0.2rem 0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Explain Health Score Calculation Formula"
        >
          {showFormula ? 'Hide Formula' : 'Formula Info ℹ️'}
        </button>
      </div>
      
      {/* Formula Explanation Popup / Accordion */}
      {showFormula ? (
        <div style={{
          width: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '0.8rem',
          textAlign: 'left',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.4',
          marginBottom: '1rem'
        }}>
          <div style={{ color: '#fff', fontWeight: 600, marginBottom: '0.4rem' }}>
            📐 Health Score Formula
          </div>
          <code style={{ display: 'block', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.5rem', borderRadius: '4px', color: '#a78bfa', fontSize: '0.72rem', marginBottom: '0.5rem' }}>
            Score = 100 - (Errors × 15) - (Warnings × 7) - (Info × 2)
          </code>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.74rem' }}>
            <span>❌ <strong>Errors</strong> (-15 pts): {errorsCount} detected</span>
            <span>⚠️ <strong>Warnings</strong> (-7 pts): {warningsCount} detected</span>
            <span>ℹ️ <strong>Info</strong> (-2 pts): {infoCount} detected</span>
            <span style={{ marginTop: '0.3rem', opacity: 0.8 }}>⚡ Evaluated against 32 static security & stack rules.</span>
          </div>
        </div>
      ) : (
        <>
          {/* Radial Meter */}
          <div style={{ position: 'relative', width: size, height: size, marginBottom: '0.8rem' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.8s ease'
                }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit' }}>
                {score}%
              </span>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                32 CHECKS
              </span>
            </div>
          </div>

          <div>
            <div style={{
              display: 'inline-block',
              padding: '0.25rem 0.7rem',
              borderRadius: '20px',
              background: `${color}15`,
              color: color,
              fontSize: '0.78rem',
              fontWeight: 600,
              marginBottom: '0.4rem'
            }}>
              {score >= 90 ? 'Healthy Environment' : score >= 60 ? 'Warnings Found' : 'Critical Issues'}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '0 0.5rem', margin: 0 }}>
              {getStatusMessage(score)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
