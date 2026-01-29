import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Package, Filter, MoreVertical, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { productAPI, appSettingsAPI } from '../services/api';
import PaginationControls from '../components/PaginationControls';
import { showSuccess, showError } from '../utils/toast';
import ConfirmDialog from '../components/ConfirmDialog';

const ProductList = ({ tenantId, onEdit }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Deletion confirmation state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const initSettings = async () => {
            try {
                const settings = await appSettingsAPI.get(tenantId);
                if (settings && settings.default_listing_rows) {
                    setPageSize(settings.default_listing_rows);
                }
            } catch (error) {
                console.error('Error fetching app settings:', error);
            }
        };
        initSettings();
    }, [tenantId]);

    useEffect(() => {
        loadProducts();
    }, [tenantId, currentPage, pageSize, debouncedSearchTerm, sortConfig]);


    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ChevronDown size={14} style={{ opacity: 0.1, marginLeft: '4px' }} />;
        return sortConfig.direction === 'asc' ?
            <ChevronUp size={14} style={{ color: 'var(--primary)', marginLeft: '4px' }} /> :
            <ChevronDown size={14} style={{ color: 'var(--primary)', marginLeft: '4px' }} />;
    };

    const loadProducts = async () => {
        try {
            if (products.length === 0) setLoading(true);
            else setRefreshing(true);

            const response = await productAPI.list(tenantId, {
                page: currentPage,
                page_size: pageSize,
                search: debouncedSearchTerm,
                sort_by: sortConfig.key,
                order: sortConfig.direction
            });
            setProducts(response.items);
            setTotalItems(response.total);
            setTotalPages(response.total_pages);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = async (id) => {
        setProductToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            const res = await productAPI.delete(productToDelete, tenantId);
            showSuccess(res.message || "Product deleted successfully");
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            showError("Failed to delete product");
        }
    };

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header / Search Area - Kept outside loading state to prevent unmount/focus loss */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                gap: '16px'
            }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to first page on search
                        }}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            color: 'var(--text-primary)',
                            fontSize: '0.95rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}>
                        <Filter size={18} />
                        Filter
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
            }}>
                {/* Initial Loading State */}
                {loading && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        gap: '12px',
                        background: 'var(--background)',
                        zIndex: 20
                    }}>
                        <div className="spin" style={{ width: '32px', height: '32px', border: '3px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                        <span>Loading products...</span>
                    </div>
                )}

                {/* Refreshing Overlay */}
                {refreshing && (
                    <div style={{
                        position: 'absolute',
                        top: '60px', // Below header
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(1px)',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{ background: 'var(--surface)', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div className="spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                            Updating...
                        </div>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        textAlign: 'left',
                        opacity: refreshing ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                    }}>
                        <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 5 }}>
                            <tr>
                                <th onClick={() => requestSort('product_name')} style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--surface)' }}>
                                    PRODUCT DETAILS <SortIcon column="product_name" />
                                </th>
                                <th onClick={() => requestSort('product_type')} style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--surface)' }}>
                                    TYPE <SortIcon column="product_type" />
                                </th>
                                <th onClick={() => requestSort('retail_price')} style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--surface)' }}>
                                    RETAIL PRICE <SortIcon column="retail_price" />
                                </th>
                                <th onClick={() => requestSort('date')} style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--surface)' }}>
                                    CREATED DATE <SortIcon column="date" />
                                </th>
                                <th onClick={() => requestSort('active')} style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--surface)' }}>
                                    STATUS <SortIcon column="active" />
                                </th>
                                <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', background: 'var(--surface)' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>{product.product_name}</div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>ID: {product.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            {product.product_type === 1 ? 'Basic' : 'Assembly'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
                                            PKR {product.retail_price?.toFixed(2) || '0.00'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {product.date ? new Date(product.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: product.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: product.active ? '#10b981' : '#ef4444',
                                            border: `1px solid ${product.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                        }}>
                                            {product.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                title="Edit"
                                                onClick={() => onEdit(product)}
                                                style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                title="Delete"
                                                onClick={() => handleDelete(product.id)}
                                                style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && products.length === 0 && (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Package size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <div>No products found.</div>
                    </div>
                )}

                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                    }}
                />
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setProductToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone and will remove all associated data."
                confirmText="Delete Product"
                type="danger"
            />
        </div>
    );
};

export default ProductList;
