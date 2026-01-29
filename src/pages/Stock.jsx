import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Search, Filter, Edit2, X, Save, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import PaginationControls from '../components/PaginationControls';

const Stock = ({ tenant }) => {
    const [stockItems, setStockItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [newPrices, setNewPrices] = useState({ selling_price: 0, unit_cost: 0 });
    const [sortConfig, setSortConfig] = useState({ key: 'inventory_id', direction: 'desc' });

    // New states for grouping and pagination
    const [showHistory, setShowHistory] = useState(false);
    const [expandedProducts, setExpandedProducts] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

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
            }
            return newSet;
        });
    };

    // Group stock items by product
    const groupedStock = useMemo(() => {
        const groups = {};

        stockItems.forEach(item => {
            const productId = item.product_id || item.product_name;
            if (!groups[productId]) {
                groups[productId] = {
                    product_id: productId,
                    product_name: item.product_name,
                    batches: [],
                    totalUnits: 0,
                    totalPacks: 0
                };
            }
            groups[productId].batches.push(item);
            groups[productId].totalUnits += item.quantity || 0;
            groups[productId].totalPacks += (item.quantity || 0) / (item.purchase_conv_factor || 1);
        });

        // Sort batches by created_at desc (latest first)
        Object.values(groups).forEach(group => {
            group.batches.sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });
            group.latestBatch = group.batches[0];
        });

        return Object.values(groups);
    }, [stockItems]);

    // Filter by search term
    const filteredGroups = groupedStock.filter(group =>
        group.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.batches.some(b =>
            b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Pagination
    const totalPages = Math.ceil(filteredGroups.length / pageSize);
    const paginatedGroups = filteredGroups.slice(
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

                {/* Show History Toggle */}
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0 16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    height: '48px'
                }}>
                    <input
                        type="checkbox"
                        checked={showHistory}
                        onChange={(e) => setShowHistory(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Show History</span>
                </label>
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading stock records...</div>
                ) : filteredGroups.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No matching stock records found.</div>
                ) : (
                    <>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                                        <th style={{ padding: '16px', width: '30px', background: 'var(--surface)' }}></th>
                                        <th style={{ padding: '16px', background: 'var(--surface)' }}>Product</th>
                                        <th style={{ padding: '16px', background: 'var(--surface)' }}>Batch #</th>
                                        <th style={{ padding: '16px', background: 'var(--surface)' }}>Expiry</th>
                                        <th style={{ padding: '16px', background: 'var(--surface)' }}>Created</th>
                                        <th style={{ padding: '16px', textAlign: 'right', background: 'var(--surface)' }}>Units</th>
                                        <th style={{ padding: '16px', textAlign: 'right', background: 'var(--surface)' }}>Packs</th>
                                        <th style={{ padding: '16px', textAlign: 'center', background: 'var(--surface)' }}>Factor</th>
                                        <th style={{ padding: '16px', textAlign: 'right', background: 'var(--surface)' }}>Cost</th>
                                        <th style={{ padding: '16px', textAlign: 'right', background: 'var(--surface)' }}>Price</th>
                                        <th style={{ padding: '16px', background: 'var(--surface)' }}>Supplier</th>
                                        <th style={{ padding: '16px', textAlign: 'center', background: 'var(--surface)' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedGroups.map((group) => {
                                        const isExpanded = expandedProducts.has(group.product_id);
                                        const hasMultipleBatches = group.batches.length > 1;
                                        const displayBatches = showHistory ? group.batches : [group.latestBatch];

                                        return (
                                            <React.Fragment key={group.product_id}>
                                                {/* Main Product Row */}
                                                <tr style={{
                                                    borderBottom: '1px solid var(--border)',
                                                    background: hasMultipleBatches && showHistory ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                                    transition: 'background 0.2s'
                                                }} className="table-row">
                                                    <td style={{ padding: '16px' }}>
                                                        {hasMultipleBatches && showHistory && (
                                                            <button
                                                                onClick={() => toggleProduct(group.product_id)}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0 }}
                                                            >
                                                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '16px', fontWeight: '600' }}>
                                                        {group.product_name}
                                                        {hasMultipleBatches && showHistory && (
                                                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                ({group.batches.length} batches)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '16px', fontSize: '0.85rem' }}>{group.latestBatch.batch_number}</td>
                                                    <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                                                        {group.latestBatch.expiry_date ? new Date(group.latestBatch.expiry_date).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '16px', fontSize: '0.85rem' }}>
                                                        {group.latestBatch.created_at ? new Date(group.latestBatch.created_at).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                                        <span style={{ fontWeight: '700', color: group.totalUnits < 20 ? '#f43f5e' : '#10b981' }}>
                                                            {showHistory ? group.totalUnits : group.latestBatch.quantity}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                        {showHistory ? group.totalPacks.toFixed(2) : (group.latestBatch.quantity / (group.latestBatch.purchase_conv_factor || 1)).toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>{group.latestBatch.purchase_conv_factor}</td>
                                                    <td style={{ padding: '16px', textAlign: 'right' }}>{group.latestBatch.unit_cost?.toFixed(2)}</td>
                                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>{group.latestBatch.selling_price?.toFixed(2)}</td>
                                                    <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{group.latestBatch.supplier_name}</td>
                                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(group.latestBatch);
                                                                setNewPrices({ selling_price: group.latestBatch.selling_price, unit_cost: group.latestBatch.unit_cost });
                                                            }}
                                                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                                            title="Edit Prices"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expanded Batch Rows */}
                                                {hasMultipleBatches && showHistory && isExpanded && group.batches.slice(1).map((batch, index) => (
                                                    <tr key={batch.inventory_id} style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                                                        <td style={{ padding: '16px' }}></td>
                                                        <td style={{ padding: '12px 16px 12px 48px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            └─ Batch {index + 2}
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
                            totalItems={filteredGroups.length}
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
