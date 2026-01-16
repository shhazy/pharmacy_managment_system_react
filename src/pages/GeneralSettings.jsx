import React, { useState, useEffect } from 'react';
import { Save, Building, Phone, FileText, Globe, Mail, MapPin, Upload, Palette } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

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
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchSettings();
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
            const res = await fetch(`${API_BASE_URL}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setMsg('Settings saved successfully!');
                applyTheme(settings.theme_config); // Ensure applied on save
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
            </div>

            {/* Content Area */}
            <div className="glass-card" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                {/* Header & Save Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
                            {activeTab === 'about' ? 'General Settings' : 'Theme Settings'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {activeTab === 'about' ? 'Manage public profile and legal info.' : 'Customize the look and feel of your app.'}
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
                        background: msg.includes('Success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: msg.includes('Success') ? '#10b981' : '#ef4444',
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
