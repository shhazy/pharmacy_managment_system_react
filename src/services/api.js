// API service - centralized API calls
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const APP_BASE_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

export const getTenantURL = (tenantId = '') => {
    const url = new URL(APP_BASE_URL);
    const host = url.host;
    if (!tenantId) return APP_BASE_URL;
    return `${url.protocol}//${tenantId}.${host}`;
};

// Helper to get auth headers
const getAuthHeaders = (tenantId = null) => {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    if (tenantId) {
        headers['X-Tenant-ID'] = tenantId;
    }
    return headers;
};

// Helper to get tenant detected from URL
export const getTenantId = () => {
    // Priority: Subdomain detection relative to APP_BASE_URL
    try {
        const baseUrl = new URL(APP_BASE_URL);
        const baseHost = baseUrl.hostname;
        const currentHost = window.location.hostname;

        // 1. Exact match - main site
        // If current host is NOT main host, check subdomain
        if (currentHost !== baseHost && currentHost.endsWith(`.${baseHost}`)) {
            return currentHost.replace(`.${baseHost}`, '');
        }
    } catch (e) {
        console.error("Error detecting tenant from URL", e);
    }

    // Fallback: localStorage (for localhost or non-subdomain usage)
    return localStorage.getItem('tenant_id');
};

// Generic fetch wrapper
const apiCall = async (endpoint, options = {}) => {
    const tenantId = getTenantId();
    const headers = getAuthHeaders(tenantId);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        // Handle 401 specifically?
        if (response.status === 401) {
            // Optional: Logout if token expired
            // localStorage.removeItem('token');
            // window.location.href = '/login';
        }
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
};

// Auth API
export const authAPI = {
    login: async (username, password, tenantId = null) => {
        return apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password, tenant_id: tenantId })
        });
    }
};

// Inventory API
export const inventoryAPI = {
    getInventory: (tenantId) => apiCall('/inventory', { headers: getAuthHeaders(tenantId) }),
    getCategories: (tenantId) => apiCall('/categories', { headers: getAuthHeaders(tenantId) }),
    getManufacturers: (tenantId) => apiCall('/manufacturers', { headers: getAuthHeaders(tenantId) })
};

// Medicine API
export const medicineAPI = {
    search: (query, tenantId) => apiCall(`/medicines/search?q=${encodeURIComponent(query)}`, { headers: getAuthHeaders(tenantId) }),
    getById: (id, tenantId) => apiCall(`/medicines/${id}`, { headers: getAuthHeaders(tenantId) }),
    create: (medicine, tenantId) => apiCall('/medicines', {
        method: 'POST',
        body: JSON.stringify(medicine),
        headers: getAuthHeaders(tenantId)
    })
};

// Procurement API
export const procurementAPI = {
    getStores: (tenantId) => apiCall('/stores', { headers: getAuthHeaders(tenantId) }),
    createStore: (name, address, isWarehouse, tenantId) => apiCall('/stores', {
        method: 'POST',
        body: JSON.stringify({ name, address, is_warehouse: isWarehouse }),
        headers: getAuthHeaders(tenantId)
    }),
    getSuppliers: (tenantId) => apiCall('/suppliers', { headers: getAuthHeaders(tenantId) }),
    addSupplier: (name, address, gst, tenantId) => apiCall('/suppliers', {
        method: 'POST',
        body: JSON.stringify({ name, address, gst }),
        headers: getAuthHeaders(tenantId)
    }),
    getPurchaseOrders: (tenantId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiCall(`/procurement/orders?${query}`, { headers: getAuthHeaders(tenantId) });
    },
    getPurchaseOrderById: (id, tenantId) => apiCall(`/procurement/orders/${id}`, { headers: getAuthHeaders(tenantId) }),
    createPurchaseOrder: (poData, tenantId) => apiCall('/procurement/orders', {
        method: 'POST',
        body: JSON.stringify(poData),
        headers: getAuthHeaders(tenantId)
    }),
    updatePurchaseOrder: (id, poData, tenantId) => apiCall(`/procurement/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(poData),
        headers: getAuthHeaders(tenantId)
    }),
    deletePurchaseOrder: (id, tenantId) => apiCall(`/procurement/orders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(tenantId)
    }),
    generateOrder: (params, tenantId) => apiCall('/procurement/generate', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: getAuthHeaders(tenantId)
    }),
    transferStock: (fromId, toId, medId, qty, tenantId) => apiCall(`/stock/transfer?from_id=${fromId}&to_id=${toId}&med_id=${medId}&qty=${qty}`, {
        method: 'POST',
        headers: getAuthHeaders(tenantId)
    }),
    createGRN: (data, tenantId) => apiCall(`/procurement/grn`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAuthHeaders(tenantId)
    }),
    getGRNs: (tenantId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiCall(`/procurement/grn?${query}`, { headers: getAuthHeaders(tenantId) });
    }
};

// Sales API
export const salesAPI = {
    getPatients: (tenantId) => apiCall('/patients', { headers: getAuthHeaders(tenantId) }),
    addPatient: (name, phone, tenantId) => apiCall('/patients', {
        method: 'POST',
        body: JSON.stringify({ p_name: name, p_phone: phone }),
        headers: getAuthHeaders(tenantId)
    }),
    getPatientHistory: (patientId, tenantId) => apiCall(`/patients/history/${patientId}`, { headers: getAuthHeaders(tenantId) }),
    createInvoice: (invoice, tenantId) => apiCall('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoice),
        headers: getAuthHeaders(tenantId)
    }),
    processReturn: (invoiceId, amount, reason, tenantId) => apiCall('/sales/return', {
        method: 'POST',
        body: JSON.stringify({ invoice_id: invoiceId, amount, reason }),
        headers: getAuthHeaders(tenantId)
    })
};

// Analytics API
export const analyticsAPI = {
    getDailySales: (tenantId) => apiCall('/analytics/daily-sales', { headers: getAuthHeaders(tenantId) }),
    getExpiryAlerts: (tenantId) => apiCall('/analytics/expiry-alerts', { headers: getAuthHeaders(tenantId) }),
    getLowStock: (tenantId) => apiCall('/analytics/low-stock', { headers: getAuthHeaders(tenantId) }),
    getProfitMargin: (tenantId) => apiCall('/analytics/profit-margin', { headers: getAuthHeaders(tenantId) }),
    getTopSelling: (tenantId) => apiCall('/analytics/top-selling', { headers: getAuthHeaders(tenantId) }),
    getSlowMoving: (tenantId) => apiCall('/analytics/slow-moving', { headers: getAuthHeaders(tenantId) })
};

// User API
export const userAPI = {
    getUsers: (tenantId) => apiCall('/users', { headers: getAuthHeaders(tenantId) }),
    createUser: (user, tenantId) => apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(user),
        headers: getAuthHeaders(tenantId)
    }),
    getRoles: (tenantId) => apiCall('/users/roles', { headers: getAuthHeaders(tenantId) })
};

// Tenant API (SuperAdmin only)
export const tenantAPI = {
    getTenants: () => apiCall('/tenants'),
    createTenant: (tenant) => apiCall('/tenants', {
        method: 'POST',
        body: JSON.stringify(tenant)
    }),
    deleteTenant: (id) => apiCall(`/tenants/${id}`, { method: 'DELETE' })
};

// Inventory CRUD API
export const inventoryCRUDAPI = {
    list: (entity, tenantId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiCall(`/inventory/${entity}?${query}`, { headers: getAuthHeaders(tenantId) });
    },
    listAll: (entity, tenantId) => apiCall(`/inventory/${entity}/all`, { headers: getAuthHeaders(tenantId) }),
    get: (entity, id, tenantId) => apiCall(`/inventory/${entity}/${id}`, { headers: getAuthHeaders(tenantId) }),
    create: (entity, data, tenantId) => apiCall(`/inventory/${entity}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAuthHeaders(tenantId)
    }),
    update: (entity, id, data, tenantId) => apiCall(`/inventory/${entity}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: getAuthHeaders(tenantId)
    }),
    delete: (entity, id, tenantId) => apiCall(`/inventory/${entity}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(tenantId)
    })
};

// Product API
export const productAPI = {
    list: (tenantId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiCall(`/products/?${query}`, { headers: getAuthHeaders(tenantId) });
    },
    get: (id, tenantId) => apiCall(`/products/${id}`, { headers: getAuthHeaders(tenantId) }),
    create: (data, tenantId) => apiCall('/products/', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAuthHeaders(tenantId)
    }),
    update: (id, data, tenantId) => apiCall(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: getAuthHeaders(tenantId)
    }),
    delete: (id, tenantId) => apiCall(`/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(tenantId)
    })
};

// App Settings API
export const appSettingsAPI = {
    get: (tenantId) => apiCall('/app-settings', { headers: getAuthHeaders(tenantId) }),
    update: (data, tenantId) => apiCall('/app-settings', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: getAuthHeaders(tenantId)
    })
};
