import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, LayoutGrid, Search, Edit2, Trash2, Check, X, ShieldCheck, Clock, DollarSign, ArrowRight, BarChart2 } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { showSuccess, showError } from '../utils/toast';

const CashRegisterManager = ({ tenantId }) => {
    const [registers, setRegisters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingRegister, setEditingRegister] = useState(null);
    const [formData, setFormData] = useState({
        register_name: '',
        register_code: '',
        location: '',
        is_active: true
    });

    useEffect(() => {
        fetchRegisters();
    }, []);

    const fetchRegisters = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cash-registers?active_only=false`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                }
            });
            if (res.ok) {
                const data = await res.json();
                setRegisters(data);
            }
        } catch (error) {
            console.error('Error fetching registers:', error);
            showError('Failed to load cash registers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = editingRegister
                ? `${API_BASE_URL}/cash-registers/${editingRegister.id}`
                : `${API_BASE_URL}/cash-registers/`;
            const method = editingRegister ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showSuccess(`Register ${editingRegister ? 'updated' : 'created'} successfully`);
                setShowForm(false);
                setEditingRegister(null);
                setFormData({ register_name: '', register_code: '', location: '', is_active: true });
                fetchRegisters();
            } else {
                const err = await res.json();
                showError(err.detail || 'Operation failed');
            }
        } catch (error) {
            showError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (reg) => {
        setEditingRegister(reg);
        setFormData({
            register_name: reg.register_name,
            register_code: reg.register_code,
            location: reg.location || '',
            is_active: reg.is_active
        });
        setShowForm(true);
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>Cash Registers</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage physical cash registers and POS stations</p>
                </div>
                <button
                    onClick={() => {
                        setEditingRegister(null);
                        setFormData({ register_name: '', register_code: '', location: '', is_active: true });
                        setShowForm(true);
                    }}
                    className="btn-primary"
                    style={{ gap: '8px' }}
                >
                    <Plus size={20} />
                    Add Register
                </button>
            </div>

            {/* Stats Summary */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
            }}>
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
                        <LayoutGrid size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Registers</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{registers.length}</p>
                    </div>
                </div>
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                        <Check size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{registers.filter(r => r.is_active).length}</p>
                    </div>
                </div>
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                    <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', color: '#a855f7' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Open Sessions</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>---</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Register Name</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Code</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Location</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>Status</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registers.map(reg => (
                            <tr key={reg.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{reg.register_name}</td>
                                <td style={{ padding: '16px' }}>
                                    <code style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', color: 'var(--primary)', fontSize: '0.85rem' }}>{reg.register_code}</code>
                                </td>
                                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{reg.location || '---'}</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        background: reg.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: reg.is_active ? '#10b981' : '#ef4444'
                                    }}>
                                        {reg.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEdit(reg)}
                                            style={{
                                                padding: '8px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                borderRadius: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            style={{
                                                padding: '8px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                borderRadius: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                        >
                                            <BarChart2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {registers.length === 0 && !loading && (
                            <tr>
                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    No registers found. Click "Add Register" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Form Modal */}
            {showForm && createPortal(
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {editingRegister ? 'Edit Register' : 'New Cash Register'}
                            </h3>
                            <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="input-group">
                                <label>Register Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.register_name}
                                    onChange={e => setFormData({ ...formData, register_name: e.target.value })}
                                    required
                                    placeholder="e.g. Counter 1, Main Desk"
                                />
                            </div>
                            <div className="input-group">
                                <label>Register Code</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.register_code}
                                    onChange={e => setFormData({ ...formData, register_code: e.target.value })}
                                    required
                                    disabled={!!editingRegister}
                                    style={{ opacity: editingRegister ? 0.6 : 1 }}
                                    placeholder="e.g. POS-01"
                                />
                            </div>
                            <div className="input-group">
                                <label>Location</label>
                                <textarea
                                    className="input-field"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    rows="2"
                                    style={{ resize: 'none' }}
                                    placeholder="Room/Aisle information"
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    id="is_active"
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="is_active" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>Set as Active</label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', paddingTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn-secondary"
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    {loading ? 'Saving...' : (editingRegister ? 'Update Register' : 'Save Register')}
                                </button>
                            </div>
                        </form>
                    </div>
                    <style>{`
                        @keyframes scaleIn {
                            from { opacity: 0; transform: scale(0.95) translateY(10px); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                    `}</style>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CashRegisterManager;
