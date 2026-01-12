import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const NavDropdown = ({ icon, label, items, activeView, setActiveView }) => {
    const isChildActive = items.some(item => item.view === activeView);
    const [isOpen, setIsOpen] = useState(isChildActive);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (isChildActive) setIsOpen(true);
    }, [isChildActive]);

    const handleItemClick = (view) => {
        setActiveView(view);
        // Keep dropdown open - don't close it
    };

    return (
        <div style={{ marginBottom: '8px' }}>
            <button
                onClick={handleToggle}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: isOpen ? 'var(--primary)' : 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    color: isOpen ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                    if (!isOpen) e.target.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) e.target.style.background = 'transparent';
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {icon}
                    <span>{label}</span>
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {isOpen && (
                <div style={{
                    marginLeft: '24px',
                    marginTop: '4px',
                    paddingLeft: '12px',
                    borderLeft: '2px solid var(--border)'
                }}>
                    {items.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => handleItemClick(item.view)}
                            style={{
                                width: '100%',
                                padding: '10px 16px',
                                marginBottom: '4px',
                                background: activeView === item.view ? 'var(--primary)' : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: activeView === item.view ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                                if (activeView !== item.view) e.target.style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                if (activeView !== item.view) e.target.style.background = 'transparent';
                            }}
                        >
                            {item.icon && <span style={{ opacity: 0.7 }}>{item.icon}</span>}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NavDropdown;
