import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Save, X, Shield, Check } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { showError, showSuccess } from '../utils/toast';

const RolesManager = ({ tenantId, onBack, currentUser }) => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('list'); // list, add, edit
    const [editingRole, setEditingRole] = useState(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', description: '', permission_ids: [] });

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/roles`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) setRoles(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchPermissions = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/permissions`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) setPermissions(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!formData.name) return showError("Role name is required");

        setLoading(true);
        try {
            const endpoint = editingRole ? `/roles/${editingRole.id}` : '/roles';
            const method = editingRole ? 'PUT' : 'POST';

            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showSuccess(`Role ${editingRole ? 'updated' : 'created'} successfully`);
                fetchRoles();
                setView('list');
            } else {
                const err = await res.json();
                showError(err.detail || "Failed to save role");
            }
        } catch (e) {
            showError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/roles/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) {
                showSuccess("Role deleted");
                fetchRoles();
            } else {
                showError("Failed to delete role");
            }
        } catch (e) { showError("Error deleting role"); }
    };

    const startEdit = (role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            permission_ids: role.permissions.map(p => p.id)
        });
        setView('edit');
    };

    const togglePermission = (permId) => {
        setFormData(prev => {
            const ids = new Set(prev.permission_ids);
            if (ids.has(permId)) ids.delete(permId);
            else ids.add(permId);
            return { ...prev, permission_ids: Array.from(ids) };
        });
    };

    // Group permissions by Module
    const groupedPermissions = permissions.reduce((acc, p) => {
        const module = p.module || 'Other';
        if (!acc[module]) acc[module] = [];
        acc[module].push(p);
        return acc;
    }, {});

    const modules = Object.keys(groupedPermissions).sort();
    const actions = ['view', 'create', 'edit', 'delete'];

    if (view === 'list') {
        return (
            <div className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield size={20} className="text-primary" /> Role Management
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onBack} className="btn-secondary" style={{ padding: '8px 16px' }}>Back</button>
                        <button onClick={() => { setEditingRole(null); setFormData({ name: '', description: '', permission_ids: [] }); setView('add'); }} className="btn-primary" style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Plus size={16} /> New Role
                        </button>
                    </div>
                </div>

                <div className="glass-card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Role Name</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Description</th>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)' }}>Permissions</th>
                                <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(role => (
                                <tr key={role.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{role.name}</td>
                                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{role.description || '-'}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
                                            {role.permissions.length} access points
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                            {['Admin', 'Manager'].includes(role.name) ? (
                                                <span title="System Role" style={{ cursor: 'not-allowed', opacity: 0.5 }}><Edit2 size={18} /></span>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(role)} className="icon-btn text-primary"><Edit2 size={18} /></button>
                                                    <button onClick={() => handleDelete(role.id)} className="icon-btn text-error"><Trash2 size={18} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
                <button onClick={() => setView('list')} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
            </div>

            <div className="glass-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Role Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="input-field"
                            placeholder="e.g. Senior Pharmacist"
                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="input-field"
                            placeholder="Brief description of responsibilities"
                            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white' }}
                        />
                    </div>
                </div>

                <h4 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Permission Matrix</h4>

                {permissions.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No permissions found.
                    </div>
                ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
                        {modules.map(module => (
                            <div key={module} style={{
                                display: 'flex',
                                alignItems: 'flex-start', // Align to top in case of wrapping
                                padding: '16px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                gap: '24px'
                            }}>
                                {/* Left Side: Module Path */}
                                <div style={{ minWidth: '200px', width: '250px', fontWeight: '500', color: 'white', paddingTop: '2px' }}>
                                    {module.includes(' > ') ? (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{module.split(' > ')[0]}</span>
                                            <span style={{ fontSize: '0.95rem' }}>{module.split(' > ').slice(1).join(' > ')}</span>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '0.95rem' }}>{module}</span>
                                    )}
                                </div>

                                {/* Right Side: Permissions List */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', flex: 1 }}>
                                    {groupedPermissions[module]?.filter(p => p.action).sort((a, b) => a.action.localeCompare(b.action)).map(perm => {
                                        const isChecked = formData.permission_ids.includes(perm.id);
                                        return (
                                            <label
                                                key={perm.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    background: isChecked ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                    border: isChecked ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                title={perm.description}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => togglePermission(perm.id)}
                                                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                />
                                                <span style={{ fontSize: '0.9rem', color: isChecked ? 'white' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                                    {perm.action ? perm.action.replace(/_/g, ' ') : perm.name.split(':')[1]}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={() => setView('list')} className="btn-secondary" style={{ padding: '10px 24px' }}>Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {loading ? 'Saving...' : <><Save size={18} /> Save Role</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RolesManager;
