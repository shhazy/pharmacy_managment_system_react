import React, { useState } from 'react';
import { Package, Boxes } from 'lucide-react';
import ProductList from './ProductList';
import Stock from './Stock';

const ProductManagement = ({ tenantId, onEdit }) => {
    const [activeTab, setActiveTab] = useState('products');

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: activeTab === id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: activeTab === id ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                borderBottom: activeTab === id ? 'none' : '1px solid var(--border)'
            }}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <TabButton id="products" label="All Products" icon={Package} />
                <TabButton id="stock" label="Stock" icon={Boxes} />
            </div>

            <div className="fade-in" key={activeTab} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {activeTab === 'products' ? (
                    <ProductList tenantId={tenantId} onEdit={onEdit} />
                ) : (
                    <Stock tenant={tenantId} />
                )}
            </div>
        </div>
    );
};

export default ProductManagement;
