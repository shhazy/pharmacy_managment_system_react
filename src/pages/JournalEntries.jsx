import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, ChevronDown, ChevronRight, Save, X, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

const JournalEntries = ({ tenant }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [accounts, setAccounts] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        lines: [
            { account_id: '', debit_amount: 0, credit_amount: 0, description: '' },
            { account_id: '', debit_amount: 0, credit_amount: 0, description: '' }
        ]
    });

    useEffect(() => {
        fetchEntries();
        fetchAccounts();
    }, [tenant]);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/accounting/journal-entries`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenant }
            });
            if (res.ok) setEntries(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/accounting/accounts`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenant }
            });
            if (res.ok) setAccounts(await res.json());
        } catch (err) { console.error(err); }
    };

    const handleLineChange = (index, field, value) => {
        const newLines = [...formData.lines];
        newLines[index][field] = value;

        // Auto-zero the other side
        if (field === 'debit_amount' && value > 0) newLines[index].credit_amount = 0;
        if (field === 'credit_amount' && value > 0) newLines[index].debit_amount = 0;

        setFormData({ ...formData, lines: newLines });
    };

    const addLine = () => {
        setFormData({
            ...formData,
            lines: [...formData.lines, { account_id: '', debit_amount: 0, credit_amount: 0, description: '' }]
        });
    };

    const removeLine = (index) => {
        if (formData.lines.length <= 2) return;
        setFormData({
            ...formData,
            lines: formData.lines.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = async () => {
        // Validation
        const totalDebit = formData.lines.reduce((sum, line) => sum + Number(line.debit_amount), 0);
        const totalCredit = formData.lines.reduce((sum, line) => sum + Number(line.credit_amount), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            alert(`Entries must balance. Debits: ${totalDebit}, Credits: ${totalCredit}`);
            return;
        }

        try {
            const payload = {
                entry_date: formData.entry_date,
                description: formData.description,
                reference_type: "Manual",
                transaction_type: "Journal",
                lines: formData.lines.map((line, idx) => ({
                    account_id: parseInt(line.account_id),
                    debit_amount: Number(line.debit_amount),
                    credit_amount: Number(line.credit_amount),
                    description: line.description || formData.description,
                    line_number: idx + 1
                }))
            };

            const res = await fetch(`${API_BASE_URL}/accounting/journal-entries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenant
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowModal(false);
                fetchEntries();
                setFormData({
                    entry_date: new Date().toISOString().split('T')[0],
                    description: '',
                    lines: [
                        { account_id: '', debit_amount: 0, credit_amount: 0, description: '' },
                        { account_id: '', debit_amount: 0, credit_amount: 0, description: '' }
                    ]
                });
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to create entry');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating entry');
        }
    };

    return (
        <div style={{ padding: '0px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px', color: '#3b82f6' }}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px', fontWeight: '600' }}>Journal Entries</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Record and manage manual accounting transactions</p>
                    </div>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> New Journal Entry
                </button>
            </div>

            {/* List */}
            <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input type="text" placeholder="Search by description or ID..." style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', outline: 'none' }} />
                    </div>
                </div>

                {loading ? <div style={{ padding: '40px', textAlign: 'center' }}>Loading transactions...</div> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DATE</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DESCRIPTION</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ACCOUNTS & ENTRIES</th>
                                <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(entry => (
                                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                        <div style={{ fontWeight: '500' }}>{entry.entry_date}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{entry.entry_number}</div>
                                    </td>
                                    <td style={{ padding: '16px', verticalAlign: 'top' }}>{entry.description}</td>
                                    <td style={{ padding: '16px' }}>
                                        {entry.lines.map((line, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
                                                <span style={{ color: line.debit_amount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                    {line.account_name || 'Account ' + line.account_id}
                                                </span>
                                                <span style={{ fontFamily: 'monospace' }}>
                                                    {line.debit_amount > 0 ? `Dr. ${line.debit_amount}` : `Cr. ${line.credit_amount}`}
                                                </span>
                                            </div>
                                        ))}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--surface)', width: '800px', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2>New Journal Entry</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Date</label>
                                <input
                                    type="date"
                                    value={formData.entry_date}
                                    onChange={e => setFormData({ ...formData, entry_date: e.target.value })}
                                    style={{ width: '100%', padding: '10px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%', padding: '10px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                    placeholder="e.g. Opening Balance Adjustment"
                                />
                            </div>
                        </div>

                        <table style={{ width: '100%', marginBottom: '16px' }}>
                            <thead style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <tr>
                                    <th style={{ paddingBottom: '8px' }}>Account</th>
                                    <th style={{ paddingBottom: '8px', width: '120px' }}>Debit</th>
                                    <th style={{ paddingBottom: '8px', width: '120px' }}>Credit</th>
                                    <th style={{ width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.lines.map((line, idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '4px' }}>
                                            <select
                                                value={line.account_id}
                                                onChange={e => handleLineChange(idx, 'account_id', e.target.value)}
                                                style={{ width: '100%', padding: '10px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                            >
                                                <option value="">Select Account</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.account_code} - {acc.account_name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ padding: '4px' }}>
                                            <input
                                                type="number"
                                                value={line.debit_amount}
                                                onChange={e => handleLineChange(idx, 'debit_amount', e.target.value)}
                                                style={{ width: '100%', padding: '10px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                            />
                                        </td>
                                        <td style={{ padding: '4px' }}>
                                            <input
                                                type="number"
                                                value={line.credit_amount}
                                                onChange={e => handleLineChange(idx, 'credit_amount', e.target.value)}
                                                style={{ width: '100%', padding: '10px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                            />
                                        </td>
                                        <td>
                                            <button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <button onClick={addLine} style={{ background: 'none', border: '1px dashed var(--border)', width: '100%', padding: '8px', borderRadius: '8px', color: 'var(--text-secondary)', marginBottom: '24px', cursor: 'pointer' }}>+ Add Line</button>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'white', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSubmit} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Save size={18} /> Save Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournalEntries;
