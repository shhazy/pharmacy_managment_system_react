import React, { useState, forwardRef } from 'react';
import { Users } from 'lucide-react';

const CustomerSearchBar = forwardRef(({
    value,
    onChange,
    placeholder = "Search customer (Name, Mobile, Code)...",
    onFocus,
    onBlur,
    onKeyDown,
    style = {},
    containerStyle = {}
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);

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
                border: `1px solid ${isFocused ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '24px',
                padding: '0 16px',
                height: '42px',
                transition: 'all 0.2s ease',
                boxShadow: isFocused ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
                cursor: 'text',
                flex: 1,
                minWidth: '200px',
                ...containerStyle
            }}
        >
            <Users
                size={18}
                style={{
                    color: isFocused ? '#10b981' : 'var(--text-secondary)',
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

export default CustomerSearchBar;
