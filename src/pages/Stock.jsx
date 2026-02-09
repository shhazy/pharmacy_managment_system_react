import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Search, Filter, Edit2, X, Save, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import PaginationControls from '../components/PaginationControls';

const Stock = ({ tenant }) => {
    const [stockSummary, setStockSummary] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [newPrices, setNewPrices] = useState({ selling_price: 0, unit_cost: 0 });
    const [sortConfig, setSortConfig] = useState({ key: 'product_name', direction: 'asc' });

    // New states for grouping and pagination
    const [expandedProducts, setExpandedProducts] = useState(new Set());
    const [productBatches, setProductBatches] = useState({}); // { productId: [batches] }
    const [loadingBatches, setLoadingBatches] = useState({}); // { productId: true/false }
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    useEffect(() => {
        fetchStockSummary();
    }, [tenant]);

    const fetchStockSummary = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/stock-summary`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenant
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStockSummary(data);
            }
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBatches = async (productId) => {
        setLoadingBatches(prev => ({ ...prev, [productId]: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/product/${productId}/batches`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenant
                }
            });
            if (res.ok) {
                const data = await res.json();
                setProductBatches(prev => ({ ...prev, [productId]: data }));
            }
        } catch (err) {
            console.error("Batches fetch failed", err);
        } finally {
            setLoadingBatches(prev => ({ ...prev, [productId]: false }));
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
                fetchStockSummary();
                if (editingItem.product_id) fetchBatches(editingItem.product_id);
                showSuccess("Prices updated successfully!");
            } else {
                showError("Failed to update prices");
            }
        } catch (err) {
            console.error("Update failed", err);
            showError("Failed to update prices");
        }
    };

    const toggleProduct = (productId) => {
        setExpandedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
                if (!productBatches[productId]) {
                    fetchBatches(productId);
                }
            }
            return newSet;
        });
    };

    // Filter summary by search term
    const filteredSummary = stockSummary.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (productBatches[item.product_id] || []).some(b =>
            b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Pagination
    const totalPages = Math.ceil(filteredSummary.length / pageSize);
    const paginatedSummary = filteredSummary.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ChevronDown size={14} style={{ opacity: 0.2, marginLeft: '4px' }} />;
        return sortConfig.direction === 'asc' ?
            <ChevronUp size={14} style={{ color: 'var(--primary)', marginLeft: '4px' }} /> :
            <ChevronDown size={14} style={{ color: 'var(--primary)', marginLeft: '4px' }} />;
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
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
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading stock records...</div>
                ) : filteredSummary.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No matching stock records found.</div>
                ) : (
                    <>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                                        <th style={{ padding: '16px', width: '30px', background: 'var(--surface)' }}></th>
                                        <th style={{ padding: '16px', background: 'var(--surface)' }} onClick={() => requestSort('product_name')}>
                                            Product <SortIcon column="product_name" />
                                        </th>
                                        <th style={{ padding: '16px', background: 'var(--surface)' }}>Latest Batch</th>
                                        <th style={{ padding: '16px', background: 'var(--surface)' }}>Expiry</th>
                                        <th style={{ padding: '16px', background: 'var(--surface)' }}>Created</th>
                                        <th style={{ padding: '16px', textAlign: 'right', background: 'var(--surface)' }}>Total Units</th>
                                        <th style={{ padding: '16px', textAlign: 'right', background: 'var(--surface)' }}>Total Packs</th>
                                        <th style={{ padding: '16px', textAlign: 'center', background: 'var(--surface)' }}>Factor</th>
                                        <th style={{ padding: '16px', textAlign: 'right', background: 'var(--surface)' }}>Cost</th>
                                        <th style={{ padding: '16px', textAlign: 'right', background: 'var(--surface)' }}>Price</th>
                                        <th style={{ padding: '16px', background: 'var(--surface)' }}>Supplier</th>
                                        <th style={{ padding: '16px', textAlign: 'center', background: 'var(--surface)' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedSummary.map((item) => {
                                        const isExpanded = expandedProducts.has(item.product_id);
                                        const batches = productBatches[item.product_id] || [];
                                        const isLoadingThis = loadingBatches[item.product_id];
                                        const latest = item.latest_batch;

                                        return (
                                            <React.Fragment key={item.product_id}>
                                                {/* Main Product Row */}
                                                <tr style={{
                                                    borderBottom: '1px solid var(--border)',
                                                    background: isExpanded ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                                    transition: 'background 0.2s'
                                                }} className="table-row">
                                                    <td style={{ padding: '16px' }}>
                                                        <button
                                                            onClick={() => toggleProduct(item.product_id)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0 }}
                                                        >
                                                            {isLoadingThis ? (
                                                                <div className="spinner-small" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                            ) : isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: '16px', fontWeight: '600' }}>
                                                        {item.product_name}
                                                    </td>
                                                    <td style={{ padding: '16px', fontSize: '0.85rem' }}>{latest?.batch_number || 'N/A'}</td>
                                                    <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                                                        {latest?.expiry_date ? new Date(latest.expiry_date).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                                                        {latest?.created_at ? new Date(latest.created_at).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                                        <span style={{ fontWeight: '700', color: item.total_quantity < 20 ? '#f43f5e' : '#10b981' }}>
                                                            {item.total_quantity}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                        {(item.total_quantity / (item.purchase_conv_factor || 1)).toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>{item.purchase_conv_factor}</td>
                                                    <td style={{ padding: '16px', textAlign: 'right' }}>{latest?.unit_cost?.toFixed(2) || '0.00'}</td>
                                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>{latest?.selling_price?.toFixed(2) || '0.00'}</td>
                                                    <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{latest?.supplier_name || 'N/A'}</td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                                        {latest && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(latest);
                                                                    setNewPrices({ selling_price: latest.selling_price, unit_cost: latest.unit_cost });
                                                                }}
                                                                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                                                title="Edit Prices"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>

                                                {/* Expanded Batch Rows */}
                                                {isExpanded && batches.map((batch, index) => (
                                                    <tr key={batch.inventory_id} style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                                                        <td style={{ padding: '16px' }}></td>
                                                        <td style={{ padding: '12px 16px 12px 48px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            └─ Batch {index + 1}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{batch.batch_number}</td>
                                                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                                                            {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                                                            {batch.created_at ? new Date(batch.created_at).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.85rem' }}>
                                                            <span style={{ color: batch.quantity < 20 ? '#f43f5e' : '#10b981' }}>{batch.quantity}</span>
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            {(batch.quantity / (batch.purchase_conv_factor || 1)).toFixed(2)}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.85rem' }}>{batch.purchase_conv_factor}</td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.85rem' }}>{batch.unit_cost?.toFixed(2)}</td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--primary)' }}>{batch.selling_price?.toFixed(2)}</td>
                                                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{batch.supplier_name}</td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingItem(batch);
                                                                    setNewPrices({ selling_price: batch.selling_price, unit_cost: batch.unit_cost });
                                                                }}
                                                                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                                                title="Edit Prices"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={filteredSummary.length}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(newSize) => {
                                setPageSize(newSize);
                                setCurrentPage(1);
                            }}
                        />
                    </>
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
