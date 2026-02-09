import { LayoutGrid, Package, ShoppingCart, Users, LogOut, TrendingUp, AlertCircle, Plus, Store, Database, ShieldCheck, Trash2, Edit2, X, ChevronLeft, ChevronRight, UserPlus, List as ListIcon, Search, Layers, Boxes, Tag, Building2, Warehouse, Truck, Scale, Settings, Menu, FileText, Printer, Banknote, CreditCard, User, Bell, BarChart3, Monitor, Hash, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProductDefinition from './ProductDefinition';
import NavDropdown from '../components/NavDropdown';
import InventoryCRUDManager from './InventoryCRUDManager';
import RolesManager from './RolesManager';
import InventoryAdjustment from './InventoryAdjustment';
import ProductManagement from './ProductManagement';
import PurchaseOrder from './PurchaseOrder';
import GRN from './GRN';
import POS from './POS';
import GeneralSettings from './GeneralSettings';
import Reports from './Reports';
import Payments from './Payments';
import ChartOfAccounts from './ChartOfAccounts';
import JournalEntries from './JournalEntries';
import InventorySetup from './InventorySetup';
import CustomerManager from './CustomerManager';
import CustomerSetup from './CustomerSetup';
import PaginationControls from '../components/PaginationControls';
import { showSuccess, showError, showInfo } from '../utils/toast';
import ConfirmDialog from '../components/ConfirmDialog';
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

    // Global Confirmation State for Dashboard Views
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Confirm',
        type: 'danger'
    });

    const openConfirm = (config) => {
        setConfirmDialog({
            isOpen: true,
            title: config.title || 'Confirm Action',
            message: config.message || 'Are you sure?',
            onConfirm: config.onConfirm,
            confirmText: config.confirmText || 'Confirm',
            type: config.type || 'danger'
        });
    };

    const closeConfirm = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    const [apiStatus, setApiStatus] = useState('Checking...');
    const [isSidebarOpen, setIsSidebarOpen] = useState(activeView !== 'POS');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Sync fullscreen state with browser events
    useEffect(() => {
        const handleFSChange = () => {
            const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
            setIsFullscreen(isFS);
        };
        document.addEventListener('fullscreenchange', handleFSChange);
        document.addEventListener('webkitfullscreenchange', handleFSChange);
        document.addEventListener('mozfullscreenchange', handleFSChange);
        document.addEventListener('MSFullscreenChange', handleFSChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFSChange);
            document.removeEventListener('webkitfullscreenchange', handleFSChange);
            document.removeEventListener('mozfullscreenchange', handleFSChange);
            document.removeEventListener('MSFullscreenChange', handleFSChange);
        };
    }, []);

    const toggleFullscreen = () => {
        const element = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
            const requestMethod = element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen || element.msRequestFullscreen;
            if (requestMethod) {
                requestMethod.call(element).then(() => {
                    setIsFullscreen(true);
                }).catch(e => {
                    console.error(`Error attempting to enable full-screen mode: ${e.message}`);
                });
            }
        } else {
            const exitMethod = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exitMethod) {
                exitMethod.call(document);
                setIsFullscreen(false);
            }
        }
    };

    useEffect(() => {
        if (activeView === 'POS') {
            setIsSidebarOpen(false);
        } else {
            // Optional: Auto-open for other views?
            // setIsSidebarOpen(true);
        }
    }, [activeView]);

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

    useEffect(() => {
        // Fetch and apply theme settings
        const fetchTheme = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/settings`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenant }
                });
                if (res.ok) {
                    const settings = await res.json();
                    if (settings.theme_config) {
                        Object.keys(settings.theme_config).forEach(key => {
                            document.documentElement.style.setProperty(key, settings.theme_config[key]);
                        });
                    }
                }
            } catch (e) { console.error("Failed to load theme"); }
        };
        if (tenant) fetchTheme();
    }, [tenant]);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <div style={{
                width: isSidebarOpen ? '280px' : '0px',
                background: 'var(--surface)',
                height: '100vh',
                position: 'sticky',
                top: 0,
                background: 'var(--surface)',
                borderRight: isSidebarOpen ? '1px solid var(--border)' : 'none',
                padding: isSidebarOpen ? '24px' : '24px 0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', padding: '0 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', background: 'var(--primary)', borderRadius: '10px' }}>
                            <LayoutGrid size={24} color="white" />
                        </div>
                        <h2 style={{ fontSize: '1.2rem', opacity: isSidebarOpen ? 1 : 0 }}>
                            {isSuperAdmin ? 'SuperAdmin' : (tenant ? `${tenant.charAt(0).toUpperCase() + tenant.slice(1)}` : 'Pharmacy')}
                        </h2>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <ChevronLeft size={20} />
                    </button>
                </div>

                <nav style={{ flex: 1, overflowY: isSidebarOpen ? 'auto' : 'hidden', overflowX: 'hidden' }} className="sidebar-nav">
                    <style>{`
                        .sidebar-nav::-webkit-scrollbar { width: 4px; }
                        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 4px; }
                        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
                    `}</style>
                    <NavItem
                        icon={<LayoutGrid size={20} />}
                        label="Overview"
                        active={activeView === 'Overview'}
                        onClick={() => setActiveView('Overview')}
                    />
                    {isSuperAdmin && (
                        <>
                            <NavItem
                                icon={<Building2 size={20} />}
                                label="Pharmacies"
                                active={activeView === 'Pharmacies'}
                                onClick={() => setActiveView('Pharmacies')}
                            />
                            <NavItem
                                icon={<User size={20} />}
                                label="Profile"
                                active={activeView === 'Profile'}
                                onClick={() => setActiveView('Profile')}
                            />
                            <NavItem
                                icon={<CreditCard size={20} />}
                                label="Software Payments"
                                active={activeView === 'Software Payments Review'}
                                onClick={() => setActiveView('Software Payments Review')}
                            />
                        </>
                    )}
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
                                        { view: 'InventoryAdjustment', label: 'Stock Adjustment', icon: <Hash size={16} /> },
                                        { view: 'InventorySetup', label: 'Data Setup', icon: <Settings size={16} /> },
                                    ]}
                                />
                            )}
                            {(userData.roles.includes('Admin') || userData.roles.includes('Manager')) && (
                                <NavDropdown
                                    icon={<Users size={20} />}
                                    label="Customers"
                                    activeView={activeView}
                                    setActiveView={setActiveView}
                                    items={[
                                        { view: 'Customers', label: 'Manage Customers', icon: <User size={16} /> },
                                        { view: 'CustomerSetup', label: 'Customer Setup', icon: <Settings size={16} /> },
                                    ]}
                                />
                            )}
                            {(userData.roles.includes('Admin') || userData.roles.includes('Manager') || userData.roles.includes('Cashier')) && (
                                <>
                                    <NavItem
                                        icon={<ShoppingCart size={20} />}
                                        label="POS Terminal"
                                        active={activeView === 'POS'}
                                        onClick={() => setActiveView('POS')}
                                    />
                                    <NavItem
                                        icon={<FileText size={20} />}
                                        label="Invoices"
                                        active={activeView === 'Invoices'}
                                        onClick={() => setActiveView('Invoices')}
                                    />
                                </>
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
                                        active={activeView === 'Analytics'}
                                        onClick={() => setActiveView('Analytics')}
                                    />
                                    <NavDropdown
                                        icon={<FileText size={20} />}
                                        label="Accounting"
                                        activeView={activeView}
                                        setActiveView={setActiveView}
                                        items={[
                                            { view: 'Reports', label: 'Reports', icon: <FileText size={16} /> },
                                            { view: 'ChartOfAccounts', label: 'Chart of Accounts', icon: <ListIcon size={16} /> },
                                            { view: 'JournalEntries', label: 'Journal Entries', icon: <FileText size={16} /> },
                                        ]}
                                    />
                                    <NavItem
                                        icon={<CreditCard size={20} />}
                                        label="Supplier Payments"
                                        active={activeView === 'Payments'}
                                        onClick={() => setActiveView('Payments')}
                                    />
                                    <NavItem
                                        icon={<CreditCard size={20} />}
                                        label="Software Payments"
                                        active={activeView === 'Software Payments'}
                                        onClick={() => setActiveView('Software Payments')}
                                    />
                                </>
                            )}

                            {(userData.roles.includes('Admin') || userData.roles.includes('Manager')) && (
                                <NavDropdown
                                    icon={<Settings size={20} />}
                                    label="Settings"
                                    activeView={activeView}
                                    setActiveView={setActiveView}
                                    items={[
                                        { view: 'GeneralSettings', label: 'General Settings', icon: <Settings size={16} /> }
                                    ]}
                                />
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
                                showError("Access Denied: Staff Profiles are for Admins only.");
                            }
                        }}
                    />
                </nav>

                <button onClick={handleLogout} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <LogOut size={20} /> Logout
                </button>
            </div>

            {/* Main Content */}
            <main style={{ flex: 1, background: 'radial-gradient(circle at top right, #1e293b, #0f172a)', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', width: isSidebarOpen ? 'calc(100% - 280px)' : '100%' }}>
                <header style={{
                    padding: '14px 40px',
                    background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8))',
                    backdropFilter: 'blur(32px)',
                    borderBottom: '1px solid rgba(99, 102, 241, 0.4)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    transition: 'all 0.4s ease'
                }}>
                    {/* Left: Brand/Logo & Breadcrumbs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {!isSidebarOpen && (
                            <button onClick={() => setIsSidebarOpen(true)} style={{
                                background: 'linear-gradient(135deg, var(--primary), #818cf8)',
                                border: 'none',
                                color: 'white',
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
                            }}>
                                <Menu size={20} />
                            </button>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                <span>Nexus OS</span>
                                <ChevronRight size={10} />
                                <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{activeView.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </div>
                            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700', color: '#fff' }}>
                                {activeView === 'Overview' ? 'Control Center' : activeView.replace(/([A-Z])/g, ' $1').trim()}
                            </h2>
                        </div>
                    </div>

                    {/* Center: Action Shortcuts Tooltray */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center', margin: '0 40px' }}>
                        <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }}>
                            {[
                                { view: 'POS', icon: <ShoppingCart size={20} />, label: 'Sale', tooltip: 'Launch POS (Ctrl+S)' },
                                { view: 'Products', icon: <Package size={20} />, label: 'Stock', tooltip: 'Inventory Management' },
                                { view: 'ProductDefinition', icon: <Plus size={20} />, label: 'Add', tooltip: 'Add New Product' },
                                { view: 'Patients', icon: <UserPlus size={20} />, label: 'Patient', tooltip: 'Patient Registration' },
                                { view: 'Analytics', icon: <BarChart3 size={20} />, label: 'Stats', tooltip: 'Performance Analytics' }
                            ].map(btn => (
                                <button
                                    key={btn.view}
                                    onClick={() => setActiveView(btn.view)}
                                    data-tooltip={btn.tooltip}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px',
                                        background: activeView === btn.view ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                                        border: 'none',
                                        color: activeView === btn.view ? 'white' : 'rgba(255,255,255,0.6)',
                                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: activeView === btn.view ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none'
                                    }}
                                >
                                    {btn.icon}
                                    <span>{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Notifications & Profile */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={toggleFullscreen}
                                data-tooltip={isFullscreen ? "Exit Big Screen (Esc)" : "Big Screen Mode (F11)"}
                                style={{
                                    background: isFullscreen ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    border: isFullscreen ? '1px solid var(--primary)' : 'none',
                                    color: isFullscreen ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <Monitor size={20} />
                            </button>
                            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
                            <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', position: 'relative' }}>
                                <Bell size={20} />
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid #0f172a' }} />
                            </button>
                            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>{userData.username}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>{userData.roles[0]}</div>
                                </div>
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #334155, #0f172a)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <User size={20} color="rgba(255,255,255,0.7)" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div style={{ padding: isFullscreen ? '16px' : '32px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: '8px' }}>
                        {isSuperAdmin ? (
                            activeView === 'Overview' ? <SuperAdminOverview setActiveView={setActiveView} /> :
                                activeView === 'Pharmacies' ? <TenantManager openConfirm={openConfirm} /> :
                                    activeView === 'Profile' ? <SuperAdminProfile /> :
                                        activeView === 'Software Payments Review' ? <SoftwarePaymentReview /> :
                                            <SuperAdminOverview setActiveView={setActiveView} />
                        ) : (
                            activeView === 'Staff' ? <StaffManager tenantId={tenant} currentUser={userData} openConfirm={openConfirm} /> :
                                activeView === 'Inventory' ? <InventoryManager tenantId={tenant} /> :
                                    activeView === 'ProductDefinition' ? <ProductDefinition
                                        tenantId={tenant}
                                        initialData={productToEdit}
                                        onSaveSuccess={() => setActiveView('Products')}
                                    /> :
                                        activeView === 'Products' ? <ProductManagement tenantId={tenant} onEdit={(p) => {
                                            setProductToEdit(p);
                                            navigate('/dashboard/ProductDefinition');
                                        }} /> :
                                            activeView === 'InventorySetup' ? <InventorySetup tenantId={tenant} /> :
                                                activeView === 'InventoryAdjustment' ? <InventoryAdjustment tenantId={tenant} /> :
                                                    activeView === 'POS' ? <POS tenantId={tenant} isFullscreen={isFullscreen} setFullscreen={setIsFullscreen} /> :
                                                        activeView === 'Invoices' ? <SalesHistory tenantId={tenant} /> :
                                                            activeView === 'Stores' ? <StoreManager tenantId={tenant} /> :
                                                                activeView === 'Suppliers' ? <SupplierManager tenantId={tenant} /> :
                                                                    activeView === 'Customers' ? <CustomerManager tenantId={tenant} /> :
                                                                        activeView === 'CustomerSetup' ? <CustomerSetup tenantId={tenant} /> :
                                                                            activeView === 'Patients' ? <PatientManager tenantId={tenant} /> :
                                                                                activeView === 'PurchaseOrder' ? <PurchaseOrder tenantId={tenant} /> :
                                                                                    activeView === 'GRN' ? <GRN tenantId={tenant} /> :
                                                                                        activeView === 'Analytics' ? <AnalyticsDashboard tenantId={tenant} /> :
                                                                                            activeView === 'Reports' ? <Reports /> :
                                                                                                activeView === 'ChartOfAccounts' ? <ChartOfAccounts tenant={tenant} /> :
                                                                                                    activeView === 'JournalEntries' ? <JournalEntries tenant={tenant} /> :
                                                                                                        activeView === 'Payments' ? <Payments tenantId={tenant} /> :
                                                                                                            activeView === 'GeneralSettings' ? <GeneralSettings tenantId={tenant} /> :
                                                                                                                activeView === 'Software Payments' ? <SoftwarePaymentManager tenantId={tenant} /> :
                                                                                                                    <DashboardOverview tenantId={tenant} />
                        )}
                    </div>
                    <footer style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                        <div>&copy; {new Date().getFullYear()} {tenant ? tenant.toUpperCase() : 'ANTIGRAVITY'} PHARMA. All rights reserved.</div>
                        <div>System v2.5.0 | Support: help@antigravity.dev</div>
                    </footer>
                </div>


            </main>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
            />
        </div >
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
        { label: 'Daily Revenue', value: `Rs. ${stats.total_sales.toFixed(2)}`, icon: <TrendingUp color="#10b981" />, trend: `+${stats.invoice_count} bills` },
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

const StaffManager = ({ tenantId, currentUser, openConfirm }) => {
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
                <button
                    onClick={() => setSubView('roles')}
                    className={`btn-primary ${subView !== 'roles' ? 'btn-secondary' : ''}`}
                    style={{ background: subView === 'roles' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', padding: '10px 20px' }}
                >
                    <ShieldCheck size={18} /> Manage Roles
                </button>
            </div>

            {subView === 'roles' && (
                <RolesManager
                    tenantId={tenantId}
                    currentUser={currentUser}
                    onBack={() => { setSubView('list'); fetchRoles(); }}
                />
            )}

            {subView === 'list' && (
                <StaffList
                    users={users}
                    loading={loading}
                    onEdit={startEdit}
                    onDelete={fetchUsers}
                    tenantId={tenantId}
                    currentUser={currentUser}
                    openConfirm={openConfirm}
                />
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

const StaffList = ({ users, loading, onEdit, onDelete, tenantId, currentUser, openConfirm }) => {
    const handleDelete = async (id, targetIsAdmin) => {
        if (targetIsAdmin && id !== currentUser.id) {
            showError("Administrative accounts can only be modified/deleted by the user themselves.");
            return;
        }

        openConfirm({
            title: 'Delete Staff Member',
            message: 'Are you sure you want to remove this staff member? This will revoke all their access across the system.',
            onConfirm: async () => {
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
                        showError(err.detail);
                    }
                } catch (err) {
                    console.error(err);
                    showError("An error occurred while deleting staff member");
                }
            },
            confirmText: 'Delete Staff',
            type: 'danger'
        });
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
                                        <span style={{ fontSize: '0.8rem', color: '#10b981' }}>● Active</span>
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

const SalesHistory = ({ tenantId }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({});
    const [appSettings, setAppSettings] = useState({});
    const [filters, setFilters] = useState({ start: '', end: '', status: 'All' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    useEffect(() => {
        fetchInvoices();
        fetchSettings();
    }, [tenantId, filters]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                limit: 100,
                start_date: filters.start,
                end_date: filters.end,
                status: filters.status
            });
            const res = await fetch(`${API_BASE_URL}/invoices?${query}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) setInvoices(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) setSettings(await res.json());

            const appRes = await fetch(`${API_BASE_URL}/app-settings`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (appRes.ok) setAppSettings(await appRes.json());
        } catch (e) { console.error(e); }
    };

    const printReceipt = (invoice) => {
        if (!invoice) return;

        const isReturn = invoice.status === 'Return' || invoice.net_total < 0;
        const templateId = appSettings.invoice_template_id || 'default';
        const custom = appSettings.invoice_custom_config || {};
        const isClinix = templateId === 'clinix' || templateId === 'default';

        let paperWidth = '72mm';
        if (templateId === 'thermal58') paperWidth = '48mm';
        if (templateId === 'detailed') paperWidth = '210mm';

        const win = window.open('', '', 'width=800,height=900');

        const clinixHeader = isClinix ? `
            <div class="center" style="margin-bottom: 2px;">
                ${(custom.showLogo !== false && settings.logo_url) ? `<img src="${settings.logo_url}" class="logo" />` : ''}
            </div>
            <div style="background: black; color: white; text-align: center; font-weight: bold; padding: 2px 0; font-size: 0.9em; margin-bottom: 8px; text-transform: uppercase;">
                ${settings.tagline || 'THE MEDICINE SUPERSTORE'}
            </div>
            <div class="center" style="font-size: 1.1em; margin-bottom: 2px;">${settings.name || 'Bukhtiari Pharmacy'}</div>
            <div class="center" style="font-size: 0.85em;">
                ${settings.address || 'Amna Plaza Block#16, Near Girls Degree College, KW'}<br/>
                Phone #: ${settings.phone_no || '065-2554412, 2557912'}<br/>
                Drug Lic #: ${settings.license_no || '04-364-0045-022247P'}
            </div>
             <div class="center" style="font-size: 0.85em; margin-bottom: 8px;">(${invoice.id || '---'})</div>
        ` : '';

        const style = `
             <style>
                @page { margin: 0; }
                body {
                    font-family: ${isClinix ? "'Arial Narrow', 'Roboto Condensed', sans-serif" : (templateId === 'detailed' ? "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" : "'Courier New', monospace")};
                    width: ${paperWidth};
                    margin: ${templateId === 'detailed' ? '15mm' : '0 auto'};
                    padding: ${isClinix ? '10px 5px' : '8px'};
                    font-size: ${custom.fontSize || 12}px;
                    color: black;
                    line-height: 1.25;
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .header { margin-bottom: ${isClinix ? '5px' : '12px'}; text-align: ${custom.headerAlign || 'center'}; }
                .logo { max-width: 100%; max-height: 50px; margin-bottom: 5px; }
                .divider { border-top: 1px dashed black; margin: 8px 0; }

                .clinix-divider { border-top: 1px solid #000; margin: 5px 0; }
                .row-sb { display: flex; justify-content: space-between; }
                .clinix-table-header {
                    display: grid;
                    grid-template-columns: 2fr 35px 55px 55px 60px 70px;
                    border-top: 1px solid black;
                    border-bottom: 1px solid black;
                    padding: 3px 0;
                    margin: 5px 0;
                    font-weight: bold;
                    font-size: 0.95em;
                }
                .clinix-row {
                    display: grid;
                    grid-template-columns: 2fr 35px 55px 55px 60px 70px;
                    margin-bottom: 4px;
                    font-size: 0.95em;
                }

                @media print {
                    body { width: ${paperWidth}; margin: ${templateId === 'detailed' ? '15mm' : '0 auto'}; }
                }
            </style>
        `;

        const content = `
            <html>
            <head>
                <title>${isReturn ? 'Return Receipt' : 'Invoice'} - ${invoice.invoice_number}</title>
                ${style}
            </head>
            <body>
                ${isReturn ? '<div class="center bold" style="font-size: 1.3em; margin-bottom: 8px; border: 1px solid black; padding: 2px;">SALE RETURN</div>' : ''}

                ${isClinix ? clinixHeader : `
                    <div class="header">
                        ${(custom.showLogo !== false && settings.logo_url) ? `<img src="${settings.logo_url}" class="logo" />` : ''}
                        <div style="font-size: 1.4em; font-weight: bold;">${settings.name || 'CITY CARE PHARMACY'}</div>
                        ${custom.showTagline !== false ? `<div style="font-size: 0.9em; font-weight: bold; font-style: italic;">${settings.tagline || 'THE MEDICINE SUPERSTORE'}</div>` : ''}
                        <div style="font-size: 0.85em; margin-top: 3px;">
                            ${settings.address || 'PHARMACY ADDRESS'}<br/>
                            Ph: ${settings.phone_no || '000-000000'} ${settings.license_no ? ` | Lic: ${settings.license_no}` : ''}
                        </div>
                    </div>
                `}

                ${isClinix ? `
                   <div style="font-size: 0.9em; margin-bottom: 8px;">
                       <div class="row-sb">
                           <span>No . ${invoice.invoice_number || '---'}</span>
                           <span>${new Date(invoice.created_at || new Date()).toLocaleString('en-GB')}</span>
                       </div>
                       <div style="margin-top: 2px;">
                           M/s: ${custom.showCustomer !== false ? (invoice.customer_name || 'WALKING CUSTOMER') : 'WALKING CUSTOMER'} A/C
                       </div>
                       <div style="margin-top: 2px;">
                           Remarks: ${(invoice.remarks || invoice.user?.name || 'ADMIN').toUpperCase()}
                       </div>
                   </div>

                    ${(() => {
                    const hasPercentDisc = invoice.items.some(it => (it.discount_percent || 0) > 0);
                    const hasAmountDisc = invoice.items.some(it => (it.discount_amount || 0) > 0);
                    let discHeader = 'Disc';
                    if (invoice.discount_mode === 'Percent' || hasPercentDisc) discHeader = 'Disc %';
                    else if (invoice.discount_mode === 'Value' || hasAmountDisc) discHeader = 'Disc Rs';

                    return `
                            <div class="clinix-table-header">
                                <span>Item Name</span>
                                <span class="center">Qty</span>
                                <span class="center">Price</span>
                                <span class="center">GST %</span>
                                <span class="center">${discHeader}</span>
                                <span class="right">Total</span>
                            </div>
                        `;
                })()}

                   ${invoice.items.map(item => {
                    const discPerc = item.discount_percent || 0;
                    const discAmt = item.discount_amount || 0;
                    const discDisplay = discPerc > 0 ? `${discPerc.toFixed(1)}%` : (discAmt > 0 ? `${discAmt.toFixed(2)}` : '0');
                    const itemName = item.product_name || (item.product && item.product.product_name) || item.name || item.medicine_name || `Item ${item.medicine_id || '---'}`;

                    return `
                           <div class="clinix-row">
                               <span style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                                    ${itemName}
                               </span>
                               <span class="center">${item.quantity || item.qty || 0}</span>
                               <span class="center">${(item.unit_price || 0).toFixed(2)}</span>
                               <span class="center">${(item.tax_percent || 0)}%</span>
                               <span class="center">${discDisplay}</span>
                               <span class="right">${(item.total_price || 0).toFixed(2)}</span>
                           </div>
                       `;
                }).join('')}

                   <div class="clinix-divider"></div>

                   <div style="font-size: 0.95em;">
                       <div>Total items: ${invoice.items.length}</div>
                       <div class="row-sb" style="margin-top: 5px;">
                            <span class="center" style="width: 100%;">Gross Total :</span>
                            <span class="right">${(invoice.sub_total || 0).toFixed(2)}</span>
                       </div>
                       ${invoice.tax_amount > 0 ? `
                           <div class="row-sb">
                               <span class="center" style="width: 100%;">GST Amount :</span>
                               <span class="right">${invoice.tax_amount.toFixed(2)}</span>
                           </div>
                       ` : ''}
                       ${invoice.discount_amount > 0 ? `
                           <div class="row-sb">
                               <span class="center" style="width: 100%;">Discount :</span>
                               <span class="right">-${invoice.discount_amount.toFixed(2)}</span>
                           </div>
                       ` : ''}
                       <div class="row-sb" style="margin-top: 15px; font-weight: bold; font-size: 1.1em;">
                            <span>${invoice.user?.name || ''}</span>
                            <span style="margin-left: auto;">Net Total.</span>
                            <span style="margin-left: 20px;">${Math.abs(invoice.net_total || 0).toFixed(2)}</span>
                       </div>
                   </div>

                   <div class="center" style="font-size: 0.7em; margin-top: 20px; border-top: 1px solid #000; padding-top: 5px;">
                        (Computer Software developed by Antigravity AI<br/> Ph 042-3742xxx-xx)
                   </div>

                ` : `
                    <!-- STANDARD / DEFAULT TEMPLATE LOGIC -->
                    <div class="divider"></div>
                    <div style="margin-bottom: 8px; font-size: 0.95em;">
                        <div class="row">
                            <span><span class="bold">${isReturn ? 'Ret. No:' : 'Invoice #:'}</span> ${isReturn ? (invoice.return_number || 'REV-' + invoice.id) : (invoice.invoice_number || '---')}</span>
                            <span><span class="bold">POS No:</span> ${invoice.id || '---'}</span>
                        </div>
                        <div class="row">
                            <span><span class="bold">Cashier:</span> ${custom.showCashier !== false ? (invoice.user?.name || 'ADMIN') : '---'}</span>
                            <span>${new Date(invoice.created_at || new Date()).toLocaleString()}</span>
                        </div>
                        <div class="row">
                            <span><span class="bold">Mode:</span> ${invoice.payment_method || 'Cash'}</span>
                        </div>
                         <div class="row">
                            <span><span class="bold">Customer:</span> ${invoice.customer_name || 'Walk-in Customer'}</span>
                        </div>
                    </div>

                    <div class="table-header">
                        <div class="row">
                            <span style="width: 10%">#</span><span style="flex: 1">Description</span><span style="width: 25%; text-align: right">Total</span>
                        </div>
                    </div>

                    ${invoice.items.map((item, i) => {
                    const itemName = item.product_name || (item.product && item.product.product_name) || item.name || item.medicine_name || `Item ${item.medicine_id || '---'}`;
                    const lineTax = (item.unit_price * (item.quantity || 0)) * ((item.tax_percent || 0) / 100);
                    return `
                        <div class="item-row">
                            <div class="row">
                                <span style="width: 10%">${i + 1}</span>
                                <span style="flex: 1">${itemName}</span>
                                <span style="width: 25%; text-align: right" class="bold">${(item.total_price || 0).toFixed(2)}</span>
                            </div>
                            <div style="font-size: 0.8em; padding-left: 10%; opacity: 0.7;">
                                ${item.unit_price || 0} x ${item.quantity || item.qty || 0}
                                ${item.tax_percent > 0 ? `| GST ${item.tax_percent}% (${lineTax.toFixed(2)})` : ''}
                            </div>
                        </div>
                    `}).join('')}

                    <div class="divider"></div>
                    <div class="footer-sections">
                         ${invoice.tax_amount > 0 ? `
                             <div class="row">
                                <span>TAX AMOUNT:</span>
                                <span>${invoice.tax_amount.toFixed(2)}</span>
                             </div>
                         ` : ''}
                         ${invoice.discount_amount > 0 ? `
                             <div class="row">
                                <span>DISCOUNT:</span>
                                <span>-${invoice.discount_amount.toFixed(2)}</span>
                             </div>
                         ` : ''}
                         <div class="row big-total">
                            <span>NET PAYABLE:</span>
                            <span>${invoice.net_total.toFixed(2)}</span>
                         </div>
                    </div>

                    <div class="footer">
                        <div class="center" style="margin-top: 15px; font-size: 0.9em;">
                            ${settings.footer_text || 'Thank you for your visit!'}
                        </div>
                    </div>
                `}

                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `;

        win.document.write(content);
        win.document.close();
    };

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>Sales Invoice History</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                            className="input-field"
                            style={{ width: '120px' }}
                            value={filters.status}
                            onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                        >
                            <option value="All">All Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Hold">Held Bills</option>
                        </select>
                        <input
                            type="date" className="input-field" style={{ width: '130px' }}
                            value={filters.start} onChange={e => setFilters(p => ({ ...p, start: e.target.value }))}
                        />
                        <span style={{ color: 'var(--text-secondary)' }}>to</span>
                        <input
                            type="date" className="input-field" style={{ width: '130px' }}
                            value={filters.end} onChange={e => setFilters(p => ({ ...p, end: e.target.value }))}
                        />
                        {(filters.start || filters.end || filters.status !== 'All') && (
                            <button onClick={() => setFilters({ start: '', end: '', status: 'All' })} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>Clear</button>
                        )}
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'var(--surface)' }}>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', background: 'var(--surface)' }}>Invoice #</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', background: 'var(--surface)' }}>Date & Time</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', background: 'var(--surface)' }}>Items</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'right', background: 'var(--surface)' }}>Total Amount</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'right', background: 'var(--surface)' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}>Loading...</td></tr>
                            ) : invoices
                                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                .map(inv => (
                                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px', fontWeight: 'bold' }}>
                                            {inv.invoice_number}
                                            {inv.status === 'Hold' && <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#f59e0b', color: 'black', padding: '2px 6px', borderRadius: '4px' }}>HELD</span>}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                                            {new Date(inv.created_at).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '16px' }}>{inv.items.length} items</td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold' }}>
                                            PKR {inv.net_total.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => printReceipt(inv)}
                                                style={{ background: 'transparent', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Printer size={16} /> Print
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <PaginationControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(invoices.length / pageSize)}
                    pageSize={pageSize}
                    totalItems={invoices.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                    }}
                />
            </div>
        </div>
    );
};

const SuperAdminOverview = ({ setActiveView }) => {
    const [stats, setStats] = useState({
        total_tenants: 0,
        active_tenants: 0,
        pending_payments: 0,
        total_payments: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/stats`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchStats(); }, []);

    const StatCard = ({ title, value, icon, color, onClick }) => (
        <div className="glass-card fade-in" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{title}</span>
                <div style={{ padding: '8px', borderRadius: '8px', background: `${color}15`, color: color }}>
                    {icon}
                </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{loading ? '...' : value}</div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <h2 style={{ margin: '0 0 8px 0' }}>SuperAdmin Dashboard</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>System-wide overview and management</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <StatCard
                    title="Total Pharmacies"
                    value={stats.total_tenants}
                    icon={<Building2 size={20} />}
                    color="#3b82f6"
                    onClick={() => setActiveView('Pharmacies')}
                />
                <StatCard
                    title="Active Tenants"
                    value={stats.active_tenants}
                    icon={<ShieldCheck size={20} />}
                    color="#10b981"
                    onClick={() => setActiveView('Pharmacies')}
                />
                <StatCard
                    title="Pending Reviews"
                    value={stats.pending_payments}
                    icon={<AlertCircle size={20} />}
                    color="#f59e0b"
                    onClick={() => setActiveView('Software Payments Review')}
                />
                <StatCard
                    title="Total Payments"
                    value={stats.total_payments}
                    icon={<CreditCard size={20} />}
                    color="#a855f7"
                    onClick={() => setActiveView('Software Payments Review')}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="glass-card">
                    <h3 style={{ margin: '0 0 20px 0' }}>Quick Actions</h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button className="btn-primary" onClick={() => setActiveView('Pharmacies')}>
                            <Plus size={18} /> Register New Pharmacy
                        </button>
                        <button className="btn-secondary" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }} onClick={() => setActiveView('Software Payments Review')}>
                            <ListIcon size={18} /> Review Payments
                        </button>
                    </div>
                </div>

                <div className="glass-card">
                    <h3 style={{ margin: '0 0 20px 0' }}>System Status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span style={{ fontSize: '0.9rem' }}>API Backend: Online</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span style={{ fontSize: '0.9rem' }}>Database Cluster: Healthy</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span style={{ fontSize: '0.9rem' }}>Storage Service: Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const TenantManager = ({ openConfirm }) => {
    const [view, setView] = useState('list'); // list, create, edit
    const [editingTenant, setEditingTenant] = useState(null);

    const handleBack = () => {
        setView('list');
        setEditingTenant(null);
    };

    const handleEdit = (tenant) => {
        setEditingTenant(tenant);
        setView('edit');
    };

    if (view === 'create') {
        return (
            <div className='glass-card fade-in' style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <h3 style={{ margin: 0 }}>Register New Pharmacy</h3>
                </div>
                <TenantCreateForm onSuccess={handleBack} onCancel={handleBack} />
            </div>
        );
    }

    if (view === 'edit') {
        return (
            <div className='glass-card fade-in' style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <h3 style={{ margin: 0 }}>Edit Pharmacy: {editingTenant.name}</h3>
                </div>
                <TenantEditForm tenant={editingTenant} onSuccess={handleBack} onCancel={handleBack} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Pharmacy Management</h2>
                <button className='btn-primary' onClick={() => setView('create')}>
                    <Plus size={18} /> Register New Pharmacy
                </button>
            </div>

            <TenantList onEdit={handleEdit} openConfirm={openConfirm} />

            <div className='glass-card'>
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

const SoftwarePaymentManager = ({ tenantId }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [formData, setFormData] = useState({
        valid_from: '',
        valid_to: '',
        receipt: null
    });

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/software-payments/my`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                }
            });
            const data = await res.json();
            setPayments(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPayments(); }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, receipt: file });
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleEdit = (payment) => {
        setEditingId(payment.id);
        setFormData({
            valid_from: payment.valid_from.split('T')[0],
            valid_to: payment.valid_to.split('T')[0],
            receipt: null
        });
        setPreviewUrl(`${API_BASE_URL.replace('/api', '')}/${payment.receipt_path}`);
        setShowUpload(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('valid_from', formData.valid_from);
        data.append('valid_to', formData.valid_to);
        if (formData.receipt) {
            data.append('receipt', formData.receipt);
        }

        try {
            const url = editingId
                ? `${API_BASE_URL}/software-payments/${editingId}`
                : `${API_BASE_URL}/software-payments/`;
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: data
            });
            if (res.ok) {
                setShowUpload(false);
                setEditingId(null);
                setPreviewUrl(null);
                fetchPayments();
                setFormData({ valid_from: '', valid_to: '', receipt: null });
                showSuccess(`Payment ${editingId ? 'updated' : 'submitted'} successfully`);
            } else {
                showError(`Failed to ${editingId ? 'update' : 'submit'} payment`);
            }
        } catch (err) {
            console.error(err);
            showError("An error occurred during submission");
        }
    };

    const closeForm = () => {
        setShowUpload(false);
        setEditingId(null);
        setPreviewUrl(null);
        setFormData({ valid_from: '', valid_to: '', receipt: null });
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Software Payments</h2>
                {!showUpload && (
                    <button className="btn-primary" onClick={() => setShowUpload(true)}>
                        <Plus size={18} /> New Payment
                    </button>
                )}
            </div>

            {showUpload && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 1fr', gap: '24px', alignItems: 'start' }}>
                    <div className="glass-card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>{editingId ? 'Update Receipt' : 'Upload Receipt'}</h3>
                            <button onClick={closeForm} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Valid From</label>
                                    <input type="date" required className="input-field" value={formData.valid_from} onChange={e => setFormData({ ...formData, valid_from: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Valid To</label>
                                    <input type="date" required className="input-field" value={formData.valid_to} onChange={e => setFormData({ ...formData, valid_to: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Receipt (Image/PDF)</label>
                                <input type="file" required={!editingId} className="input-field" onChange={handleFileChange} />
                            </div>
                            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                                {editingId ? 'Update Payment' : 'Submit Payment'}
                            </button>
                        </form>
                    </div>

                    {previewUrl && (
                        <div className="glass-card fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ margin: '0 0 20px 0' }}>Receipt Preview</h3>
                            <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', minHeight: '300px' }}>
                                {previewUrl.toLowerCase().endsWith('.pdf') ? (
                                    <embed src={previewUrl} type="application/pdf" width="100%" height="400px" />
                                ) : (
                                    <img src={previewUrl} alt="Receipt Preview" style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '400px', objectFit: 'contain' }} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="glass-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Receipt</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Valid From</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Valid To</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Status</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading payments...</td></tr>
                        ) : payments.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No payment history found.</td></tr>
                        ) : payments.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                                        {p.receipt_path.toLowerCase().endsWith('.pdf') ? (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>PDF</div>
                                        ) : (
                                            <img src={`${API_BASE_URL.replace('/api', '')}/${p.receipt_path}`} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>{new Date(p.valid_from).toLocaleDateString()}</td>
                                <td style={{ padding: '16px' }}>{new Date(p.valid_to).toLocaleDateString()}</td>
                                <td style={{ padding: '16px' }}>
                                    <span className={`badge ${p.status === 'approved' ? 'badge-success' : p.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                                        {p.status.toUpperCase()}
                                    </span>
                                    {p.rejection_reason && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '4px' }}>Reason: {p.rejection_reason}</div>
                                    )}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {p.status === 'pending' && (
                                            <button className="btn-icon" onClick={() => handleEdit(p)} title="Edit Pending Payment" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                        <a href={`${API_BASE_URL.replace('/api', '')}/${p.receipt_path}`} target="_blank" rel="noreferrer" className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }} title="View Receipt">
                                            <Eye size={16} />
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SoftwarePaymentReview = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tenants, setTenants] = useState({});

    // Approval Modal State
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [approvalDates, setApprovalDates] = useState({ valid_from: '', valid_to: '' });

    // Rejection Modal State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, tRes] = await Promise.all([
                fetch(`${API_BASE_URL}/software-payments/all`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
                fetch(`${API_BASE_URL}/tenants/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
            ]);
            const pData = await pRes.json();
            const tData = await tRes.json();
            setPayments(Array.isArray(pData) ? pData : []);
            const tMap = {};
            tData.forEach(t => tMap[t.id] = t.name);
            setTenants(tMap);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApproveClick = (payment) => {
        setSelectedPayment(payment);
        setApprovalDates({
            valid_from: payment.valid_from.split('T')[0],
            valid_to: payment.valid_to.split('T')[0]
        });
        setApproveModalOpen(true);
    };

    const handleRejectClick = (payment) => {
        setSelectedPayment(payment);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const confirmApprove = async () => {
        if (!selectedPayment) return;

        try {
            await fetch(`${API_BASE_URL}/software-payments/${selectedPayment.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'approved',
                    valid_from: approvalDates.valid_from,
                    valid_to: approvalDates.valid_to
                })
            });
            setApproveModalOpen(false);
            setSelectedPayment(null);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const confirmReject = async () => {
        if (!selectedPayment || !rejectionReason) return;

        try {
            await fetch(`${API_BASE_URL}/software-payments/${selectedPayment.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'rejected', rejection_reason: rejectionReason })
            });
            setRejectModalOpen(false);
            setSelectedPayment(null);
            fetchData();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ margin: 0 }}>Software Payment Reviews</h2>
            <div className="glass-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Pharmacy</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Validity</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Receipt</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Status</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No payment submissions</td></tr>
                        ) : payments.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '16px', fontWeight: 'bold' }}>{tenants[p.tenant_id] || `ID: ${p.tenant_id}`}</td>
                                <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                                    {new Date(p.valid_from).toLocaleDateString()} - {new Date(p.valid_to).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <a href={`${API_BASE_URL.replace('/api', '')}/${p.receipt_path}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>View Receipt</a>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        background: p.status === 'approved' ? '#10b98120' : p.status === 'rejected' ? '#f43f5e20' : '#f59e0b20',
                                        color: p.status === 'approved' ? '#10b981' : p.status === 'rejected' ? '#f43f5e' : '#f59e0b'
                                    }}>
                                        {p.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    {p.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleApproveClick(p)} className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Approve</button>
                                            <button onClick={() => handleRejectClick(p)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Approval Modal */}
            {approveModalOpen && createPortal(
                <div className="fade-in" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }}>
                    <div className="glass-card" style={{ width: '400px', padding: '24px', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Approve Payment</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                            Please confirm the validity period for this subscription.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Valid From</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={approvalDates.valid_from}
                                    onChange={e => setApprovalDates({ ...approvalDates, valid_from: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Valid To</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={approvalDates.valid_to}
                                    onChange={e => setApprovalDates({ ...approvalDates, valid_to: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setApproveModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" onClick={confirmApprove}>Confirm Approval</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Rejection Modal */}
            {rejectModalOpen && createPortal(
                <div className="fade-in" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }}>
                    <div className="glass-card" style={{ width: '400px', padding: '24px', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Reject Payment</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                            Please provide a reason for rejecting this payment.
                        </p>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Reason</label>
                            <textarea
                                className="input-field"
                                style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                                placeholder="e.g. Invalid receipt, Incorrect amount..."
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setRejectModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" style={{ background: '#ef4444' }} onClick={confirmReject}>Confirm Reject</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const TenantCreateForm = ({ onSuccess, onCancel }) => {
    const [name, setName] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [adminUser, setAdminUser] = useState('');
    const [adminPass, setAdminPass] = useState('');
    const [isTrial, setIsTrial] = useState(false);
    const [trialEndDate, setTrialEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

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
                    admin_password: adminPass,
                    is_trial: isTrial,
                    trial_end_date: isTrial ? trialEndDate : null
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to create tenant');
            }

            showSuccess(`Tenant ${name} registered successfully!`);
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
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

            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <input
                    type="checkbox"
                    id="isTrial"
                    checked={isTrial}
                    onChange={e => setIsTrial(e.target.checked)}
                />
                <label htmlFor="isTrial" style={{ margin: 0 }}>Free Trial?</label>
            </div>

            {isTrial && (
                <div className="input-group fade-in">
                    <label>Trial End Date</label>
                    <input
                        type="date"
                        className="input-field"
                        value={trialEndDate}
                        onChange={e => setTrialEndDate(e.target.value)}
                        required={isTrial}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
            )}
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Register Pharmacy'}
            </button>
            {error && (
                <div style={{ marginTop: '16px', color: '#f43f5e', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}
        </form>
    );
};

const TenantEditForm = ({ tenant, onSuccess, onCancel }) => {
    const [name, setName] = useState(tenant.name);
    const [isActive, setIsActive] = useState(tenant.is_active);
    const [isTrial, setIsTrial] = useState(tenant.is_trial || false);
    const [trialEndDate, setTrialEndDate] = useState(tenant.trial_end_date ? tenant.trial_end_date.split('T')[0] : '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/tenants/${tenant.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name,
                    is_active: isActive,
                    is_trial: isTrial,
                    trial_end_date: isTrial ? trialEndDate : null
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to update tenant');
            }

            showSuccess(`Tenant ${name} updated successfully!`);
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleUpdate}>
            <div className="input-group">
                <label>Pharmacy Name</label>
                <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActive" style={{ margin: 0 }}>Is Active</label>

                <input
                    type="checkbox"
                    id="isTrialEdit"
                    checked={isTrial}
                    onChange={e => setIsTrial(e.target.checked)}
                    style={{ marginLeft: '16px' }}
                />
                <label htmlFor="isTrialEdit" style={{ margin: 0 }}>Free Trial</label>
            </div>

            {isTrial && (
                <div className="input-group fade-in" style={{ marginTop: '16px' }}>
                    <label>Trial End Date</label>
                    <input
                        type="date"
                        className="input-field"
                        value={trialEndDate}
                        onChange={e => setTrialEndDate(e.target.value)}
                        required={isTrial}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Update Pharmacy'}
                </button>
            </div>
            {error && (
                <div style={{ marginTop: '16px', color: '#f43f5e', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}
        </form>
    );
};

const TenantList = ({ onEdit, openConfirm }) => {
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
        openConfirm({
            title: 'Remove Pharmacy',
            message: 'Are you sure you want to remove this pharmacy? This will delete all associated data and cannot be undone.',
            onConfirm: async () => {
                try {
                    await fetch(`${API_BASE_URL}/tenants/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    fetchTenants();
                } catch (err) { console.error(err); }
            },
            confirmText: 'Remove Pharmacy',
            type: 'danger'
        });
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ color: t.is_active ? '#10b981' : '#ef4444', fontSize: '0.85rem' }}>
                                        {t.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    {t.is_trial && (
                                        <span style={{ fontSize: '0.75rem', color: '#f59e0b', background: '#f59e0b20', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                                            Trial: {new Date(t.trial_end_date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => onEdit(t)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
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
                fetch(`${API_BASE_URL} /inventory/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')} `, 'X-Tenant-ID': tenantId } }),
                fetch(`${API_BASE_URL} /categories/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')} `, 'X-Tenant-ID': tenantId } }),
                fetch(`${API_BASE_URL} /manufacturers/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')} `, 'X-Tenant-ID': tenantId } }),
                fetch(`${API_BASE_URL} /stores/`, { headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')} ` } })
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
                                                <div style={{ width: `${Math.min(100, (totalStock / m.reorder_level) * 25)}% `, height: '100%', background: healthColor, borderRadius: '3px' }}></div>
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
            if (res.ok) {
                showSuccess("Transfer Successful");
                fetchData();
            }
            else {
                const err = await res.json();
                showError(err.detail);
            }
        } catch (e) {
            showError("Transfer failed");
        }
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
            if (res.ok) {
                showSuccess("Supplier added successfully");
                setShowAdd(false);
                fetchData();
            } else {
                const err = await res.json();
                showError(err.detail || "Failed to add supplier");
            }
        } catch (e) {
            showError("Failed to add supplier");
        }
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
                                <td style={{ padding: '20px', color: '#10b981' }}>PKR {s.ledger_balance?.toFixed(2) || '0.00'}</td>
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
                                <td>PKR {o.total_amount.toFixed(2)}</td>
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
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Credit: PKR {p.outstanding_balance}</span>
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
                            <span style={{ color: '#10b981', fontWeight: '700' }}>+PKR {d.total_profit.toFixed(2)}</span>
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

const SuperAdminProfile = () => {
    const [profile, setProfile] = useState({ username: '', email: '' });
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/me`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setProfile(await res.json());
        } catch (e) {
            showError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const body = { username: profile.username, email: profile.email };
            if (password) body.password = password;

            const res = await fetch(`${API_BASE_URL}/superadmin/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showSuccess("Profile updated successfully");
                setPassword('');
                fetchProfile();
            } else {
                const err = await res.json();
                showError(err.detail || "Update failed");
            }
        } catch (e) {
            showError("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="glass-card">Loading profile...</div>;

    return (
        <div className="fade-in glass-card" style={{ maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '24px' }}>Update SuperAdmin Profile</h3>
            <form onSubmit={handleUpdate}>
                <div className="input-group">
                    <label>Username</label>
                    <input
                        type="text"
                        className="input-field"
                        value={profile.username}
                        onChange={e => setProfile({ ...profile, username: e.target.value })}
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        className="input-field"
                        value={profile.email}
                        onChange={e => setProfile({ ...profile, email: e.target.value })}
                        required
                    />
                </div>
                <div className="input-group">
                    <label>New Password (leave blank to keep current)</label>
                    <input
                        type="password"
                        className="input-field"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '24px' }} disabled={saving}>
                    {saving ? 'Saving...' : 'Update Details'}
                </button>
            </form>
        </div>
    );
};

export default Dashboard;
