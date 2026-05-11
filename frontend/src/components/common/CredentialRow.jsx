import React, { useState } from 'react';

/**
 * A single row in the credentials modal that handles all three password states.
 * @param {Object} props
 * @param {Object} props.credential - The credential object containing name, email, password, status, etc.
 * @param {string} props.identifier - An optional identifier like Roll No or Employee ID
 * @param {boolean} props.isEven - For zebra striping
 * @param {Function} props.onReset - Callback function when reset is clicked
 */
function CredentialRow({ credential, identifier, isEven, onReset }) {
    const [copied, setCopied] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleCopy = () => {
        let text = "";
        if (identifier) text += `ID: ${identifier}\n`;
        text += `Email: ${credential.email || 'N/A'}\nPassword: ${credential.password}`;
        
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleReset = async () => {
        setResetting(true);
        try {
            await onReset(credential.id);
        } finally {
            setResetting(false);
        }
    };

    const rowBg = isEven ? 'transparent' : 'rgba(79,70,229,0.03)';

    return (
        <tr style={{ background: rowBg, borderBottom: '1px solid var(--border-color, #f3f4f6)' }}>
            {identifier && (
                <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '3px 10px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 700 }}>
                        {identifier}
                    </span>
                </td>
            )}
            <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary, #111827)' }}>
                {credential.name}
            </td>
            <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary, #6b7280)', fontSize: '0.85rem' }}>
                {credential.email || 'N/A'}
            </td>
            <td style={{ padding: '0.85rem 1rem' }}>
                {credential.status === 'changed' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6b7280', fontSize: '0.82rem' }}>
                        <span style={{ fontSize: '1rem' }}>🔒</span>
                        <span>Password changed by user</span>
                    </span>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <code style={{
                            background: credential.status === 'generated' ? '#ecfdf5' : '#f8f7ff',
                            border: `1px solid ${credential.status === 'generated' ? '#a7f3d0' : '#ddd6fe'}`,
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            color: credential.status === 'generated' ? '#065f46' : '#4c1d95',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            fontFamily: 'monospace',
                        }}>
                            {credential.password}
                        </code>
                        {credential.status === 'generated' && (
                            <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', textTransform: 'uppercase' }}>
                                New
                            </span>
                        )}
                    </div>
                )}
            </td>
            <td style={{ padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {credential.status !== 'changed' && (
                        <button
                            onClick={handleCopy}
                            style={{
                                background: copied ? '#d1fae5' : '#f3f4f6',
                                color: copied ? '#065f46' : '#374151',
                                border: `1px solid ${copied ? '#a7f3d0' : '#d1d5db'}`,
                                borderRadius: '6px',
                                padding: '0.3rem 0.7rem',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {copied ? '✅ Copied!' : '📋 Copy'}
                        </button>
                    )}
                    <button
                        onClick={handleReset}
                        disabled={resetting}
                        title="Generate a new password and optionally send via email"
                        style={{
                            background: resetting ? '#f3f4f6' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: resetting ? '#9ca3af' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.3rem 0.7rem',
                            fontSize: '0.78rem',
                            cursor: resetting ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {resetting ? '⏳...' : '🔄 Reset'}
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default CredentialRow;
