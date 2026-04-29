import { useState } from 'react';
import { FEATURES, ROLES } from '../../data/features';
import { useScrollReveal } from '../../hooks/useScrollReveal';

function FeatureCard({ icon, title, desc, plan, color }) {
  return (
    <div className='lp-feat-card' style={{ '--color': color }}>
      <div className='lp-feat-icon' style={{ color }}>{icon}</div>
      <h3 className='lp-feat-title'>{title}</h3>
      <p className='lp-feat-desc'>{desc}</p>
      <div className='lp-feat-footer'>
        <span>Available in</span>
        <span style={{ color }}>{plan}</span>
      </div>
    </div>
  );
}

const INITIAL_COUNT = 6; // Phase 2: Show 6 features initially

export default function Features() {
  useScrollReveal('reveal', 0.1);
  const [activeRole, setActiveRole] = useState('all');
  const [showAll, setShowAll] = useState(false); // Phase 2: toggle state

  const filtered = activeRole === 'all'
    ? FEATURES
    : FEATURES.filter(f => f.roles.includes(activeRole));

  // Phase 2: Reset showAll when tab changes so it always starts with 6
  const handleRoleChange = (role) => {
    setActiveRole(role);
    setShowAll(false);
  };

  // Phase 2: Slice to INITIAL_COUNT unless showAll is true
  const visibleFeatures = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hasMore = filtered.length > INITIAL_COUNT;

  return (
    <section className='lp-section' id='features' style={{ background: 'var(--lp-surface)' }}>
      <div className='lp-section-header reveal'>
        <span className='lp-eyebrow'>Why Choose Us</span>
        <h2 className='lp-h2'>Everything You Need to Run Your Institute</h2>
        <p className='lp-subtitle'>
          Stop juggling 5 different apps. ZF Solution brings your attendance, fees, exams, and analytics together in one unified platform.
        </p>
      </div>

      <div className='lp-feat-tabs reveal'>
        {ROLES.map(role => (
          <button
            key={role}
            className={`lp-feat-tab ${activeRole === role ? 'active' : ''}`}
            onClick={() => handleRoleChange(role)}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)} Features
          </button>
        ))}
      </div>

      <div className='lp-feat-grid'>
        {visibleFeatures.map(feat => (
          <FeatureCard key={feat.id} {...feat} />
        ))}
      </div>

      {/* Phase 2: Show More / Show Less button */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          {!showAll ? (
            <button
              className='lp-btn-ghost'
              onClick={() => setShowAll(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                border: '1.5px solid var(--lp-border)',
                borderRadius: '50px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
            >
              ✨ Show All {filtered.length} Features
              <span style={{ fontSize: '11px', background: 'var(--lp-indigo)', color: '#fff', borderRadius: '20px', padding: '2px 8px' }}>
                +{filtered.length - INITIAL_COUNT} more
              </span>
            </button>
          ) : (
            <button
              className='lp-btn-ghost'
              onClick={() => { setShowAll(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                border: '1.5px solid var(--lp-border)',
                borderRadius: '50px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
              }}
            >
              ↑ Show Less
            </button>
          )}
        </div>
      )}
    </section>
  );
}
