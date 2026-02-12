import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUpCircle, ArrowDownCircle, Info, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { showSuccess, showError } from '../utils/toast';

const CashMovementModal = ({ isOpen, onClose, onSuccess, activeSession, tenantId }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        movement_type: 'Withdrawal', // Withdrawal, Deposit
        amount: '',
        reason: '',
        reference_number: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!activeSession) {
            showError("No active cash register session found.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cash-registers/movements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify({
                    session_id: activeSession.id,
                    movement_type: formData.movement_type === 'Deposit' ? 'deposit' : 'withdrawal',
                    amount: parseFloat(formData.amount),
                    reason: formData.reason,
                    reference_number: formData.reference_number
                })
            });

            if (res.ok) {
                showSuccess("Cash movement recorded successfully");
                setFormData({ movement_type: 'Withdrawal', amount: '', reason: '', reference_number: '' });
                onSuccess();
            } else {
                const err = await res.json();
                showError(err.detail || "Movement failed");
            }
        } catch (error) {
            showError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="glass-card" style={{
                maxWidth: '500px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            padding: '10px',
                            background: formData.movement_type === 'Deposit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                            borderRadius: '12px',
                            color: formData.movement_type === 'Deposit' ? '#10b981' : '#f43f5e'
                        }}>
                            {formData.movement_type === 'Deposit' ? <ArrowDownCircle size={24} /> : <ArrowUpCircle size={24} />}
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Cash Movement</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{
                    padding: '12px 16px',
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    gap: '12px',
                    fontSize: '0.85rem',
                    color: '#60a5fa',
                    alignItems: 'center'
                }}>
                    <Info size={18} style={{ flexShrink: 0 }} />
                    <div>
                        Current Session: <span style={{ color: 'white', fontFamily: 'monospace', fontWeight: 'bold' }}>{activeSession?.session_number.split('-').pop()}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, movement_type: 'Withdrawal' })}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 'bold',
                                color: formData.movement_type === 'Withdrawal' ? 'white' : '#94a3b8',
                                background: formData.movement_type === 'Withdrawal' ? '#ef4444' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Withdrawal
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, movement_type: 'Deposit' })}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 'bold',
                                color: formData.movement_type === 'Deposit' ? 'white' : '#94a3b8',
                                background: formData.movement_type === 'Deposit' ? '#10b981' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Deposit
                        </button>
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Amount (Rs.)</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>Rs.</span>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                required
                                className="input-field"
                                style={{ paddingLeft: '48px', fontSize: '1.25rem', fontWeight: 'bold' }}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Reason / Purpose</label>
                        <textarea
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            required
                            className="input-field"
                            rows="2"
                            placeholder="e.g. Petty Cash for snacks, Cash pick-up to vault"
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Reference # (Optional)</label>
                        <input
                            type="text"
                            value={formData.reference_number}
                            onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
                            className="input-field"
                            placeholder="Receipt ID or Note #"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', paddingTop: '12px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ flex: 1, background: formData.movement_type === 'Deposit' ? '#059669' : '#dc2626' }}
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : null}
                            {loading ? 'Processing...' : `Record ${formData.movement_type}`}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default CashMovementModal;
