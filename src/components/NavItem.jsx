// Reusable navigation item component
const NavItem = ({ icon, label, active, onClick }) => {
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: '8px',
                background: active ? 'var(--primary)' : 'transparent',
                border: 'none',
                borderRadius: '12px',
                color: active ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.95rem',
                transition: 'all 0.2s',
                textAlign: 'left'
            }}
            onMouseEnter={(e) => {
                if (!active) e.target.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
                if (!active) e.target.style.background = 'transparent';
            }}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};

export default NavItem;
