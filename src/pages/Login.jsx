import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, ShieldCheck, Database } from 'lucide-react';
import { API_BASE_URL, getTenantURL } from '../services/api';

const Login = ({ setToken, setTenant, tenant }) => {
    const [tenantId, setTenantId] = useState(tenant || '');
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
            const response = await fetch(`${API_BASE_URL}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    tenant_id: tenantId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Authentication failed');
            }

            const data = await response.json();
            const currentHost = window.location.hostname;
            const parts = currentHost.split('.');
            let detectedSubdomain = '';
            const isIP = parts.length === 4 && parts.every(p => !isNaN(p) && p !== '');
            if (!isIP && parts.length > 1) {
                if (parts[parts.length - 1] === 'localhost') {
                    if (parts.length === 2) detectedSubdomain = parts[0];
                } else if (parts.length >= 3) {
                    detectedSubdomain = parts[0];
                }
            }

            // --- UNIVERSAL SUBDOMAIN REDIRECTION ---
            // If the pharmacy ID used at login doesn't match the current browser domain, 
            // jump to the correct one professionally, but only if we ARE using domains (not IPs).
            if (!isIP && tenantId && tenantId !== detectedSubdomain) {
                console.log(`Switching domains from ${detectedSubdomain || 'main'} to ${tenantId}`);
                window.location.href = `${getTenantURL(tenantId)}/login?token=${data.access_token}`;
                return;
            }

            setToken(data.access_token);
            if (tenantId) setTenant(tenantId);
            localStorage.setItem('token', data.access_token);
            if (tenantId) localStorage.setItem('tenant_id', tenantId);
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
            background: 'radial-gradient(circle at top left, #1e293b, #0f172a)'
        }}>
            <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '12px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        marginBottom: '16px'
                    }}>
                        <Pill size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>PharmaConnect</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Enterprise Multi-tenant System</p>
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
                    {!tenant && (
                        <div className="input-group">
                            <label><Database size={14} style={{ marginRight: '4px' }} /> Pharmacy ID / Tenant</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. city-pharmacy"
                                value={tenantId}
                                onChange={(e) => setTenantId(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                        {isLoading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <p style={{ marginBottom: '12px' }}>
                        <ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Secure RBAC Protected Environment
                    </p>
                    <button
                        onClick={() => navigate('/superadmin/login')}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', opacity: 0.8 }}
                    >
                        Access SuperAdmin Portal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
