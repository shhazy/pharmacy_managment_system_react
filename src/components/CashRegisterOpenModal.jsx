import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Banknote, ShieldCheck, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { showSuccess, showError, showInfo } from '../utils/toast';
import DenominationInput from './DenominationInput';

const CashRegisterOpenModal = ({ isOpen, onClose, onSuccess, tenantId }) => {
    const [registers, setRegisters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRegister, setSelectedRegister] = useState('');
    const [openingFloat, setOpeningFloat] = useState('');
    const [notes, setNotes] = useState('');
    const [denominations, setDenominations] = useState({
        notes_5000: 0, notes_1000: 0, notes_500: 0, notes_100: 0,
        notes_50: 0, notes_20: 0, notes_10: 0, notes_5: 0, notes_1: 0,
        coins_5: 0, coins_2: 0, coins_1: 0
    });

    useEffect(() => {
        if (isOpen) {
            fetchRegisters();
        }
    }, [isOpen]);

    const fetchRegisters = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cash-registers?active_only=true`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                }
            });
            if (res.ok) {
                const data = await res.json();
                setRegisters(data);
                if (data.length > 0) {
                    setSelectedRegister(data[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch registers", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLastSession = async (registerId) => {
        if (!registerId) return;
        try {
            const res = await fetch(`${API_BASE_URL}/cash-registers/sessions/last-closed?register_id=${registerId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                }
            });
            if (res.ok) {
                const lastSession = await res.json();
                if (lastSession && lastSession.closing_counted_cash !== null) {
                    const nextOpening = (parseFloat(lastSession.closing_counted_cash) || 0) - (parseFloat(lastSession.closing_withdrawn) || 0);
                    setOpeningFloat(nextOpening.toString());
                    showInfo(`Opening balance auto-filled from last session (Rs. ${nextOpening})`);
                } else {
                    setOpeningFloat('0');
                }
            }
        } catch (error) {
            console.error("Failed to fetch last session", error);
        }
    };

    useEffect(() => {
        if (selectedRegister) {
            fetchLastSession(selectedRegister);
        }
    }, [selectedRegister]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const total = calculateTotal();
        const enteredFloat = parseFloat(openingFloat) || 0;

        if (Math.abs(total - enteredFloat) > 0.01) {
            showError(`Denomination total (Rs. ${total}) does not match entered opening float (Rs. ${enteredFloat})`);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cash-registers/sessions/open`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify({
                    register_id: parseInt(selectedRegister),
                    opening_float: enteredFloat,
                    opening_denominations: denominations,
                    opening_notes: notes
                })
            });

            if (res.ok) {
                const session = await res.json();
                showSuccess("Cash register opened successfully!");
                onSuccess(session);
            } else {
                const err = await res.json();
                showError(err.detail || "Failed to open register");
            }
        } catch (error) {
            showError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

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
                maxWidth: '800px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#6366f1' }}>
                            <Banknote size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Open Cash Register</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Register</label>
                            <select
                                value={selectedRegister}
                                onChange={e => setSelectedRegister(e.target.value)}
                                required
                                className="input-field"
                            >
                                <option value="" disabled>Select a register...</option>
                                {registers.map(reg => (
                                    <option key={reg.id} value={reg.id}>{reg.register_name} ({reg.register_code})</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Opening Float (Rs.)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={openingFloat}
                                onChange={e => setOpeningFloat(e.target.value)}
                                required
                                className="input-field"
                                style={{ fontSize: '1.25rem', fontWeight: 'bold' }}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Denomination Breakdown</h4>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Counted</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: Math.abs(calculateTotal() - (parseFloat(openingFloat) || 0)) < 0.01 ? '#10b981' : '#f59e0b' }}>
                                    Rs. {calculateTotal().toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <DenominationInput values={denominations} onChange={setDenominations} />
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="input-field"
                            rows="2"
                            placeholder="Shift details or float notes..."
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
                            style={{ flex: 1 }}
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                            {loading ? 'Opening...' : 'Start Session'}
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

export default CashRegisterOpenModal;
