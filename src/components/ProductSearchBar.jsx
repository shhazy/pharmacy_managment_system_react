import React, { useState, forwardRef } from 'react';
import { Search } from 'lucide-react';

const ProductSearchBar = forwardRef(({
    value,
    onChange,
    placeholder = "Medicine name or scan... (F3 list)",
    onFocus,
    onBlur,
    onKeyDown,
    style = {},
    containerStyle = {}
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    // If ref is not provided locally, we can safely ignore focus-on-click or use a backup
    const handleContainerClick = () => {
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.focus();
        }
    };

    return (
        <div
            onClick={handleContainerClick}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${isFocused ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '24px',
                padding: '0 16px',
                height: '42px',
                transition: 'all 0.2s ease',
                boxShadow: isFocused ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none',
                cursor: 'text',
                flex: 1,
                minWidth: '200px',
                ...containerStyle
            }}
        >
            <Search
                size={18}
                style={{
                    color: isFocused ? 'var(--primary)' : 'var(--text-secondary)',
                    marginRight: '12px',
                    transition: 'color 0.2s'
                }}
            />
            <input
                ref={ref}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onFocus={(e) => {
                    setIsFocused(true);
                    onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    onBlur?.(e);
                }}
                onKeyDown={onKeyDown}
                style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'white',
                    width: '100%',
                    fontSize: '0.9rem',
                    ...style
                }}
            />
        </div>
    );
});

export default ProductSearchBar;
