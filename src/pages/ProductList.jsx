import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Package, Filter, MoreVertical, Plus } from 'lucide-react';
import { productAPI } from '../services/api';

const ProductList = ({ tenantId, onEdit }) => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadProducts();
    }, [tenantId]);

    useEffect(() => {
        if (searchTerm) {
            setFilteredProducts(products.filter(p =>
                p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.id.toString().includes(searchTerm)
            ));
        } else {
            setFilteredProducts(products);
        }
    }, [searchTerm, products]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await productAPI.list(tenantId);
            setProducts(data);
            setFilteredProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await productAPI.delete(id, tenantId);
            loadProducts();
        } catch (error) {
            alert('Error deleting product: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'var(--text-secondary)' }}>
                Loading Products...
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Header / Search Area */}
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
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem' }}>PRODUCT DETAILS</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem' }}>TYPE</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem' }}>RETAIL PRICE</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem' }}>STATUS</th>
                            <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
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
                                        ${product.retail_price?.toFixed(2) || '0.00'}
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
                {filteredProducts.length === 0 && (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Package size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <div>No products found.</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductList;
