import React, { useState } from 'react';
import { Layers, Tag, List as ListIcon } from 'lucide-react';
import GenericCustomerCRUD from './GenericCustomerCRUD';

const CustomerSetup = ({ tenantId }) => {
    const [activeTab, setActiveTab] = useState('types');

    const tabs = [
        { id: 'types', label: 'Customer Types', icon: <Tag size={18} />, entity: 'types', name: 'Customer Types' },
        { id: 'groups', label: 'Customer Groups', icon: <Layers size={18} />, entity: 'groups', name: 'Customer Groups' },
    ];

    return (
        <div className="fade-in" style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
            {/* Vertical Sidebar */}
            <div style={{
                width: '260px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexShrink: 0
            }}>
                <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '12px' }}>Customer Master Data</h3>
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
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1 }}>
                <GenericCustomerCRUD
                    key={activeTab}
                    tenantId={tenantId}
                    entity={tabs.find(t => t.id === activeTab)?.entity}
                    entityName={tabs.find(t => t.id === activeTab)?.name}
                />
            </div>
        </div>
    );
};

export default CustomerSetup;
