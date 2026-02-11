import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, List as ListIcon } from 'lucide-react';
import ProductSearchBar from './ProductSearchBar';

const ProductLookupModal = ({ isOpen, onClose, onSelect, products = [], inventoryMethod = 'Default' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQty, setSearchQty] = useState(1);
    const searchRef = useRef(null);

    const isGroupedMode = inventoryMethod !== 'Default';

    // Helper function to sort batches based on inventory method
    const sortBatches = (batches, method) => {
        if (!batches || batches.length === 0) return [];
        const sorted = [...batches].filter(b => b.quantity > 0);

        if (method === 'FIFO') {
            // First In, First Out - sort by created_at or id (oldest first)
            return sorted.sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                return dateA - dateB || (a.id || 0) - (b.id || 0);
            });
        } else if (method === 'FEFO') {
            // First Expired, First Out - sort by expiry_date (earliest expiry first)
            return sorted.sort((a, b) => {
                const dateA = a.expiry_date ? new Date(a.expiry_date) : new Date('9999-12-31');
                const dateB = b.expiry_date ? new Date(b.expiry_date) : new Date('9999-12-31');
                return dateA - dateB;
            });
        }
        // Default - show all batches as-is (but still filter out zero quantity)
        return sorted;
    };

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSearchQty(1);
            // Small delay to ensure focus works after render
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const filtered = useMemo(() => {
        let productsToFilter = products;

        // Sort batches for each product according to inventory method
        if (inventoryMethod) {
            productsToFilter = products.map(p => ({
                ...p,
                stock_inventory: sortBatches(p.stock_inventory || [], inventoryMethod)
            }));
        }

        if (!searchTerm) return productsToFilter;
        const lowSearch = searchTerm.toLowerCase();
        return productsToFilter.filter(p =>
            p.product_name?.toLowerCase().includes(lowSearch) ||
            p.generic_name?.toLowerCase().includes(lowSearch) ||
            p.code?.toLowerCase().includes(lowSearch) ||
            p.product_code?.toLowerCase().includes(lowSearch) ||
            p.name?.toLowerCase().includes(lowSearch)
        );
    }, [products, searchTerm, inventoryMethod]);

    if (!isOpen) return null;

    return createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
            <div className="glass-card" style={{
                width: '90%',
                maxWidth: '1000px',
                height: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '10px' }}>
                            <ListIcon size={20} color="white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Product Lookup {isGroupedMode && <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '8px' }}>GROUPED</span>}</h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>F3 Search Console • {isGroupedMode ? 'Auto Batch Selection' : 'Manual Batch Selection'}</p>
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

                {/* Sub-Header: Search Bar */}
                <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.1)', display: 'flex', gap: '16px' }}>
                    <ProductSearchBar
                        ref={searchRef}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        containerStyle={{ flex: 3, height: '48px', borderRadius: '12px' }}
                    />
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '4px', fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 'bold' }}>QUICK QTY</span>
                            <input
                                type="number"
                                placeholder="Qty"
                                className="input-field"
                                style={{
                                    height: '48px',
                                    paddingTop: '18px',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border)',
                                    textAlign: 'center'
                                }}
                                value={searchQty}
                                onChange={e => setSearchQty(Math.abs(parseInt(e.target.value)) || 1)}
                            />
                        </div>
                    </div>
                </div>

                {/* Body: Product Table */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Basic Information</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{isGroupedMode ? 'Total Batches' : 'Variant / Batch'}</th>
                                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{isGroupedMode ? 'Total Stock' : 'Stock'}</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{isGroupedMode ? 'Price Range' : 'Price (PKR)'}</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(m => {
                                const batches = m.stock_inventory || [];

                                if (isGroupedMode) {
                                    const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
                                    if (batches.length === 0 && totalStock === 0) return null; // Skip if no stock

                                    return (
                                        <tr key={m.id}
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '8px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        >
                                            <td style={{ padding: '12px 16px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.product_name || m.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'center', alignItems: 'center', gap: '8px' }}>
                                                    {m.code || m.product_code || 'NO-CODE'} • {m.generic_name}
                                                    {m.control_drug && <span style={{ padding: '1px 6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.65rem', marginLeft: '8px' }}>CONTROLLED</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{batches.length} Batch(es)</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Auto-deduct: {inventoryMethod}</div>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <div style={{
                                                    background: totalStock < 20 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                    color: totalStock < 20 ? '#ef4444' : '#10b981',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontWeight: '800',
                                                    display: 'inline-block',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {totalStock}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>
                                                {batches.length > 0 ? (batches[0].selling_price || batches[0].sale_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '--'}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '6px 16px', fontSize: '0.85rem', borderRadius: '8px' }}
                                                    onClick={() => onSelect(m, null, searchQty)}
                                                >
                                                    Select
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }

                                if (batches.length > 0) {
                                    return batches.map(b => (
                                        <tr key={b.inventory_id}
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '8px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        >
                                            <td style={{ padding: '12px 16px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.product_name || m.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {m.code || m.product_code || 'NO-CODE'} • {m.generic_name}
                                                    {m.control_drug && <span style={{ padding: '1px 6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.65rem' }}>CONTROLLED</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.batch_number}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Exp: {b.expiry_date ? new Date(b.expiry_date).toLocaleDateString() : 'N/A'}</div>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <div style={{
                                                    background: b.quantity < 20 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                    color: b.quantity < 20 ? '#ef4444' : '#10b981',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontWeight: '800',
                                                    display: 'inline-block',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {b.quantity}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>
                                                {(b.selling_price || b.sale_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '6px 16px', fontSize: '0.85rem', borderRadius: '8px' }}
                                                    onClick={() => onSelect(m, b, searchQty)}
                                                >
                                                    Select
                                                </button>
                                            </td>
                                        </tr>
                                    ));
                                } else {
                                    return (
                                        <tr key={m.id}
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '8px'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        >
                                            <td style={{ padding: '12px 16px', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.product_name || m.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.code || m.product_code || 'NO-CODE'} • {m.generic_name}</div>
                                            </td>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No inventory info</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>--</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>--</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '6px 16px', fontSize: '0.85rem', borderRadius: '8px' }}
                                                    onClick={() => onSelect(m, null, searchQty)}
                                                >
                                                    Select
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                        No products found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer: Keyboard Shortcuts */}
                <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white' }}>Esc</span> Close Modal
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProductLookupModal;
