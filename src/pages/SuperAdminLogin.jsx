import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const SuperAdminLogin = ({ setToken }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    tenant_id: null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'SuperAdmin authentication failed');
            }

            const data = await response.json();

            setToken(data.access_token);
            localStorage.setItem('token', data.access_token);
            localStorage.removeItem('tenant_id');

            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
        }}>
            <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '400px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '12px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        marginBottom: '16px',
                        boxShadow: '0 0 20px rgba(79, 70, 229, 0.4)'
                    }}>
                        <ShieldCheck size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', letterSpacing: '-0.025em' }}>SuperAdmin Portal</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>System Administration Access</p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        marginBottom: '20px',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label><User size={14} style={{ marginRight: '4px' }} /> Admin Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="input-group">
                        <label><Lock size={14} style={{ marginRight: '4px' }} /> Master Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{
                        width: '100%',
                        background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
                        marginTop: '12px'
                    }} disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Authenticate'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        Back to Tenant Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLogin;
