import React, { useState } from 'react';
import { Layers, Tag, Boxes, Package, TrendingUp, Building2, Warehouse, Truck, Scale, List as ListIcon } from 'lucide-react';
import InventoryCRUDManager from './InventoryCRUDManager';

const InventorySetup = ({ tenantId }) => {
    const [activeTab, setActiveTab] = useState('line-items');

    const tabs = [
        { id: 'line-items', label: 'Line Items', icon: <ListIcon size={18} />, entity: 'line-items', name: 'Line Items' },
        { id: 'categories', label: 'Categories', icon: <Tag size={18} />, entity: 'categories', name: 'Categories' },
        { id: 'sub-categories', label: 'Sub Categories', icon: <Layers size={18} />, entity: 'sub-categories', name: 'Sub Categories' },
        { id: 'product-groups', label: 'Product Groups', icon: <Boxes size={18} />, entity: 'product-groups', name: 'Product Groups' },
        { id: 'category-groups', label: 'Category Groups', icon: <Layers size={18} />, entity: 'category-groups', name: 'Category Groups' },
        { id: 'generics', label: 'Generics', icon: <Package size={18} />, entity: 'generics', name: 'Generics' },
        { id: 'calculate-seasons', label: 'Calculate Seasons', icon: <TrendingUp size={18} />, entity: 'calculate-seasons', name: 'Calculate Seasons' },
        { id: 'manufacturers', label: 'Manufacturers', icon: <Building2 size={18} />, entity: 'manufacturers', name: 'Manufacturers' },
        { id: 'racks', label: 'Racks', icon: <Warehouse size={18} />, entity: 'racks', name: 'Racks' },
        { id: 'suppliers', label: 'Suppliers', icon: <Truck size={18} />, entity: 'suppliers', name: 'Suppliers' },
        { id: 'purchase-conversion-units', label: 'Purchase Units', icon: <Scale size={18} />, entity: 'purchase-conversion-units', name: 'Purchase Conversion Units' },
    ];

    return (
        <div className="fade-in" style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
            {/* Vertical Sidebar Tabs */}
            <div style={{
                width: '260px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexShrink: 0,
                overflowY: 'auto'
            }}>
                <h3 style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '12px',
                    paddingLeft: '12px'
                }}>
                    Master Data
                </h3>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: activeTab === tab.id ? '600' : '400',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span style={{ opacity: activeTab === tab.id ? 1 : 0.7 }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, paddingRight: '8px', minHeight: 0 }}>
                <div className="glass-card" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                            <InventoryCRUDManager
                                key={activeTab} // Force remount on tab change
                                tenantId={tenantId}
                                entity={tabs.find(t => t.id === activeTab)?.entity}
                                entityName={tabs.find(t => t.id === activeTab)?.name}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventorySetup;
