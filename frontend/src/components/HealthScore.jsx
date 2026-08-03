import React from 'react';

export default function HealthScore({ score }) {
  // Determine color matching score range
  const getStatusColor = (val) => {
    if (val >= 90) return 'var(--color-success)';
    if (val >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getStatusMessage = (val) => {
    if (val >= 90) return 'Excellent — Environment matches all requirements.';
    if (val >= 60) return 'Warning — Some configuration mismatches detected.';
    return 'Critical — Important tools are outdated or databases are offline.';
  };

  const color = getStatusColor(score);

  // Radial calculation helper
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card animate-slideup" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '1.2rem', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>📊</span> Project Health Score
      </h3>
      
      {/* Radial Meter */}
      <div style={{ position: 'relative', width: size, height: size, marginBottom: '1rem' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Animated active bar */}
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
        {/* Percentage Text overlay */}
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
          <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit' }}>
            {score}%
          </span>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', tracking: '0.1em', color: 'var(--text-secondary)', marginTop: '-0.2rem' }}>
            HEALTHY
          </span>
        </div>
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <div style={{
          display: 'inline-block',
          padding: '0.3rem 0.8rem',
          borderRadius: '20px',
          background: `${color}15`,
          color: color,
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '0.6rem'
        }}>
          {score >= 90 ? 'Healthy' : score >= 60 ? 'Warning' : 'Issues Found'}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', padding: '0 0.5rem' }}>
          {getStatusMessage(score)}
        </p>
      </div>
    </div>
  );
}
