import React, { useState, useEffect } from 'react';
import { Package, Hash, AlertTriangle, Save, History, Search, ArrowRight, MinusCircle, PlusCircle } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { showError, showSuccess } from '../utils/toast';

const InventoryAdjustment = ({ tenantId }) => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [adjustmentReason, setAdjustmentReason] = useState('physical_count');
    const [adjustmentQty, setAdjustmentQty] = useState(0);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [view, setView] = useState('form'); // form, history
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchHistory();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) setProducts(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/adjustments`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) setHistory(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!selectedBatch) return showError("Please select a product and batch");
        if (adjustmentQty === 0) return showError("Adjustment quantity cannot be 0");

        const newQty = (selectedBatch.quantity || 0) + adjustmentQty;
        if (newQty < 0) return showError(`Insufficient stock. Max reduction possible: ${selectedBatch.quantity}`);

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/adjust`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify({
                    product_id: selectedProduct.id,
                    inventory_id: selectedBatch.inventory_id,
                    batch_number: selectedBatch.batch_number,
                    adjustment_type: adjustmentReason,
                    quantity_adjusted: adjustmentQty,
                    reason: notes
                })
            });

            if (res.ok) {
                showSuccess("Stock adjusted successfully");
                setAdjustmentQty(0);
                setNotes('');
                setSelectedProduct(null);
                setSelectedBatch(null);
                fetchProducts();
                fetchHistory();
            } else {
                const err = await res.json();
                showError(err.detail || "Failed to adjust stock");
            }
        } catch (e) {
            showError("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderForm = () => (
        <div className="glass-card fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left Column: Product Selection */}
                <div>
                    <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={18} className="text-primary" /> 1. Select Product
                    </h4>
                    <input
                        type="text"
                        placeholder="Search product..."
                        className="input-field"
                        style={{ width: '100%', marginBottom: '12px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        {filteredProducts.map(p => (
                            <div
                                key={p.id}
                                onClick={() => { setSelectedProduct(p); setSelectedBatch(null); }}
                                style={{
                                    padding: '12px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border)',
                                    background: selectedProduct?.id === p.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}
                                className="hover-item"
                            >
                                <div style={{ fontWeight: 'bold' }}>{p.product_name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Current Net Stock: {p.stock_quantity} {p.uom}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Batch & Adjustment */}
                <div>
                    <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Hash size={18} className="text-primary" /> 2. Adjustment Details
                    </h4>

                    {selectedProduct ? (
                        <div className="fade-in">
                            <label style={{ display: 'block', marginBottom: '8px' }}>Select Batch</label>
                            <select
                                className="input-field"
                                style={{ width: '100%', marginBottom: '16px' }}
                                value={selectedBatch?.inventory_id || ''}
                                onChange={(e) => setSelectedBatch(selectedProduct.stock_inventory.find(b => b.inventory_id === parseInt(e.target.value)))}
                            >
                                <option value="">-- Choose Batch --</option>
                                {selectedProduct.stock_inventory.map(b => (
                                    <option key={b.inventory_id} value={b.inventory_id}>
                                        Batch: {b.batch_number} (Qty: {b.quantity})
                                    </option>
                                ))}
                            </select>

                            {selectedBatch && (
                                <div className="fade-in">
                                    <div className="alert-card" style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span>Current Batch Stock:</span>
                                            <span style={{ fontWeight: 'bold' }}>{selectedBatch.quantity}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                                            <span>Net After Adjustment:</span>
                                            <span style={{ fontWeight: 'bold', color: (selectedBatch.quantity + adjustmentQty) >= 0 ? 'var(--primary)' : 'var(--error)' }}>
                                                {selectedBatch.quantity + adjustmentQty}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px' }}>Adjustment Type</label>
                                        <select
                                            className="input-field"
                                            style={{ width: '100%' }}
                                            value={adjustmentReason}
                                            onChange={(e) => setAdjustmentReason(e.target.value)}
                                        >
                                            <option value="physical_count">Physical Count Correction</option>
                                            <option value="damage">Damaged Stock</option>
                                            <option value="expiry">Expired Stock</option>
                                            <option value="theft">Theft/Loss</option>
                                            <option value="return_to_supplier">Return to Supplier</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px' }}>Quantity (+ for add, - for remove)</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => setAdjustmentQty(prev => prev - 1)}
                                                className="icon-btn" style={{ border: '1px solid var(--border)' }}
                                            ><MinusCircle size={20} /></button>
                                            <input
                                                type="number"
                                                className="input-field"
                                                style={{ flex: 1, textAlign: 'center' }}
                                                value={adjustmentQty}
                                                onChange={(e) => setAdjustmentQty(parseFloat(e.target.value) || 0)}
                                            />
                                            <button
                                                onClick={() => setAdjustmentQty(prev => prev + 1)}
                                                className="icon-btn" style={{ border: '1px solid var(--border)' }}
                                            ><PlusCircle size={20} /></button>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px' }}>Notes / Reference</label>
                                        <textarea
                                            className="input-field"
                                            placeholder="Reason for adjustment..."
                                            style={{ width: '100%', height: '80px', resize: 'none' }}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        disabled={loading || !adjustmentQty}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        {loading ? 'Processing...' : <><Save size={18} /> Process Adjustment</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '2px dashed var(--border)' }}>
                            Select a product to begin
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="glass-card fade-in">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Product</th>
                        <th style={{ padding: '12px' }}>Batch</th>
                        <th style={{ padding: '12px' }}>Type</th>
                        <th style={{ padding: '12px' }}>Adjustment</th>
                        <th style={{ padding: '12px' }}>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map(h => {
                        const prod = products.find(p => p.id === h.product_id);
                        return (
                            <tr key={h.adjustment_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                                    {new Date(h.adjustment_date).toLocaleString()}
                                </td>
                                <td style={{ padding: '12px' }}>{prod?.product_name || `Product #${h.product_id}`}</td>
                                <td style={{ padding: '12px' }}>{h.batch_number}</td>
                                <td style={{ padding: '12px' }}>
                                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                        {h.adjustment_type.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', fontWeight: 'bold', color: h.quantity_adjusted > 0 ? '#22c55e' : '#ef4444' }}>
                                    {h.quantity_adjusted > 0 ? '+' : ''}{h.quantity_adjusted}
                                </td>
                                <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {h.reason || '-'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Package className="text-primary" size={28} /> Inventory Adjustment
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manually correct stock levels with audit trail</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setView('form')}
                        className={view === 'form' ? 'btn-primary' : 'btn-secondary'}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <PlusCircle size={18} /> Adjustment Form
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={view === 'history' ? 'btn-primary' : 'btn-secondary'}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <History size={18} /> View History
                    </button>
                </div>
            </div>

            {view === 'form' ? renderForm() : renderHistory()}
        </div>
    );
};

export default InventoryAdjustment;
