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

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-secondary)' }}>Module</th>
                                {actions.map(action => (
                                    <th key={action} style={{ textAlign: 'center', padding: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                        {action}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map(module => (
                                <tr key={module} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{module}</td>
                                    {actions.map(action => {
                                        // Find permission for this module+action
                                        const perm = groupedPermissions[module]?.find(p => p.action === action || (!p.action && p.name.endsWith(`:${action}`)));
                                        const isChecked = perm && formData.permission_ids.includes(perm.id);

                                        return (
                                            <td key={action} style={{ textAlign: 'center', padding: '12px' }}>
                                                {perm ? (
                                                    <label style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => togglePermission(perm.id)}
                                                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                        />
                                                    </label>
                                                ) : (
                                                    <span style={{ color: 'rgba(255,255,255,0.1)' }}>-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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
