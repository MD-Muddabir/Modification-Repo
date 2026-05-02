import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import './Login.css'; // Reuse login styling or similar

const ChangePassword = () => {
    const { user, setUser } = useContext(AuthContext);
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (passwords.newPassword !== passwords.confirmPassword) {
            return setError('New passwords do not match');
        }

        if (passwords.newPassword.length < 8) {
            return setError('Password must be at least 8 characters long');
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/change-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });

            if (res.data.success) {
                // Update local user state
                const updatedUser = { ...user, is_first_login: false };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                alert('Password changed successfully! You can now access your dashboard.');
                navigate('/student/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div className="login-card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>🔒 Secure Your Account</h1>
                    <p style={{ color: '#64748b' }}>This is your first login. Please set a new password to continue.</p>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#b91c1c', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>Current Temporary Password</label>
                        <input
                            type="password"
                            name="oldPassword"
                            className="form-input"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={passwords.oldPassword}
                            onChange={handleChange}
                            required
                            placeholder="Enter temporary password"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            className="form-input"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={passwords.newPassword}
                            onChange={handleChange}
                            required
                            placeholder="Minimum 8 characters"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-input"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            value={passwords.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Repeat new password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.875rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', background: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                        {loading ? 'Updating...' : 'Update Password & Login'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button 
                        onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}
                    >
                        Sign out and return to login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
