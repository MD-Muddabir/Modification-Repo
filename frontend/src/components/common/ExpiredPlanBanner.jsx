import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const ExpiredPlanBanner = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      left: 0,
      width: '100%',
      backgroundColor: '#fee2e2',
      borderBottom: '1px solid #ef4444',
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      zIndex: 9999,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
        <div>
          <strong style={{ color: '#991b1b', display: 'block', fontSize: '0.95rem' }}>
            Your Institute's Plan has Expired
          </strong>
          <span style={{ color: '#7f1d1d', fontSize: '0.85rem' }}>
            Your account is currently in <strong>Read-Only Mode</strong>. You can view existing data but cannot make any modifications.
          </span>
        </div>
      </div>
      {user?.role === 'admin' && (
        <button 
          onClick={() => navigate('/pricing')}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1.25rem',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background-color 0.2s',
            fontSize: '0.9rem'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
        >
          🌟 Upgrade Plan
        </button>
      )}
    </div>
  );
};

export default ExpiredPlanBanner;
