import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Calculator, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import DenominationInput from './DenominationInput';

const CashRegisterCloseModal = ({ isOpen, onClose, onSuccess, session, tenantId }) => {
    const [loading, setLoading] = useState(false);
    const [countedCash, setCountedCash] = useState('');
    const [withdrawnAmount, setWithdrawnAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [denominations, setDenominations] = useState({
        notes_5000: 0, notes_1000: 0, notes_500: 0, notes_100: 0,
        notes_50: 0, notes_20: 0, notes_10: 0, notes_5: 0, notes_1: 0,
        coins_5: 0, coins_2: 0, coins_1: 0
    });

    const calculateTotal = () => {
        let total = 0;
        total += (denominations.notes_5000 || 0) * 5000;
        total += (denominations.notes_1000 || 0) * 1000;
        total += (denominations.notes_500 || 0) * 500;
        total += (denominations.notes_100 || 0) * 100;
        total += (denominations.notes_50 || 0) * 50;
        total += (denominations.notes_20 || 0) * 20;
        total += (denominations.notes_10 || 0) * 10;
        total += (denominations.notes_5 || 0) * 5;
        total += (denominations.notes_1 || 0) * 1;
        total += (denominations.coins_5 || 0) * 5;
        total += (denominations.coins_2 || 0) * 2;
        total += (denominations.coins_1 || 0) * 1;
        return total;
    };

    const totalCounted = calculateTotal();
    const expectedCash = parseFloat(session?.cash_in_hand || session?.expected_cash || 0);
    const variance = totalCounted - expectedCash;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Math.abs(totalCounted - (parseFloat(countedCash) || 0)) > 0.01) {
            showError(`Denomination total (Rs. ${totalCounted}) does not match entered counted cash (Rs. ${countedCash})`);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cash-registers/sessions/${session.id}/close`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify({
                    closing_counted_cash: totalCounted,
                    closing_withdrawn: parseFloat(withdrawnAmount) || 0,
                    closing_denominations: denominations,
                    closing_notes: notes
                })
            });

            if (res.ok) {
                showSuccess("Cash register session closed and reconciled.");
                onSuccess();
            } else {
                const err = await res.json();
                showError(err.detail || "Failed to close session");
            }
        } catch (error) {
            showError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (!isOpen || !session) return null;

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
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="glass-card" style={{
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#f43f5e' }}>
                        <div style={{ padding: '10px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '12px' }}>
                            <Lock size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Close Cash Register</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Session Info</div>
                        <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'white' }}>{session?.session_number.split('-').pop()}</div>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.1)', borderRadius: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#a855f7', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Expected Cash</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>Rs. {expectedCash.toLocaleString()}</div>
                    </div>
                    <div style={{
                        padding: '16px',
                        background: Math.abs(variance) < 0.01 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)',
                        border: `2px solid ${Math.abs(variance) < 0.01 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                        borderRadius: '16px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '10px', color: Math.abs(variance) < 0.01 ? '#10b981' : '#f43f5e', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Variance</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: Math.abs(variance) < 0.01 ? '#10b981' : '#f43f5e' }}>
                            Rs. {variance.toLocaleString()}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Physical Cash Counted (Rs.)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>Rs.</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={countedCash}
                                    onChange={e => setCountedCash(e.target.value)}
                                    required
                                    className="input-field"
                                    style={{ paddingLeft: '48px', fontSize: '1.5rem', fontWeight: '900', border: '2px solid rgba(244, 63, 94, 0.2)' }}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: '#94a3b8' }}>Denom. Total:</span>
                                <span style={{ color: 'white', fontWeight: 'bold' }}>Rs. {totalCounted.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: '#94a3b8' }}>Difference:</span>
                                <span style={{ color: Math.abs(totalCounted - (parseFloat(countedCash) || 0)) < 0.01 ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                                    Rs. {(totalCounted - (parseFloat(countedCash) || 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Cash to Withdraw / Deposit (Rs.)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>Rs.</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={withdrawnAmount}
                                    onChange={e => setWithdrawnAmount(e.target.value)}
                                    className="input-field"
                                    style={{ paddingLeft: '48px', fontSize: '1.1rem', fontWeight: 'bold' }}
                                    placeholder="0.00"
                                />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                                Amount removed from drawer. Remaining will be next Opening Balance.
                            </span>
                        </div>
                        <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 'bold', textTransform: 'uppercase' }}>Next Opening Float</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>
                                Rs. {((parseFloat(countedCash) || 0) - (parseFloat(withdrawnAmount) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'white', fontWeight: 'semibold' }}>
                            <Calculator size={18} style={{ color: '#6366f1' }} />
                            <span>Closing Denominations</span>
                        </div>
                        <DenominationInput values={denominations} onChange={setDenominations} />
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Closing Remarks (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="input-field"
                            rows="2"
                            placeholder="Reason for variance or shift summary..."
                        />
                    </div>

                    {Math.abs(variance) > 0.01 && (
                        <div style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.1)', borderRadius: '12px', display: 'flex', gap: '16px', color: '#f43f5e' }}>
                            <AlertTriangle size={24} style={{ flexShrink: 0 }} />
                            <div style={{ fontSize: '0.85rem' }}>
                                <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Variance Detected</div>
                                <div>Closing this session with a variance will automatically create a Journal Entry in your accounting books (Cash Over/Short). Please ensure the physical count is correct.</div>
                            </div>
                        </div>
                    )}

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
                            style={{ flex: 1, background: 'linear-gradient(135deg, #e11d48, #be123c)' }}
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                            {loading ? 'Reconciling...' : 'Close & Record Shift'}
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

export default CashRegisterCloseModal;
