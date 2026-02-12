import React from 'react';
import { createPortal } from 'react-dom';
import { X, Info, Coins, Wallet, ArrowDownCircle, ArrowUpCircle, ShoppingCart } from 'lucide-react';

const CashRegisterStatusModal = ({ isOpen, onClose, session }) => {
    if (!isOpen || !session) return null;

    // Helper to format currency
    const f = (n) => `Rs. ${(parseFloat(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
                maxWidth: '600px',
                width: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                padding: '30px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#6366f1' }}>
                        <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
                            <Info size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Register Status</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Session ID</span>
                        <span style={{ color: 'white', fontFamily: 'monospace', fontWeight: 'bold' }}>{session.session_number}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Opened At</span>
                        <span style={{ color: 'white', fontSize: '0.9rem' }}>{new Date(session.opened_at).toLocaleString()}</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>

                    {/* Opening Balance */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' }}><Wallet size={20} /></div>
                            <span style={{ color: '#cbd5e1' }}>Opening Balance</span>
                        </div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>{f(session.opening_float)}</span>
                    </div>

                    {/* Cash In */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><ArrowDownCircle size={20} /></div>
                            <span style={{ color: '#cbd5e1' }}>Cash In (Sales + Dep)</span>
                        </div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#22c55e', fontFamily: 'JetBrains Mono, monospace' }}>+{f(session.cash_in_flow)}</span>
                    </div>

                    {/* Cash Out */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><ArrowUpCircle size={20} /></div>
                            <span style={{ color: '#cbd5e1' }}>Cash Out (Ret + W/D)</span>
                        </div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>-{f(Math.abs(session.cash_out_flow))}</span>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />

                    {/* Cash In Hand */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}><Coins size={24} /></div>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>CASH IN HAND</span>
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', textShadow: '0 2px 10px rgba(99, 102, 241, 0.3)', fontFamily: 'JetBrains Mono, monospace' }}>{f(session.cash_in_hand)}</span>
                    </div>

                    {/* Total Sold */}
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><ShoppingCart size={20} /></div>
                            <span style={{ color: '#cbd5e1' }}>Total Sold (All Methods)</span>
                        </div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>{f(session.total_sales)}</span>
                    </div>

                </div>
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

export default CashRegisterStatusModal;
