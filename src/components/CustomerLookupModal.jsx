import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, CreditCard, Calendar } from 'lucide-react';
import CustomerSearchBar from './CustomerSearchBar';

const CustomerLookupModal = ({ isOpen, onClose, onSelect, customers = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const searchRef = useRef(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const filtered = useMemo(() => {
        if (!searchTerm) return customers;
        const lowSearch = searchTerm.toLowerCase();
        return customers.filter(c =>
            c.name?.toLowerCase().includes(lowSearch) ||
            c.customer_code?.toLowerCase().includes(lowSearch) ||
            c.mobile_phone?.toLowerCase().includes(lowSearch)
        );
    }, [customers, searchTerm]);

    if (!isOpen) return null;

    const isExpired = (dateStr) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    };

    return createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
            <div className="glass-card" style={{
                width: '90%',
                maxWidth: '900px',
                height: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#10b981', padding: '8px', borderRadius: '10px' }}>
                            <Users size={20} color="white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Customer Lookup</h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Select customer for sale or credit</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.2)' }}>
                    <CustomerSearchBar
                        ref={searchRef}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        containerStyle={{ height: '48px', borderRadius: '12px' }}
                    />
                </div>

                {/* Body Table */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Customer Details</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contact / Group</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Credit Info</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <td style={{ padding: '12px 16px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Code: {c.customer_code}</div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontSize: '0.85rem' }}>{c.mobile_phone || 'No Phone'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.customer_group?.name || 'No Group'}</div>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                            <div style={{ fontSize: '0.75rem', color: (c.credit_limit - (c.current_balance || 0)) <= 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                                Avail. Credit: {(c.credit_limit - (c.current_balance || 0)).toFixed(2)}
                                            </div>
                                            {c.expiry_date && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: isExpired(c.expiry_date) ? '#ef4444' : 'var(--text-secondary)' }}>
                                                    <Calendar size={12} />
                                                    Exp: {new Date(c.expiry_date).toLocaleDateString()}
                                                    {isExpired(c.expiry_date) && ' (EXPIRED)'}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '8px 20px', fontSize: '0.85rem', borderRadius: '8px', background: '#10b981', border: 'none' }}
                                            onClick={() => onSelect(c)}
                                        >
                                            Select
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No customers found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }}>Esc</span> Close
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CustomerLookupModal;
