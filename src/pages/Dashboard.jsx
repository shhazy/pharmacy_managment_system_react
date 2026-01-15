import { LayoutGrid, Package, ShoppingCart, Users, LogOut, TrendingUp, AlertCircle, Plus, Store, Database, ShieldCheck, Trash2, Edit2, X, ChevronLeft, UserPlus, List as ListIcon, Search, Layers, Boxes, Tag, Building2, Warehouse, Truck, Scale } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProductDefinition from './ProductDefinition';
import NavDropdown from '../components/NavDropdown';
import InventoryCRUDManager from './InventoryCRUDManager';
import ProductList from './ProductList';
import PurchaseOrder from './PurchaseOrder';
import GRN from './GRN';
import { API_BASE_URL } from '../services/api';

const Dashboard = ({ tenant, isSuperAdmin }) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ id: null, username: 'User', schema: '', roles: [] });
    const { "*": splat } = useParams();
    const activeView = splat || 'Overview';
    const setActiveView = (view) => {
        if (view !== 'ProductDefinition') setProductToEdit(null);
        navigate(`/dashboard/${view}`);
    };
    const [productToEdit, setProductToEdit] = useState(null);

    const [apiStatus, setApiStatus] = useState('Checking...');

    useEffect(() => {
        const checkConn = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/`);
                if (res.ok) setApiStatus('Operational');
                else setApiStatus('Service Degradation');
            } catch (e) { setApiStatus('Backend Unavailable'); }
        };
        checkConn();
        const interval = setInterval(checkConn, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const titleLabel = activeView === 'Overview' ? 'Dashboard' : activeView.replace(/([A-Z])/g, ' $1').trim();
        const tenantLabel = tenant ? (tenant.charAt(0).toUpperCase() + tenant.slice(1)) : 'Central';
        document.title = `${titleLabel} | ${tenantLabel} Pharma`;
    }, [activeView, tenant]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserData({
                    id: payload.id,
                    username: payload.sub || 'User',
                    schema: payload.schema_name || 'public',
                    roles: payload.roles || []
                });
            } catch (e) {
                console.error("Error parsing token", e);
            }
        }
    }, [activeView, isSuperAdmin]); // Trigger on view change or SA status change

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <div style={{
                width: '280px',
                background: 'var(--surface)',
                borderRight: '1px solid var(--border)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                    <div style={{ padding: '8px', background: 'var(--primary)', borderRadius: '10px' }}>
                        <LayoutGrid size={24} color="white" />
                    </div>
                    <h2 style={{ fontSize: '1.2rem' }}>
                        {isSuperAdmin ? 'SuperAdmin Panel' : (tenant ? `${tenant.charAt(0).toUpperCase() + tenant.slice(1)} Pharma` : 'Pharmacy Hub')}
                    </h2>
                </div>

                <nav style={{ flex: 1 }}>
                    <NavItem
                        icon={<LayoutGrid size={20} />}
                        label="Overview"
                        active={activeView === 'Overview'}
                        onClick={() => setActiveView('Overview')}
                    />
                    {!isSuperAdmin && (
                        <>
                            {(userData.roles.includes('Admin') || userData.roles.includes('Manager') || userData.roles.includes('Pharmacist')) && (
                                <NavDropdown
                                    icon={<Package size={20} />}
                                    label="Inventory"
                                    activeView={activeView}
                                    setActiveView={setActiveView}
                                    items={[
                                        { view: 'ProductDefinition', label: 'Product Definition', icon: <Plus size={16} /> },
                                        { view: 'Products', label: 'Products', icon: <Package size={16} /> },
                                        { view: 'LineItems', label: 'Line Items', icon: <ListIcon size={16} /> },
                                        { view: 'Categories', label: 'Categories', icon: <Tag size={16} /> },
                                        { view: 'SubCategories', label: 'Sub Categories', icon: <Layers size={16} /> },
                                        { view: 'ProductGroups', label: 'Product Groups', icon: <Boxes size={16} /> },
                                        { view: 'CategoryGroups', label: 'Category Groups', icon: <Layers size={16} /> },
                                        { view: 'Generics', label: 'Generics', icon: <Package size={16} /> },
                                        { view: 'CalculateSeasons', label: 'Calculate Seasons', icon: <TrendingUp size={16} /> },
                                        { view: 'Manufacturers', label: 'Manufacturers', icon: <Building2 size={16} /> },
                                        { view: 'Racks', label: 'Racks', icon: <Warehouse size={16} /> },
                                        { view: 'SuppliersInventory', label: 'Suppliers', icon: <Truck size={16} /> },
                                        { view: 'PurchaseConversionUnits', label: 'Purchase Conversion Units', icon: <Scale size={16} /> },
                                    ]}
                                />
                            )}
                            {(userData.roles.includes('Admin') || userData.roles.includes('Manager') || userData.roles.includes('Cashier')) && (
                                <NavItem
                                    icon={<ShoppingCart size={20} />}
                                    label="POS Terminal"
                                    active={activeView === 'POS'}
                                    onClick={() => setActiveView('POS')}
                                />
                            )}
                            {(userData.roles.includes('Admin') || userData.roles.includes('Manager')) && (
                                <>
                                    <NavItem
                                        icon={<Store size={20} />}
                                        label="Store Locations"
                                        active={activeView === 'Stores'}
                                        onClick={() => setActiveView('Stores')}
                                    />
                                    <NavItem
                                        icon={<ShoppingCart size={20} />} // Changed icon for suppliers below
                                        label="Suppliers"
                                        active={activeView === 'Suppliers'}
                                        onClick={() => setActiveView('Suppliers')}
                                    />
                                    <NavItem
                                        icon={<Package size={20} />}
                                        label="Purchase Order (PO)"
                                        active={activeView === 'PurchaseOrder'}
                                        onClick={() => setActiveView('PurchaseOrder')}
                                    />
                                    <NavItem
                                        icon={<Truck size={20} />}
                                        label="Goods Receipt (GRN)"
                                        active={activeView === 'GRN'}
                                        onClick={() => setActiveView('GRN')}
                                    />
                                    <NavItem
                                        icon={<Users size={20} />}
                                        label="Patients"
                                        active={activeView === 'Patients'}
                                        onClick={() => setActiveView('Patients')}
                                    />
                                    <NavItem
                                        icon={<TrendingUp size={20} />}
                                        label="Analytics Pro"
                                        active={activeView === 'Reports'}
                                        onClick={() => setActiveView('Reports')}
                                    />
                                </>
                            )}
                        </>
                    )}
                    <NavItem
                        icon={<Users size={20} />}
                        label={isSuperAdmin ? "Tenants" : "Staff Profiles"}
                        active={activeView === 'Tenants' || activeView === 'Staff'}
                        onClick={() => {
                            if (isSuperAdmin || userData.roles.includes('Admin') || userData.roles.includes('Manager')) {
                                isSuperAdmin ? setActiveView('Tenants') : setActiveView('Staff');
                            } else {
                                alert("Access Denied: Staff Profiles are for Admins only.");
                            }
                        }}
                    />
                </nav>

                <button onClick={handleLogout} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <LogOut size={20} /> Logout
                </button>
            </div>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '40px', background: 'radial-gradient(circle at top right, #1e293b, #0f172a)' }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 style={{ fontSize: '2.5rem', margin: 0, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {isSuperAdmin ? 'Global System' :
                                    activeView === 'ProductDefinition' ? 'Product Definition' :
                                        activeView === 'Products' ? 'Product Catalog' :
                                            ['LineItems', 'Categories', 'SubCategories', 'ProductGroups', 'CategoryGroups', 'Generics', 'CalculateSeasons', 'Manufacturers', 'Racks', 'SuppliersInventory', 'PurchaseConversionUnits'].includes(activeView) ?
                                                `Inventory - ${activeView.replace(/([A-Z])/g, ' $1').trim()}` :
                                                activeView === 'Staff' ? 'Staff Management' :
                                                    activeView === 'Inventory' ? 'Inventory Explorer' :
                                                        activeView === 'POS' ? 'Retail POS Terminal' :
                                                            activeView === 'PurchaseOrder' ? 'Procurement & Purchase Order' : 'Dashboard Hub'}
                            </h1>
                            {!isSuperAdmin && (
                                <span style={{
                                    padding: '4px 12px',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: '#818cf8',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <Database size={12} />
                                    {userData.schema}
                                </span>
                            )}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Welcome back, <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{userData.username}</span>.
                            {isSuperAdmin ? ' Managing enterprise tenants.' : ` Acting as ${userData.roles.join(', ')}`}
                            <span style={{
                                marginLeft: '12px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                background: apiStatus === 'Operational' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: apiStatus === 'Operational' ? '#10b981' : '#ef4444',
                                border: `1px solid ${apiStatus === 'Operational' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                            }}>
                                API: {apiStatus}
                            </span>
                        </p>
                    </div>
                </header>

                {isSuperAdmin ? (
                    activeView === 'Overview' ? <TenantManager /> : <TenantList />
                ) : (
                    activeView === 'Staff' ? <StaffManager tenantId={tenant} currentUser={userData} /> :
                        activeView === 'Inventory' ? <InventoryManager tenantId={tenant} /> :
                            activeView === 'ProductDefinition' ? <ProductDefinition tenantId={tenant} initialData={productToEdit} /> :
                                activeView === 'Products' ? <ProductList tenantId={tenant} onEdit={(p) => {
                                    setProductToEdit(p);
                                    navigate('/dashboard/ProductDefinition');
                                }} /> :
                                    activeView === 'LineItems' ? <InventoryCRUDManager tenantId={tenant} entity="line-items" entityName="Line Items" /> :
                                        activeView === 'Categories' ? <InventoryCRUDManager tenantId={tenant} entity="categories" entityName="Categories" /> :
                                            activeView === 'SubCategories' ? <InventoryCRUDManager tenantId={tenant} entity="sub-categories" entityName="Sub Categories" /> :
                                                activeView === 'ProductGroups' ? <InventoryCRUDManager tenantId={tenant} entity="product-groups" entityName="Product Groups" /> :
                                                    activeView === 'CategoryGroups' ? <InventoryCRUDManager tenantId={tenant} entity="category-groups" entityName="Category Groups" /> :
                                                        activeView === 'Generics' ? <InventoryCRUDManager tenantId={tenant} entity="generics" entityName="Generics" /> :
                                                            activeView === 'CalculateSeasons' ? <InventoryCRUDManager tenantId={tenant} entity="calculate-seasons" entityName="Calculate Seasons" /> :
                                                                activeView === 'Manufacturers' ? <InventoryCRUDManager tenantId={tenant} entity="manufacturers" entityName="Manufacturers" /> :
                                                                    activeView === 'Racks' ? <InventoryCRUDManager tenantId={tenant} entity="racks" entityName="Racks" /> :
                                                                        activeView === 'SuppliersInventory' ? <InventoryCRUDManager tenantId={tenant} entity="suppliers" entityName="Suppliers" /> :
                                                                            activeView === 'PurchaseConversionUnits' ? <InventoryCRUDManager tenantId={tenant} entity="purchase-conversion-units" entityName="Purchase Conversion Units" /> :
                                                                                activeView === 'POS' ? <POSManager tenantId={tenant} /> :
                                                                                    activeView === 'Stores' ? <StoreManager tenantId={tenant} /> :
                                                                                        activeView === 'Suppliers' ? <SupplierManager tenantId={tenant} /> :
                                                                                            activeView === 'Patients' ? <PatientManager tenantId={tenant} /> :
                                                                                                activeView === 'PurchaseOrder' ? <PurchaseOrder tenantId={tenant} /> :
                                                                                                    activeView === 'GRN' ? <GRN tenantId={tenant} /> :
                                                                                                        activeView === 'Reports' ? <AnalyticsDashboard tenantId={tenant} /> :
                                                                                                            <DashboardOverview tenantId={tenant} />
                )}
            </main>
        </div>
    );
};

const DashboardOverview = ({ tenantId }) => {
    const [stats, setStats] = useState({ total_sales: 0, invoice_count: 0 });
    const [expiryAlerts, setExpiryAlerts] = useState([]);
    const [lowStock, setLowStock] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const s = await fetch(`${API_BASE_URL}/reports/daily-sales`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                const e = await fetch(`${API_BASE_URL}/reports/expiry-alerts`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                const l = await fetch(`${API_BASE_URL}/reports/low-stock`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                if (s.ok) setStats(await s.json());
                if (e.ok) setExpiryAlerts(await e.json());
                if (l.ok) setLowStock(await l.json());
            } catch (err) { console.error(err); }
        };
        fetchStats();
    }, []);

    const cards = [
        { label: 'Daily Revenue', value: `$${stats.total_sales.toFixed(2)}`, icon: <TrendingUp color="#10b981" />, trend: `+${stats.invoice_count} bills` },
        { label: 'Low Stock Items', value: lowStock.length, icon: <AlertCircle color="#f59e0b" />, trend: 'Manual Restock' },
        { label: 'Expiry Alerts', value: expiryAlerts.length, icon: <AlertCircle color="#ef4444" />, trend: 'Next 90 Days' },
        { label: 'Active Staff', value: '4', icon: <Users color="#6366f1" />, trend: 'On Shift' },
    ];

    return (
        <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {cards.map((c, i) => (
                    <div key={i} className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>{c.icon}</div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{c.trend}</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>{c.label}</p>
                        <h3 style={{ fontSize: '2rem' }}>{c.value}</h3>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                <div className="glass-card">
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={20} color="var(--primary)" /> Critical Inventory Alerts
                    </h3>
                    {lowStock.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>All stock levels healthy.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {lowStock.map(m => (
                                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(244, 63, 94, 0.05)', borderLeft: '3px solid #f43f5e', borderRadius: '4px' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{m.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reorder Level: {m.reorder_level}</div>
                                    </div>
                                    <button className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Restock</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="glass-card">
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertCircle size={20} color="#ef4444" /> Approaching Expiry
                    </h3>
                    {expiryAlerts.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No near-expiry batches detected.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {expiryAlerts.map(b => (
                                <div key={b.inventory_id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: '600' }}>#{b.batch_number}</span>
                                        <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{new Date(b.expiry_date).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Qty: {b.quantity} units</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const StaffManager = ({ tenantId, currentUser }) => {
    const [subView, setSubView] = useState('list'); // list, add, edit
    const [editingUser, setEditingUser] = useState(null);
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRoles();
        fetchUsers();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/roles`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                }
            });
            if (res.ok) setRoles(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                }
            });
            if (res.ok) setUsers(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleBack = () => {
        setSubView('list');
        setEditingUser(null);
        fetchUsers();
    };

    const startEdit = (user) => {
        setEditingUser(user);
        setSubView('edit');
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <button
                    onClick={() => setSubView('list')}
                    className={`btn-primary ${subView !== 'list' ? 'btn-secondary' : ''}`}
                    style={{ background: subView === 'list' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '10px 20px' }}
                >
                    <ListIcon size={18} /> Staff List
                </button>
                <button
                    onClick={() => { setEditingUser(null); setSubView('add'); }}
                    className={`btn-primary ${subView !== 'add' ? 'btn-secondary' : ''}`}
                    style={{ background: subView === 'add' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '10px 20px' }}
                >
                    <UserPlus size={18} /> Add Staff
                </button>
            </div>

            {subView === 'list' && (
                <StaffList users={users} loading={loading} onEdit={startEdit} onDelete={fetchUsers} tenantId={tenantId} currentUser={currentUser} />
            )}

            {(subView === 'add' || subView === 'edit') && (
                <StaffForm
                    tenantId={tenantId}
                    roles={roles}
                    existingUser={editingUser}
                    onSuccess={handleBack}
                    onCancel={handleBack}
                />
            )}
        </div>
    );
}

const StaffList = ({ users, loading, onEdit, onDelete, tenantId, currentUser }) => {
    const handleDelete = async (id, targetIsAdmin) => {
        if (targetIsAdmin && id !== currentUser.id) {
            alert("Administrative accounts can only be modified/deleted by the user themselves.");
            return;
        }
        if (!window.confirm("Delete this staff member?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                }
            });
            if (res.ok) onDelete();
            else {
                const err = await res.json();
                alert(err.detail);
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="glass-card">
            <h3 style={{ marginBottom: '20px' }}>Current Staff Members</h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Employee</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Roles</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Status</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center' }}>Loading...</td></tr>
                        ) : users.map(u => {
                            const targetIsAdmin = u.roles.some(r => r.name === 'Admin');
                            const canEdit = !targetIsAdmin || u.id === currentUser.id;

                            return (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: canEdit ? 1 : 0.6 }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {u.username}
                                            {u.id === currentUser.id && <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>YOU</span>}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {u.roles.map(r => (
                                                <span key={r.id} style={{ padding: '2px 8px', background: r.name === 'Admin' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: r.name === 'Admin' ? '#f59e0b' : '#818cf8', borderRadius: '4px', fontSize: '0.7rem' }}>
                                                    {r.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#10b981' }}>â— Active</span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                            {canEdit ? (
                                                <>
                                                    <button onClick={() => onEdit(u)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(u.id, targetIsAdmin)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div title="Protected Administrative Account" style={{ color: 'var(--text-secondary)', cursor: 'help' }}>
                                                    <ShieldCheck size={18} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const StaffForm = ({ tenantId, roles, existingUser, onSuccess, onCancel }) => {
    const [username, setUsername] = useState(existingUser?.username || '');
    const [email, setEmail] = useState(existingUser?.email || '');
    const [password, setPassword] = useState('');
    const [selectedRoles, setSelectedRoles] = useState(existingUser?.roles.map(r => r.name) || []);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const url = existingUser
            ? `${API_BASE_URL}/users/${existingUser.id}`
            : `${API_BASE_URL}/users`;

        const method = existingUser ? 'PATCH' : 'POST';
        const body = {
            username,
            email,
            role_names: selectedRoles
        };
        if (password || !existingUser) body.password = password;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Save failed');
            }

            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px' }} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <ChevronLeft size={24} />
                </button>
                <h3 style={{ margin: 0 }}>{existingUser ? `Edit ${existingUser.username}` : 'Add New Staff Member'}</h3>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label>Username</label>
                    <input
                        type="text"
                        className="input-field"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        disabled={!!existingUser}
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        className="input-field"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Password {existingUser && '(leave blank to keep current)'}</label>
                    <input
                        type="password"
                        className="input-field"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required={!existingUser}
                    />
                </div>
                <div className="input-group">
                    <label style={{ marginBottom: '12px', display: 'block' }}>Assign Roles</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {roles.map(r => (
                            <label key={r.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: selectedRoles.includes(r.name) ? '1px solid var(--primary)' : '1px solid transparent'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={selectedRoles.includes(r.name)}
                                    onChange={e => e.target.checked
                                        ? setSelectedRoles([...selectedRoles, r.name])
                                        : setSelectedRoles(selectedRoles.filter(n => n !== r.name))}
                                />
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{r.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{r.description || 'Standard system permissions'}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '32px' }} disabled={isLoading}>
                    {isLoading ? 'Saving...' : (existingUser ? 'Update Staff Member' : 'Create Staff Member')}
                </button>

                {error && (
                    <div style={{ marginTop: '16px', color: '#f43f5e', fontSize: '0.9rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}
            </form>
        </div>
    );
}

const TenantManager = () => {
    const [name, setName] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [adminUser, setAdminUser] = useState('');
    const [adminPass, setAdminPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const res = await fetch(`${API_BASE_URL}/tenants/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name,
                    subdomain,
                    admin_username: adminUser,
                    admin_password: adminPass
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to create tenant');
            }

            setMsg({
                type: 'success',
                text: `Tenant ${name} registered successfully!`
            });
            setName(''); setSubdomain(''); setAdminUser(''); setAdminPass('');
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
            <div className="glass-card fade-in">
                <h3 style={{ marginBottom: '20px' }}>Register New Pharmacy</h3>
                <form onSubmit={handleCreate}>
                    <div className="input-group">
                        <label>Pharmacy Name</label>
                        <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Subdomain Identifier</label>
                        <input type="text" className="input-field" value={subdomain} onChange={e => setSubdomain(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Admin Username</label>
                        <input type="text" className="input-field" value={adminUser} onChange={e => setAdminUser(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Admin Password</label>
                        <input type="password" className="input-field" value={adminPass} onChange={e => setAdminPass(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Register Pharmacy'}
                    </button>
                </form>
                {msg.text && (
                    <div style={{ marginTop: '16px', color: msg.type === 'error' ? '#f43f5e' : '#10b981', fontSize: '0.9rem' }}>
                        {msg.text}
                    </div>
                )}
            </div>
            <div className="glass-card">
                <h3 style={{ marginBottom: '20px' }}>System Health</h3>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                        <span style={{ fontWeight: '600' }}>PostgreSQL Cluster Ready</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Multi-schema isolation is active. All tenant data is encrypted and separated.
                    </p>
                </div>
            </div>
        </div>
    );
};

const TenantList = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTenants = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/tenants/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setTenants(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTenants(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this pharmacy?")) return;
        try {
            await fetch(`${API_BASE_URL}/tenants/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchTenants();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="glass-card">
            <h3 style={{ marginBottom: '24px' }}>Registered Pharmacies</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Pharmacy</th>
                        <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Domain</th>
                        <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Status</th>
                        <th style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                    ) : tenants.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '16px', fontWeight: '600' }}>{t.name}</td>
                            <td style={{ padding: '16px' }}>{t.subdomain}.localhost</td>
                            <td style={{ padding: '16px' }}>
                                <span style={{ color: '#10b981', fontSize: '0.85rem' }}>Active</span>
                            </td>
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                <button onClick={() => handleDelete(t.id)} style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const InventoryManager = ({ tenantId }) => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [categories, setCategories] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [stores, setStores] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mRes, cRes, mnRes, sRes] = await Promise.all([
                fetch(`${API_BASE_URL}/inventory/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId } }),
                fetch(`${API_BASE_URL}/categories/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId } }),
                fetch(`${API_BASE_URL}/manufacturers/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId } }),
                fetch(`${API_BASE_URL}/stores/`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
            ]);
            if (mRes.ok) setMedicines(await mRes.json());
            if (cRes.ok) setCategories(await cRes.json());
            if (mnRes.ok) setManufacturers(await mnRes.json());
            if (sRes.ok) setStores(await sRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = (Array.isArray(medicines) ? medicines : []).filter(m =>
        (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.generic_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showForm) return <ProductDefinition tenantId={tenantId} onBack={() => { setShowForm(false); fetchData(); }} onSuccess={() => { setShowForm(false); fetchData(); }} />;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ flex: 1, position: 'relative', maxWidth: '400px' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} size={20} />
                    <input
                        className="input-field"
                        placeholder="Search medicines, generics..."
                        style={{ paddingLeft: '44px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    id="add-product-btn"
                    className="btn-primary"
                    style={{ padding: '12px 24px' }}
                    onClick={() => {
                        console.log("Opening Add stock form...");
                        setShowForm(true);
                    }}
                >
                    <Plus size={20} /> Add Stock
                </button>
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '20px', color: 'var(--text-secondary)' }}>Medicine / Generic</th>
                            <th style={{ padding: '20px', color: 'var(--text-secondary)' }}>Form</th>
                            <th style={{ padding: '20px', color: 'var(--text-secondary)' }}>Live Stock</th>
                            <th style={{ padding: '20px', color: 'var(--text-secondary)' }}>Batches</th>
                            <th style={{ padding: '20px', color: 'var(--text-secondary)' }}>Classification</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center' }}>Syncing Global Catalog...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>No matches found.</td></tr>
                        ) : filtered.map(m => {
                            const totalStock = (m.stock_inventory || m.batches || []).reduce((acc, b) => acc + (b.quantity || b.current_stock || 0), 0);
                            const healthColor = totalStock <= m.reorder_level ? '#ef4444' : totalStock < (m.reorder_level * 2) ? '#f59e0b' : '#10b981';

                            return (
                                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {m.name}
                                            {m.is_narcotic && <span title="Controlled Substance" style={{ color: '#ef4444' }}><ShieldCheck size={14} /></span>}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.generic_name}</div>
                                    </td>
                                    <td style={{ padding: '20px' }}>{m.strength} {m.unit}</td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1, height: '6px', width: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                                <div style={{ width: `${Math.min(100, (totalStock / m.reorder_level) * 25)}%`, height: '100%', background: healthColor, borderRadius: '3px' }}></div>
                                            </div>
                                            <span style={{ fontWeight: '700', color: healthColor }}>{totalStock}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {(m.stock_inventory || m.batches || []).map(b => (
                                                <span key={b.inventory_id || b.id} style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                                    {b.batch_number} ({b.quantity || b.current_stock || 0})
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '12px' }}>
                                            Schedule {m.schedule_type || 'G'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div >
    );
};



const POSManager = ({ tenantId }) => {
    const [medicines, setMedicines] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE_URL}/inventory`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
        }).then(r => r.json()).then(data => setMedicines(data));
    }, []);

    const addToCart = (med, batch) => {
        const existing = cart.find(c => c.batch_id === (batch.inventory_id || batch.id));
        if (existing) {
            if (existing.quantity >= (batch.quantity || batch.current_stock)) { alert("Max stock reached"); return; }
            setCart(cart.map(c => c.batch_id === (batch.inventory_id || batch.id) ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, {
                medicine_id: med.id,
                name: med.name,
                batch_id: batch.inventory_id || batch.id,
                batch_no: batch.batch_number,
                quantity: 1,
                unit_price: batch.selling_price || batch.sale_price,
                tax_percent: 0,
                discount_percent: 0
            }]);
        }
    };

    const removeFromCart = (batchId) => setCart(cart.filter(c => c.batch_id !== batchId));

    const subtotal = cart.reduce((acc, c) => acc + (c.quantity * c.unit_price), 0);
    const taxTotal = cart.reduce((acc, c) => acc + (c.quantity * c.unit_price * (c.tax_percent / 100)), 0);
    const netTotal = subtotal + taxTotal;

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify({
                    items: cart.map(c => ({
                        medicine_id: c.medicine_id,
                        batch_id: c.batch_id,
                        quantity: c.quantity,
                        unit_price: c.unit_price,
                        tax_percent: c.tax_percent,
                        discount_percent: c.discount_percent
                    })),
                    payment_method: 'Cash',
                    discount_amount: 0
                })
            });
            if (res.ok) {
                alert("Invoice Generated Successfully!");
                setCart([]);
            } else {
                const err = await res.json();
                alert(err.detail);
            }
        } catch (e) { alert("Checkout failed"); }
        finally { setProcessing(false); }
    };

    const searchFiltered = (Array.isArray(medicines) ? medicines : []).filter(m =>
        (m.name && m.name.toLowerCase().includes(search.toLowerCase())) ||
        (m.generic_name && m.generic_name.toLowerCase().includes(search.toLowerCase()))
    ).slice(0, 8);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', height: 'calc(100vh - 250px)' }}>
            <div className="fade-in">
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-secondary)' }} />
                    <input
                        className="input-field"
                        placeholder="Scan Barcode or Type Medicine Name..."
                        style={{ padding: '16px 16px 16px 52px', fontSize: '1.1rem' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', overflowY: 'auto' }}>
                    {searchFiltered.length === 0 && search && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            No exact matches. Try searching by generic name.
                        </div>
                    )}
                    {searchFiltered.map(m => (m.stock_inventory || []).filter(b => b.quantity > 0).map(b => (
                        <div
                            key={b.inventory_id}
                            className="glass-card"
                            onClick={() => addToCart(m, b)}
                            style={{ cursor: 'pointer', border: '1px solid transparent', transition: '0.2s', position: 'relative', overflow: 'hidden' }}
                            onMouseDown={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseUp={e => e.currentTarget.style.borderColor = 'transparent'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Batch: {b.batch_number}</span>
                                <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold' }}>{b.quantity} available</span>
                            </div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{m.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{m.generic_name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.2rem' }}>${b.selling_price}</div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearch(m.generic_name || m.product_name);
                                    }}
                                    title="Find Alternates (Same Generic)"
                                    style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', color: 'var(--primary)', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                                >
                                    <ListIcon size={14} />
                                </button>
                            </div>
                        </div>
                    )))}
                </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShoppingCart size={20} /> Checkout Terminal
                    </h3>
                </div>

                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    {cart.map(c => (
                        <div key={c.batch_id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600' }}>{c.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Batch: {c.batch_no} | x{c.quantity}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: '600' }}>${(c.quantity * c.unit_price).toFixed(2)}</div>
                                <button onClick={() => removeFromCart(c.batch_id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer' }}>Remove</button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>Cart is empty</div>}
                </div>

                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        <span>Tax (VAT)</span>
                        <span>${taxTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '24px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>Net Total</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)' }}>${netTotal.toFixed(2)}</span>
                    </div>
                    <button
                        className="btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                        disabled={cart.length === 0 || processing}
                        onClick={handleCheckout}
                    >
                        {processing ? 'Processing...' : 'Complete Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StoreManager = ({ tenantId }) => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transfer, setTransfer] = useState({ from: '', to: '', med: '', qty: '' });
    const [medicines, setMedicines] = useState([]);

    const fetchData = async () => {
        try {
            const [sRes, mRes] = await Promise.all([
                fetch(`${API_BASE_URL}/stores`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
                fetch(`${API_BASE_URL}/inventory`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
            ]);
            if (sRes.ok) setStores(await sRes.json());
            if (mRes.ok) setMedicines(await mRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleTransfer = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/stock/transfer?from_id=${transfer.from}&to_id=${transfer.to}&med_id=${transfer.med}&qty=${transfer.qty}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) { alert("Transfer Successful"); fetchData(); }
            else { const err = await res.json(); alert(err.detail); }
        } catch (e) { alert("Failed"); }
    };

    return (
        <div className="fade-in">
            <div className="glass-card" style={{ marginBottom: '32px' }}>
                <h3>Inter-Store Stock Transfer</h3>
                <form onSubmit={handleTransfer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', marginTop: '20px', alignItems: 'flex-end' }}>
                    <div className="input-group">
                        <label>From Store</label>
                        <select className="input-field" value={transfer.from} onChange={e => setTransfer({ ...transfer, from: e.target.value })}>
                            <option value="">Select</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>To Store</label>
                        <select className="input-field" value={transfer.to} onChange={e => setTransfer({ ...transfer, to: e.target.value })}>
                            <option value="">Select</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Medicine</label>
                        <select className="input-field" value={transfer.med} onChange={e => setTransfer({ ...transfer, med: e.target.value })}>
                            <option value="">Select</option>
                            {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Quantity</label>
                        <input type="number" className="input-field" value={transfer.qty} onChange={e => setTransfer({ ...transfer, qty: e.target.value })} />
                    </div>
                    <button type="submit" className="btn-primary" style={{ height: '48px' }}>Execute Transfer</button>
                </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {stores.map(s => (
                    <div key={s.id} className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0 }}>{s.name}</h4>
                            <span className="badge badge-success">{s.is_warehouse ? 'Warehouse' : 'Branch'}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.address}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SupplierManager = ({ tenantId }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newSup, setNewSup] = useState({ name: '', address: '', gst: '' });

    const fetchData = async () => {
        try {
            const [sRes, oRes] = await Promise.all([
                fetch(`${API_BASE_URL}/suppliers`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
                fetch(`${API_BASE_URL}/procurement/orders`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
            ]);
            if (sRes.ok) setSuppliers(await sRes.json());
            if (oRes.ok) setOrders(await oRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/suppliers?name=${newSup.name}&address=${newSup.address}&gst=${newSup.gst}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) { setShowAdd(false); fetchData(); }
        } catch (e) { alert("Fail"); }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <h3>Supplier Relationship Management</h3>
                <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={18} /> Onboard Supplier</button>
            </div>

            {showAdd && (
                <div className="glass-card" style={{ marginBottom: '24px' }}>
                    <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'flex-end' }}>
                        <div className="input-group">
                            <label>Supplier Name</label>
                            <input className="input-field" value={newSup.name} onChange={e => setNewSup({ ...newSup, name: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Address</label>
                            <input className="input-field" value={newSup.address} onChange={e => setNewSup({ ...newSup, address: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>GST/Tax ID</label>
                            <input className="input-field" value={newSup.gst} onChange={e => setNewSup({ ...newSup, gst: e.target.value })} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ height: '48px' }}>Save</button>
                    </form>
                </div>
            )}

            <div className="glass-card" style={{ padding: 0 }}>
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '20px' }}>Vendor Name</th>
                            <th style={{ padding: '20px' }}>Tax ID</th>
                            <th style={{ padding: '20px' }}>Ledger Balance</th>
                            <th style={{ padding: '20px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(s => (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '20px', fontWeight: '600' }}>{s.name}</td>
                                <td style={{ padding: '20px' }}>{s.gst_number}</td>
                                <td style={{ padding: '20px', color: '#10b981' }}>${s.ledger_balance?.toFixed(2) || '0.00'}</td>
                                <td style={{ padding: '20px', textAlign: 'right' }}>
                                    <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>View Ledger</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="glass-card" style={{ marginTop: '40px' }}>
                <h3>Recent Purchase Orders (PO)</h3>
                <table style={{ width: '100%', marginTop: '20px' }}>
                    <thead>
                        <tr><th>PO Number</th><th>Date</th><th>Total</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id}>
                                <td>#PO-{o.id + 1000}</td>
                                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                                <td>${o.total_amount.toFixed(2)}</td>
                                <td><span className={`badge ${o.status === 'Received' ? 'badge-success' : 'badge-warning'}`}>{o.status}</span></td>
                            </tr>
                        ))}
                        {orders.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No procurement history yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PatientManager = ({ tenantId }) => {
    const [patients, setPatients] = useState([]);
    useEffect(() => {
        fetch(`${API_BASE_URL}/patients`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
            .then(r => r.json()).then(data => setPatients(data));
    }, []);

    return (
        <div className="fade-in glass-card">
            <h3>Patient Registry & Medical Records</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
                {patients.map(p => (
                    <div key={p.id} className="glass-card-dense" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{p.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>{p.phone}</div>
                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Credit: ${p.outstanding_balance}</span>
                            <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>View History</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AnalyticsDashboard = ({ tenantId }) => {
    const [profitData, setProfitData] = useState([]);
    const [topSelling, setTopSelling] = useState([]);
    const [slowMoving, setSlowMoving] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/analytics/profit-margin`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).then(setProfitData);
        fetch(`${API_BASE_URL}/analytics/top-selling`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).then(setTopSelling);
        fetch(`${API_BASE_URL}/analytics/slow-moving`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).then(setSlowMoving);
    }, []);

    return (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="glass-card">
                <h3>Profitability Analysis</h3>
                <div style={{ marginTop: '20px' }}>
                    {profitData.map((d, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span>{d.medicine}</span>
                            <span style={{ color: '#10b981', fontWeight: '700' }}>+${d.total_profit.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="glass-card">
                <h3>Top Selling Products</h3>
                <div style={{ marginTop: '20px' }}>
                    {topSelling.map((d, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <span>{d.medicine}</span>
                            <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{d.units_sold} units</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                <h3>Slow Moving Inventory (No sales in 30 days)</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
                    {slowMoving.map((d, i) => (
                        <div key={i} style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8rem' }}>
                            {d.medicine} ({d.current_stock} pcs)
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const NavItem = ({ icon, label, active, onClick, style }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '8px',
            cursor: 'pointer',
            background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: active ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: active ? '600' : '400',
            transition: 'all 0.2s',
            ...style
        }}
    >
        {icon}
        {label}
    </div>
);

export default Dashboard;
