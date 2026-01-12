import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

const Inventory = ({ tenant }) => {
    const navigate = useNavigate();
    const [medicines, setMedicines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/inventory`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'X-Tenant-ID': tenant
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMedicines(data);
                }
            } catch (err) {
                console.error("Fetch failed", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInventory();
    }, [tenant]);

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <button
                onClick={() => navigate('/dashboard')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginBottom: '24px' }}
            >
                <ChevronLeft size={16} /> Back to Dashboard
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Inventory</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your medicine stock and pricing for {tenant}.</p>
                </div>
                <button className="btn-primary">
                    <Plus size={20} /> Add New Medicine
                </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search medicines..."
                        style={{ paddingLeft: '48px' }}
                    />
                </div>
                <button style={{ padding: '0 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                    <Filter size={20} />
                </button>
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading inventory...</div>
                ) : medicines.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No medicines found.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '20px' }}>Medicine Name</th>
                                <th style={{ padding: '20px' }}>Category</th>
                                <th style={{ padding: '20px' }}>Stock</th>
                                <th style={{ padding: '20px' }}>Price</th>
                                <th style={{ padding: '20px' }}>Expiry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicines.map((med) => (
                                <tr key={med.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row">
                                    <td style={{ padding: '20px', fontWeight: '600' }}>{med.name}</td>
                                    <td style={{ padding: '20px', color: 'var(--text-secondary)' }}>{med.category}</td>
                                    <td style={{ padding: '20px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            background: med.stock_quantity < 50 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            color: med.stock_quantity < 50 ? '#f43f5e' : '#10b981',
                                            fontSize: '0.8rem',
                                            fontWeight: '600'
                                        }}>
                                            {med.stock_quantity} units
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px' }}>${med.price}</td>
                                    <td style={{ padding: '20px', color: 'var(--text-secondary)' }}>
                                        {med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style>{`
        .table-row:hover {
          background: rgba(255,255,255,0.02);
        }
        th {
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
        </div>
    );
};

export default Inventory;
