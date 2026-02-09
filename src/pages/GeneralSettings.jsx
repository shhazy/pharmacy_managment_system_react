import React, { useState, useEffect } from 'react';
import { Save, Building, Phone, FileText, Globe, Mail, MapPin, Upload, Palette, Settings, Receipt, Printer, CheckCircle } from 'lucide-react';
import { API_BASE_URL, appSettingsAPI } from '../services/api';

const themes = {
    light: {
        '--background': '#f1f5f9', // Slate-100
        '--surface': '#ffffff',
        '--primary': '#3b82f6',
        '--text-primary': '#0f172a', // Slate-900 (Dark text)
        '--text-secondary': '#64748b', // Slate-500
        '--border': '#cbd5e1', // Slate-300
        '--glass': 'rgba(255, 255, 255, 0.7)',
        '--glass-border': 'rgba(0, 0, 0, 0.1)'
    },
    dark: {
        '--background': '#0f172a',
        '--surface': '#1e293b',
        '--primary': '#6366f1',
        '--text-primary': '#f8fafc',
        '--text-secondary': '#94a3b8',
        '--border': 'rgba(255, 255, 255, 0.1)',
        '--glass': 'rgba(255, 255, 255, 0.03)',
        '--glass-border': 'rgba(255, 255, 255, 0.08)'
    }
};

const GeneralSettings = ({ tenantId }) => {
    const [activeTab, setActiveTab] = useState('about');
    const [settings, setSettings] = useState({
        name: '',
        tagline: '',
        phone_no: '',
        license_no: '',
        address: '',
        email: '',
        logo_url: '',
        theme_config: themes.dark // Default
    });
    const [appSettings, setAppSettings] = useState({
        default_listing_rows: 10,
        sale_module: 'FIFO'
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchSettings();
        fetchAppSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/settings`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (Object.keys(data).length > 0) {
                    setSettings(prev => ({ ...prev, ...data }));
                    if (data.theme_config) applyTheme(data.theme_config);
                }
            }
        } catch (err) {
            console.error("Failed to load settings", err);
        }
    };

    const fetchAppSettings = async () => {
        try {
            const data = await appSettingsAPI.get(tenantId);
            if (data) setAppSettings(data);
        } catch (err) {
            console.error("Failed to load app settings", err);
        }
    };

    const applyTheme = (theme) => {
        Object.keys(theme).forEach(key => {
            document.documentElement.style.setProperty(key, theme[key]);
        });
        // Force re-paint of key elements
        document.body.style.color = theme['--text-primary'];
        document.body.style.backgroundColor = theme['--background'];
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        try {
            const isAppSetting = activeTab === 'app' || activeTab === 'invoice';
            const endpoint = isAppSetting ? '/app-settings' : '/settings';
            const bodyData = isAppSetting ? appSettings : settings;

            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify(bodyData)
            });
            if (res.ok) {
                setMsg('Settings saved successfully!');
                if (activeTab !== 'app') applyTheme(settings.theme_config);
                setTimeout(() => setMsg(''), 3000);
            } else {
                setMsg('Failed to save settings.');
            }
        } catch (err) {
            setMsg('Error saving settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings({ ...settings, logo_url: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleThemeChange = (key, value) => {
        const newTheme = { ...settings.theme_config, [key]: value };
        setSettings({ ...settings, theme_config: newTheme });
        applyTheme(newTheme); // Preview immediately
    };

    return (
        <div className="fade-in" style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 140px)' }}>
            {/* Settings Sidebar */}
            <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => setActiveTab('about')} style={tabStyle(activeTab === 'about')}>
                    <Building size={18} /> About Pharmacy
                </button>
                <button onClick={() => setActiveTab('theme')} style={tabStyle(activeTab === 'theme')}>
                    <Palette size={18} /> Theme Setting
                </button>
                <button onClick={() => setActiveTab('app')} style={tabStyle(activeTab === 'app')}>
                    <Settings size={18} /> App Settings
                </button>
                <button onClick={() => setActiveTab('invoice')} style={tabStyle(activeTab === 'invoice')}>
                    <FileText size={18} /> Invoice Template
                </button>
            </div>

            {/* Content Area */}
            <div className="glass-card" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                {/* Header & Save Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
                            {activeTab === 'about' ? 'General Settings' :
                                activeTab === 'theme' ? 'Theme Settings' :
                                    activeTab === 'app' ? 'App Settings' : 'Invoice Template'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {activeTab === 'about' ? 'Manage public profile and legal info.' :
                                activeTab === 'theme' ? 'Customize the look and feel of your app.' :
                                    activeTab === 'app' ? 'Configure global application behavior.' : 'Select and customize your POS receipt template.'}
                        </p>
                    </div>
                    <button onClick={handleSave} className="btn-primary" disabled={loading} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {msg && (
                    <div style={{
                        padding: '12px',
                        background: msg.includes('successfully') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: msg.includes('successfully') ? '#10b981' : '#ef4444',
                        borderRadius: '8px',
                        marginBottom: '24px'
                    }}>
                        {msg}
                    </div>
                )}

                {activeTab === 'about' && (
                    <form style={{ maxWidth: '800px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
                            {/* Logo Section */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Pharmacy Logo</label>
                                <div style={{
                                    width: '100%', aspectRatio: '1', background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px', border: '2px dashed var(--border)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', marginBottom: '12px', position: 'relative'
                                }}>
                                    {settings.logo_url ? (
                                        <img src={settings.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            <Upload size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                                            <div style={{ fontSize: '0.8rem' }}>No Logo</div>
                                        </div>
                                    )}
                                </div>
                                <input type="file" accept="image/*" id="logo-upload" onChange={handleLogoUpload} style={{ display: 'none' }} />
                                <label htmlFor="logo-upload" className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Upload size={16} /> Upload New
                                </label>
                            </div>

                            {/* Details Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="input-group">
                                    <label><Building size={16} /> Pharmacy Name</label>
                                    <input type="text" value={settings.name || ''} onChange={e => setSettings({ ...settings, name: e.target.value })} placeholder="e.g. City Care Pharmacy" />
                                </div>
                                <div className="input-group">
                                    <label><FileText size={16} /> Tagline</label>
                                    <input type="text" value={settings.tagline || ''} onChange={e => setSettings({ ...settings, tagline: e.target.value })} placeholder="e.g. Caring for your health" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="input-group">
                                        <label><Phone size={16} /> Phone Number</label>
                                        <input type="text" value={settings.phone_no || ''} onChange={e => setSettings({ ...settings, phone_no: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label><FileText size={16} /> Drug License No.</label>
                                        <input type="text" value={settings.license_no || ''} onChange={e => setSettings({ ...settings, license_no: e.target.value })} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label><Mail size={16} /> Email Address</label>
                                    <input type="email" value={settings.email || ''} onChange={e => setSettings({ ...settings, email: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label><MapPin size={16} /> Address</label>
                                    <textarea rows="3" value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', padding: '12px', resize: 'vertical' }} />
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {activeTab === 'theme' && (
                    <div style={{ maxWidth: '800px' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ marginBottom: '16px' }}>Presets</h3>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => {
                                        setSettings({ ...settings, theme_config: themes.light });
                                        applyTheme(themes.light);
                                    }}
                                    className="btn-secondary"
                                    style={{
                                        flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                                        background: '#f3f4f6', color: '#111827', border: '2px solid transparent'
                                    }}
                                >
                                    <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '50%' }}></div>
                                    <span style={{ fontWeight: 'bold' }}>Light Theme</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setSettings({ ...settings, theme_config: themes.dark });
                                        applyTheme(themes.dark);
                                    }}
                                    className="btn-secondary"
                                    style={{
                                        flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                                        background: '#0f172a', color: '#f8fafc', border: '2px solid transparent'
                                    }}
                                >
                                    <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '50%' }}></div>
                                    <span style={{ fontWeight: 'bold' }}>Dark Theme</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ marginBottom: '16px' }}>Custom Colors</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                {Object.keys(settings.theme_config || themes.dark).map(key => (
                                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{key.replace('--', '').replace('-', ' ').toUpperCase()}</label>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <input
                                                type="color"
                                                value={settings.theme_config?.[key] || '#000000'}
                                                onChange={e => handleThemeChange(key, e.target.value)}
                                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: 0, background: 'none' }}
                                            />
                                            <input
                                                type="text"
                                                value={settings.theme_config?.[key] || ''}
                                                onChange={e => handleThemeChange(key, e.target.value)}
                                                className="input-field"
                                                style={{ padding: '8px' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'app' && (
                    <div style={{ maxWidth: '600px' }}>
                        <div className="input-group" style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FileText size={18} /> Default Listing Rows
                            </label>
                            <input
                                type="number"
                                className="input-field"
                                style={{ padding: '12px', fontSize: '1rem' }}
                                value={appSettings.default_listing_rows}
                                onChange={e => setAppSettings({ ...appSettings, default_listing_rows: parseInt(e.target.value) || 10 })}
                                min="1"
                                max="100"
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                This controls the number of items displayed by default in tables like Stock, Products, and Invoices.
                            </p>
                        </div>

                        <div className="input-group" style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Settings size={18} /> Sale Module (Inventory Method)
                            </label>
                            <select
                                className="input-field"
                                style={{ padding: '12px', fontSize: '1rem', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '8px', border: '1px solid var(--border)', width: '100%' }}
                                value={appSettings.sale_module || 'FIFO'}
                                onChange={e => setAppSettings({ ...appSettings, sale_module: e.target.value })}
                            >
                                <option value="Default" style={{ background: '#1e293b' }}>Default (Batch-wise)</option>
                                <option value="FIFO" style={{ background: '#1e293b' }}>FIFO (First-In, First-Out)</option>
                                <option value="FEFO" style={{ background: '#1e293b' }}>FEFO (First-Expiry, First-Out)</option>
                                <option value="Avg Cost" style={{ background: '#1e293b' }}>Avg Cost (Average Costing)</option>
                            </select>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                This determines how items are selected and costed during sale. Default shows all batches individually in POS lookup. FIFO/FEFO group products and auto-select batches.
                            </p>
                        </div>

                        <div className="input-group" style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={appSettings.stock_adj_batch_required || false}
                                    onChange={e => setAppSettings({ ...appSettings, stock_adj_batch_required: e.target.checked })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: '1rem', color: 'white' }}>Batch no. required on stock adjustment</span>
                            </label>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', marginLeft: '28px' }}>
                                If checked, you must select a specific batch for every inventory adjustment. If unchecked, the system will apply adjustments to the latest batches automatically.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'invoice' && (
                    <div style={{ display: 'flex', gap: '40px' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ marginBottom: '20px' }}>Select Template</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                                {[
                                    { id: 'default', name: 'Standard Receipt', icon: <Receipt size={24} />, desc: '72mm Standard POS' },
                                    { id: 'clinix', name: 'Clinix Style', icon: <Building size={24} />, desc: 'High-Fidelity Demo' },
                                    { id: 'detailed', name: 'Detailed A4', icon: <FileText size={24} />, desc: 'Prescription Layout' },
                                    { id: 'custom', name: 'Custom Builder', icon: <Palette size={24} />, desc: 'Design your own' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            const currentConfig = appSettings.invoice_custom_config || {};
                                            const newConfig = { ...currentConfig };

                                            if (t.id === 'clinix') {
                                                newConfig.showMRP = true;
                                                newConfig.showGST = true;
                                                newConfig.showCashier = true;
                                                newConfig.showMode = true;
                                                newConfig.showRemarks = true;
                                                newConfig.headerAlign = 'center';
                                            }

                                            setAppSettings(prev => ({
                                                ...prev,
                                                invoice_template_id: t.id,
                                                invoice_custom_config: newConfig
                                            }));
                                        }}
                                        style={{
                                            padding: '20px',
                                            borderRadius: '12px',
                                            border: `2px solid ${appSettings.invoice_template_id === t.id ? 'var(--primary)' : 'var(--border)'}`,
                                            background: appSettings.invoice_template_id === t.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ color: appSettings.invoice_template_id === t.id ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                            {t.id === 'clinix' ? <Building size={24} /> : t.icon}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: 'white' }}>{t.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.desc}</div>
                                        </div>
                                        {appSettings.invoice_template_id === t.id && (
                                            <div style={{ position: 'absolute', top: '8px', right: '8px', color: 'var(--primary)' }}>
                                                <CheckCircle size={16} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <h3 style={{ marginBottom: '20px' }}>Customization</h3>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                opacity: (appSettings.invoice_template_id === 'custom' || appSettings.invoice_template_id === 'clinix') ? 1 : 0.7,
                                transition: 'opacity 0.3s'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div className="input-group">
                                        <label>Receipt Font Size (px)</label>
                                        <input
                                            type="number"
                                            value={appSettings.invoice_custom_config?.fontSize || 12}
                                            onChange={e => setAppSettings({
                                                ...appSettings,
                                                invoice_custom_config: { ...appSettings.invoice_custom_config, fontSize: parseInt(e.target.value) }
                                            })}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Header Alignment</label>
                                        <select
                                            value={appSettings.invoice_custom_config?.headerAlign || 'center'}
                                            onChange={e => setAppSettings({
                                                ...appSettings,
                                                invoice_custom_config: { ...appSettings.invoice_custom_config, headerAlign: e.target.value }
                                            })}
                                            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                                        >
                                            <option value="left" style={{ background: '#1e293b' }}>Left</option>
                                            <option value="center" style={{ background: '#1e293b' }}>Center</option>
                                            <option value="right" style={{ background: '#1e293b' }}>Right</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={appSettings.invoice_custom_config?.showLogo !== false}
                                            onChange={e => setAppSettings({
                                                ...appSettings,
                                                invoice_custom_config: { ...appSettings.invoice_custom_config, showLogo: e.target.checked }
                                            })}
                                        />
                                        Show Logo
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={appSettings.invoice_custom_config?.showTagline !== false}
                                            onChange={e => setAppSettings({
                                                ...appSettings,
                                                invoice_custom_config: { ...appSettings.invoice_custom_config, showTagline: e.target.checked }
                                            })}
                                        />
                                        Show Tagline
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={appSettings.invoice_custom_config?.showCashier !== false}
                                            onChange={e => setAppSettings({
                                                ...appSettings,
                                                invoice_custom_config: { ...appSettings.invoice_custom_config, showCashier: e.target.checked }
                                            })}
                                        />
                                        Show Cashier
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={appSettings.invoice_custom_config?.showRemarks !== false}
                                            onChange={e => setAppSettings({
                                                ...appSettings,
                                                invoice_custom_config: { ...appSettings.invoice_custom_config, showRemarks: e.target.checked }
                                            })}
                                        />
                                        Show Remarks
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={appSettings.invoice_custom_config?.showMRP === true}
                                            onChange={e => setAppSettings({
                                                ...appSettings,
                                                invoice_custom_config: { ...appSettings.invoice_custom_config, showMRP: e.target.checked }
                                            })}
                                        />
                                        Show MRP
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={appSettings.invoice_custom_config?.showGST === true}
                                            onChange={e => setAppSettings({
                                                ...appSettings,
                                                invoice_custom_config: { ...appSettings.invoice_custom_config, showGST: e.target.checked }
                                            })}
                                        />
                                        Show GST %
                                    </label>
                                </div>

                                <div className="input-group">
                                    <label>Custom Header Text (Optional)</label>
                                    <input
                                        type="text"
                                        value={appSettings.invoice_custom_config?.customHeader || ''}
                                        onChange={e => setAppSettings({
                                            ...appSettings,
                                            invoice_custom_config: { ...appSettings.invoice_custom_config, customHeader: e.target.value }
                                        })}
                                        placeholder="e.g. WELCOME TO OUR PHARMACY"
                                    />
                                </div>

                                <div className="input-group">
                                    <label>Custom Footer Message</label>
                                    <textarea
                                        rows="2"
                                        value={appSettings.invoice_custom_config?.customFooter || 'Thank you for your visit!'}
                                        onChange={e => setAppSettings({
                                            ...appSettings,
                                            invoice_custom_config: { ...appSettings.invoice_custom_config, customFooter: e.target.value }
                                        })}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', padding: '10px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div style={{ width: '320px' }}>
                            <h3 style={{ marginBottom: '20px' }}>Live Preview</h3>
                            <div style={{
                                background: 'white',
                                color: 'black',
                                padding: '20px',
                                borderRadius: '4px',
                                minHeight: '450px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                fontSize: `${appSettings.invoice_custom_config?.fontSize || 12}px`,
                                fontFamily: appSettings.invoice_template_id === 'detailed' ? 'serif' : 'monospace',
                                border: ['clinix', 'default'].includes(appSettings.invoice_template_id) ? '2px solid #000' : 'none',
                                overflow: 'hidden'
                            }}>
                                {!['clinix', 'default'].includes(appSettings.invoice_template_id) && (
                                    <>
                                        <div style={{ textAlign: appSettings.invoice_custom_config?.headerAlign || 'center', borderBottom: '1px dashed #ccc', paddingBottom: '10px', marginBottom: '10px' }}>
                                            {appSettings.invoice_custom_config?.showLogo !== false && (
                                                <div style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{settings.logo_url ? '[LOGO]' : '[PHARMACY LOGO]'}</div>
                                            )}
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{settings.name || 'CITY CARE PHARMACY'}</div>
                                            {appSettings.invoice_custom_config?.showTagline !== false && (
                                                <div style={{ fontSize: '0.8em', fontStyle: 'italic' }}>{settings.tagline || 'Caring for your health'}</div>
                                            )}
                                            {appSettings.invoice_custom_config?.customHeader && (
                                                <div style={{ marginTop: '5px', fontSize: '0.9em', border: '1px solid #ddd', padding: '2px' }}>{appSettings.invoice_custom_config.customHeader}</div>
                                            )}
                                        </div>

                                        <div style={{ fontSize: '0.9em', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Inv: #INV-001</span>
                                                <span>POS: #123</span>
                                            </div>
                                            {appSettings.invoice_custom_config?.showCashier !== false && <div>Cashier: Admin</div>}
                                            <div style={{ fontWeight: 'bold' }}>Customer: Walk-in Customer</div>
                                        </div>
                                    </>
                                )}

                                {(appSettings.invoice_template_id === 'clinix' || appSettings.invoice_template_id === 'default') ? (
                                    <div style={{ fontSize: '0.85em', fontFamily: "'Arial Narrow', sans-serif" }}>
                                        {/* Clinix Header Preview */}
                                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                                            {settings.logo_url && <img src={settings.logo_url} style={{ maxWidth: '100%', maxHeight: '50px' }} alt="Logo" />}
                                            <div style={{ background: 'black', color: 'white', padding: '2px 0', fontWeight: 'bold', fontSize: '0.9em', margin: '4px 0' }}>{settings.tagline || 'THE MEDICINE SUPERSTORE'}</div>
                                            <div>{settings.name || 'Bukhtiari Pharmacy'}</div>
                                            <div style={{ fontSize: '0.9em' }}>{settings.address || 'Amna Plaza Block#16...'}</div>
                                            <div style={{ fontSize: '0.9em' }}>Ph: 065-2554412</div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                            <span>No. 6459</span>
                                            <span>{new Date().toLocaleDateString('en-GB')}</span>
                                        </div>
                                        <div style={{ marginBottom: '2px' }}>M/s: WALKING CUSTOMER A/C</div>
                                        <div style={{ marginBottom: '8px' }}>Remarks: ADMIN</div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 40px 50px', fontWeight: 'bold', borderTop: '1px solid black', borderBottom: '1px solid black', padding: '3px 0', marginBottom: '5px' }}>
                                            <span>Item Name</span><span style={{ textAlign: 'center' }}>Qty</span><span style={{ textAlign: 'center' }}>Price</span><span style={{ textAlign: 'right' }}>Total</span>
                                        </div>
                                        {[1, 2].map(i => (
                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 30px 40px 50px', marginBottom: '4px' }}>
                                                <div>
                                                    <div>Sample Product {i}</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>1</div>
                                                <div style={{ textAlign: 'center' }}>620.00</div>
                                                <div style={{ textAlign: 'right' }}>620.00</div>
                                            </div>
                                        ))}

                                        <div style={{ borderTop: '1px solid black', marginTop: '5px', paddingTop: '5px' }}>
                                            <div>Total items: 2</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                                <span>Gross Total :</span>
                                                <span>1240.00</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '10px', fontSize: '1.1em' }}>
                                                <span>{/* Cashier Name Removed */}</span>
                                                <span>Net Total.</span>
                                                <span>1240.00</span>
                                            </div>
                                        </div>

                                        <div style={{
                                            fontSize: '0.7em',
                                            textAlign: 'center',
                                            marginTop: '15px',
                                            borderTop: '1px solid #000',
                                            paddingTop: '5px'
                                        }}>
                                            (Computer Software developed by Antigravity AI<br /> Ph 042-3742xxx-xx)
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ borderBottom: '1px dashed #ccc', marginBottom: '5px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Item Name</span>
                                            <span>Total</span>
                                        </div>
                                        {[1, 2].map(i => (
                                            <div key={i} style={{ marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Sample Item {i}</span>
                                                    <span>100.00</span>
                                                </div>
                                                <div style={{ fontSize: '0.8em', opacity: 0.6 }}>100.00 x 1</div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                <div style={{ borderTop: '1px dashed #ccc', marginTop: '10px', paddingTop: '5px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Sub Total:</span>
                                        <span>200.00</span>
                                    </div>
                                    {appSettings.invoice_custom_config?.showGST && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>GST (18%):</span>
                                            <span>36.00</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em', marginTop: '5px', borderTop: '1px solid #000', paddingTop: '3px' }}>
                                        <span>TOTAL</span>
                                        <span>{appSettings.invoice_custom_config?.showGST ? '236.00' : '200.00'}</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9em', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                                    {appSettings.invoice_custom_config?.customFooter || 'Thank you for your visit!'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const tabStyle = (isActive) => ({
    padding: '12px 16px',
    background: isActive ? 'var(--primary)' : 'transparent',
    color: isActive ? 'white' : 'var(--text-secondary)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    fontWeight: isActive ? '600' : '400'
});

export default GeneralSettings;
