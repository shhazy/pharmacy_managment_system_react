// Auth utility functions
export const getToken = () => {
    return localStorage.getItem('token');
};

export const setToken = (token) => {
    localStorage.setItem('token', token);
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

export const getTenantId = () => {
    return localStorage.getItem('tenant_id');
};

export const setTenantId = (tenantId) => {
    if (tenantId) {
        localStorage.setItem('tenant_id', tenantId);
    } else {
        localStorage.removeItem('tenant_id');
    }
};

export const isSuperAdmin = () => {
    const token = getToken();
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.is_superadmin === true;
    } catch (e) {
        return false;
    }
};

export const getUserData = () => {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            id: payload.id,
            username: payload.sub || 'User',
            schema: payload.schema_name || 'public',
            roles: payload.roles || [],
            tenant_id: payload.tenant_id || null,
            is_superadmin: payload.is_superadmin || false
        };
    } catch (e) {
        return null;
    }
};

export const detectSubdomain = () => {
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length > 1) {
        if (parts[parts.length - 1] === 'localhost') {
            if (parts.length === 2) return parts[0];
        } else if (parts.length >= 3) {
            return parts[0];
        }
    }
    return '';
};

export const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
};
