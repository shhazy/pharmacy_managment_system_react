import { useState, useEffect, Fragment } from 'react';
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const ChartOfAccounts = ({ tenant }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, [tenant]);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/accounting/accounts`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenant
                }
            });
            if (res.ok) {
                const data = await res.json();
                setAccounts(data);
                // Auto-expand top level
                const initialExpanded = {};
                data.filter(a => !a.parent_account_id).forEach(a => initialExpanded[a.id] = true);
                setExpanded(initialExpanded);
            }
        } catch (err) {
            console.error("Failed to fetch accounts", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Helper to build hierarchy
    const buildHierarchy = (accs) => {
        const map = {};
        const roots = [];
        accs.forEach(a => {
            map[a.id] = { ...a, children: [] };
        });
        accs.forEach(a => {
            if (a.parent_account_id && map[a.parent_account_id]) {
                map[a.parent_account_id].children.push(map[a.id]);
            } else {
                roots.push(map[a.id]);
            }
        });
        return roots;
    };

    const filteredAccounts = accounts.filter(a =>
        a.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.account_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Only build hierarchy if not searching, otherwise show flat list
    const displayData = searchTerm ? filteredAccounts : buildHierarchy(accounts);

    const renderRow = (account, level = 0) => {
        const hasChildren = account.children && account.children.length > 0;
        const isExpanded = expanded[account.id];

        return (
            <Fragment key={account.id}>
                <tr style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row">
                    <td style={{ padding: '16px', paddingLeft: `${16 + level * 24}px`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {hasChildren && !searchTerm ? (
                            <button onClick={() => toggleExpand(account.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : <span style={{ width: '14px' }}></span>}
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{account.account_code}</span>
                        <span style={{ fontWeight: level === 0 ? '600' : '400', color: level === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{account.account_name}</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            fontWeight: '500'
                        }}>
                            {account.account_type}
                        </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                        {account.parent_account_id ? (
                            <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>POSTABLE</span>
                        ) : (
                            <span style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>MAIN</span>
                        )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                        {/* Actions placeholder */}
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                    </td>
                </tr>
                {isExpanded && account.children && account.children.map(child => renderRow(child, level + 1))}
            </Fragment>
        );
    };

    return (
        <div style={{ padding: '0px', maxWidth: '100%', margin: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px', color: '#3b82f6' }}>
                        <Search size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px', fontWeight: '600' }}>Chart of Accounts</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your general ledger accounts structure.</p>
                    </div>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> Add Main Account
                </button>
            </div>

            <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* Filters */}
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search by code or name..."
                            style={{
                                width: '100%',
                                padding: '10px 10px 10px 40px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'white',
                                outline: 'none'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading chart of accounts...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr>
                                <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Account Name</th>
                                <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Type</th>
                                <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchTerm ?
                                displayData.map(acc => (
                                    <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', marginRight: '12px' }}>{acc.account_code}</span>
                                            {acc.account_name}
                                        </td>
                                        <td style={{ padding: '16px' }}>{acc.account_type}</td>
                                        <td style={{ padding: '16px' }}>
                                            {acc.parent_account_id ? 'POSTABLE' : 'MAIN'}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}><Edit2 size={16} color="var(--text-secondary)" /></td>
                                    </tr>
                                ))
                                :
                                displayData.map(root => renderRow(root))
                            }
                        </tbody>
                    </table>
                )}
            </div>
            <style>{`
        .table-row:hover { background: rgba(255,255,255,0.02); }
      `}</style>
        </div>
    );
};

export default ChartOfAccounts;
