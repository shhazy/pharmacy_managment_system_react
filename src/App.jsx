import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SuperAdminLogin from './pages/SuperAdminLogin';
import Dashboard from './pages/Dashboard';
import { useState, useEffect } from 'react';
import { APP_BASE_URL, getTenantURL, getTenantId } from './services/api';
import { Toaster } from 'react-hot-toast';

function App() {
    const [tenant, setTenant] = useState(localStorage.getItem('tenant_id') || '');
    const [token, setToken] = useState(localStorage.getItem('token') || '');

    // Eagerly calculate isSuperAdmin to avoid first-render glitches
    const getInitialSA = () => {
        const t = localStorage.getItem('token');
        if (!t) return false;
        try {
            const payload = JSON.parse(atob(t.split('.')[1]));
            return payload.is_superadmin === true;
        } catch (e) { return false; }
    };
    const [isSuperAdmin, setIsSuperAdmin] = useState(getInitialSA());

    const logout = () => {
        localStorage.clear();
        setToken('');
        setTenant('');
        setIsSuperAdmin(false);
        // Force a page refresh to clear all states and redirect properly
        window.location.href = '/login';
    };

    useEffect(() => {
        // --- TOKEN HYDRATION FROM URL ---
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
            localStorage.setItem('token', urlToken);
            setToken(urlToken);
            // Clean the URL without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const currentHost = window.location.hostname;
        const baseHost = new URL(APP_BASE_URL).hostname;
        const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(currentHost);
        const detected = getTenantId();

        console.log("Subdomain Detection:", { detected, currentHost, baseHost, isIP });

        if (detected !== tenant) {
            setTenant(detected);
            if (detected) localStorage.setItem('tenant_id', detected);
            else localStorage.removeItem('tenant_id');
        }

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const isSA = payload.is_superadmin === true;
                const tokenTenant = payload.tenant_id || '';

                setIsSuperAdmin(isSA);

                // --- STRICT SESSION VALIDATION & AUTO-CORRECTION ---
                // Only redirect if a domain-based subdomain structure exists (not raw IPs without nip.io)
                if (!isIP) {
                    if (!isSA && tokenTenant && tokenTenant !== (detected || '')) {
                        console.warn(`Redirecting to correct tenant: ${tokenTenant}`);
                        window.location.href = `${getTenantURL(tokenTenant)}/dashboard`;
                        return;
                    }

                    if (isSA && detected) {
                        console.warn("SuperAdmin on subdomain not allowed. Moving to main site.");
                        window.location.href = `${APP_BASE_URL}/dashboard`;
                        return;
                    }
                }
            } catch (e) {
                console.error("Session error", e);
                logout();
            }
        }
    }, [token, window.location.hostname]);

    return (
        <div className="App">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#1e293b',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                    },
                    success: {
                        iconTheme: {
                            primary: '#22c55e',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                        duration: 4000,
                    },
                }}
            />
            <Routes>
                <Route
                    path="/login"
                    element={token ? <Navigate to="/dashboard" /> : <Login setToken={setToken} setTenant={setTenant} tenant={tenant} />}
                />
                <Route
                    path="/superadmin/login"
                    element={token ? <Navigate to="/dashboard" /> : <SuperAdminLogin setToken={setToken} />}
                />
                <Route
                    path="/dashboard/*"
                    element={token ? <Dashboard tenant={tenant} isSuperAdmin={isSuperAdmin} /> : <Navigate to="/login" />}
                />
                <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </div>
    );
}

export default App;
