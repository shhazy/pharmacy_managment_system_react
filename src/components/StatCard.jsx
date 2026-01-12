// Reusable stat card component
const StatCard = ({ label, value, icon, trend }) => {
    return (
        <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    {icon}
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{trend}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>{label}</p>
            <h3 style={{ fontSize: '2rem' }}>{value}</h3>
        </div>
    );
};

export default StatCard;
