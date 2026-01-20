import { useState, useEffect } from 'react';
import { ChevronLeft, Search, Filter, Edit2, X, Save } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const Stock = ({ tenant }) => {
    const [stockItems, setStockItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [newPrices, setNewPrices] = useState({ selling_price: 0, unit_cost: 0 });

    useEffect(() => {
        fetchStock();
    }, [tenant]);

    const fetchStock = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/stock`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenant
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStockItems(data);
            }
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePrice = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/stock/${editingItem.inventory_id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenant
                },
                body: JSON.stringify(newPrices)
            });
            if (res.ok) {
                setEditingItem(null);
                fetchStock();
            } else {
                alert("Failed to update prices");
            }
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    const filteredItems = stockItems.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '0px', maxWidth: '100%', margin: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Stock Explorer</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Detailed batch-level inventory tracking for {tenant}.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Filter by product, batch, or supplier..."
                        style={{ paddingLeft: '48px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button style={{ padding: '0 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={20} /> Filters
                </button>
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading stock records...</div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No matching stock records found.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '16px' }}>Product</th>
                                    <th style={{ padding: '16px' }}>Batch #</th>
                                    <th style={{ padding: '16px' }}>Expiry</th>
                                    <th style={{ padding: '16px', textAlign: 'right' }}>Units</th>
                                    <th style={{ padding: '16px', textAlign: 'right' }}>Packs</th>
                                    <th style={{ padding: '16px', textAlign: 'center' }}>Factor</th>
                                    <th style={{ padding: '16px', textAlign: 'right' }}>Cost</th>
                                    <th style={{ padding: '16px', textAlign: 'right' }}>Price</th>
                                    <th style={{ padding: '16px' }}>Supplier</th>
                                    <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item) => (
                                    <tr key={item.inventory_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row">
                                        <td style={{ padding: '16px', fontWeight: '600' }}>{item.product_name}</td>
                                        <td style={{ padding: '16px', fontSize: '0.85rem' }}>{item.batch_number}</td>
                                        <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <span style={{ fontWeight: '700', color: item.quantity < 20 ? '#f43f5e' : '#10b981' }}>{item.quantity}</span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                            {(item.quantity / (item.purchase_conv_factor || 1)).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>{item.purchase_conv_factor}</td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>{item.unit_cost?.toFixed(2)}</td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>{item.selling_price?.toFixed(2)}</td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.supplier_name}</td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setNewPrices({ selling_price: item.selling_price, unit_cost: item.unit_cost });
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                                title="Edit Prices"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Price Edit Modal */}
            {editingItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="glass-card" style={{ width: '400px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>Update Prices</h2>
                            <button onClick={() => setEditingItem(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>{editingItem.product_name}</p>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Batch: {editingItem.batch_number}</p>
                        </div>
                        <div className="input-group">
                            <label>Unit Cost (Landed)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={newPrices.unit_cost}
                                onChange={e => setNewPrices({ ...newPrices, unit_cost: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Selling Price</label>
                            <input
                                type="number"
                                className="input-field"
                                value={newPrices.selling_price}
                                onChange={e => setNewPrices({ ...newPrices, selling_price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <button className="btn-primary" style={{ width: '100%', marginTop: '12px' }} onClick={handleUpdatePrice}>
                            <Save size={18} /> Save New Prices
                        </button>
                    </div>
                </div>
            )}

            <style>{`
        .table-row:hover { background: rgba(255,255,255,0.03); }
        th { color: var(--text-secondary); font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
      `}</style>
        </div>
    );
};

export default Stock;
