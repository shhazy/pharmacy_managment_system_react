import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SuperAdminLogin from './pages/SuperAdminLogin';
import Dashboard from './pages/Dashboard';
import { useState, useEffect } from 'react';
import { APP_BASE_URL, getTenantURL } from './services/api';

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

        const host = window.location.hostname;
        const parts = host.split('.');
        let detected = '';

        if (parts.length > 1) {
            if (parts[parts.length - 1] === 'localhost') {
                if (parts.length === 2) detected = parts[0];
            } else if (parts.length >= 3) {
                detected = parts[0];
            }
        }

        console.log("Subdomain Detection:", { detected, urlTokenPresent: !!urlToken });

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
                if (!isSA && tokenTenant && tokenTenant !== detected) {
                    console.warn(`Redirecting to correct tenant: ${tokenTenant}`);
                    window.location.href = `${getTenantURL(tokenTenant)}/dashboard`;
                    return;
                }

                if (isSA && detected) {
                    console.warn("SuperAdmin on subdomain not allowed. Moving to main site.");
                    window.location.href = `${APP_BASE_URL}/dashboard`;
                    return;
                }
            } catch (e) {
                console.error("Session error", e);
                logout();
            }
        }
    }, [token, window.location.hostname]);

    return (
        <div className="App">
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
