import React from 'react';

const DenominationInput = ({ values, onChange }) => {
    const denominations = [
        { key: 'notes_5000', label: 'Rs. 5000', type: 'note' },
        { key: 'notes_1000', label: 'Rs. 1000', type: 'note' },
        { key: 'notes_500', label: 'Rs. 500', type: 'note' },
        { key: 'notes_100', label: 'Rs. 100', type: 'note' },
        { key: 'notes_50', label: 'Rs. 50', type: 'note' },
        { key: 'notes_20', label: 'Rs. 20', type: 'note' },
        { key: 'notes_10', label: 'Rs. 10', type: 'note' },
        { key: 'notes_5', label: 'Rs. 5', type: 'note' },
        { key: 'notes_1', label: 'Rs. 1', type: 'note' },
        { key: 'coins_5', label: 'Rs. 5 Coin', type: 'coin' },
        { key: 'coins_2', label: 'Rs. 2 Coin', type: 'coin' },
        { key: 'coins_1', label: 'Rs. 1 Coin', type: 'coin' },
    ];

    const handleCountChange = (key, count) => {
        const val = parseInt(count) || 0;
        onChange({ ...values, [key]: val });
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
        }}>
            {denominations.map((denom) => (
                <div key={denom.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'between',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.3s'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}>{denom.label}</div>
                        <div style={{ fontSize: '10px', color: 'rgb(156 163 175)', textTransform: 'uppercase' }}>{denom.type}</div>
                    </div>
                    <div>
                        <input
                            type="number"
                            min="0"
                            value={values[denom.key] || ''}
                            onChange={(e) => handleCountChange(denom.key, e.target.value)}
                            style={{
                                width: '70px',
                                background: 'rgba(0, 0, 0, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                color: 'white',
                                textAlign: 'right',
                                fontFamily: 'monospace',
                                outline: 'none'
                            }}
                            placeholder="0"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DenominationInput;
