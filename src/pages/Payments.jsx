import React, { useState, useEffect } from 'react';
import { Banknote, Plus, Search, Filter, Calendar, CreditCard, User, FileText, ChevronRight, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import PaginationControls from '../components/PaginationControls';
import { showSuccess, showError } from '../utils/toast';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [filterSupplier, setFilterSupplier] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const [form, setForm] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        payee_type: 'Supplier',
        payee_id: '',
        amount: '',
        account_id: '',
        description: ''
    });

    const tenantId = localStorage.getItem('tenant_id');

    useEffect(() => {
        fetchInitialData();
        fetchPayments();
    }, []);

    const fetchInitialData = async () => {
        try {
            // Fetch Suppliers
            const supRes = await fetch(`${API_BASE_URL}/inventory/suppliers`, {
                headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const supData = await supRes.json();
            setSuppliers(Array.isArray(supData) ? supData : []);

            // Fetch Cash/Bank Accounts
            const accRes = await fetch(`${API_BASE_URL}/accounting/accounts?account_type=Asset`, {
                headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const accData = await accRes.json();
            // Filter only Cash (1000) and Bank (1100) or similar
            const liquidAccounts = Array.isArray(accData) ? accData.filter(a => a.account_code.startsWith('10') || a.account_code.startsWith('11')) : [];
            setAccounts(liquidAccounts);
            if (liquidAccounts.length > 0) setForm(prev => ({ ...prev, account_id: liquidAccounts[0].id }));
        } catch (err) {
            console.error("Failed to load setup data", err);
        }
    };

    const fetchPayments = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE_URL}/accounting/payment-vouchers`;
            const params = new URLSearchParams();
            if (fromDate) params.append('from_date', fromDate);
            if (toDate) params.append('to_date', to_date);

            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url, {
                headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setPayments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch payments", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/accounting/payment-vouchers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': tenantId,
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    payment_date: form.payment_date,
                    payment_method: form.payment_method,
                    payee_type: form.payee_type,
                    payee_id: parseInt(form.payee_id),
                    amount: parseFloat(form.amount),
                    account_id: parseInt(form.account_id),
                    description: form.description
                })
            });

            if (res.ok) {
                setShowModal(false);
                fetchPayments();
                setForm({
                    payment_date: new Date().toISOString().split('T')[0],
                    payment_method: 'Cash',
                    payee_type: 'Supplier',
                    payee_id: '',
                    amount: '',
                    account_id: accounts[0]?.id || '',
                    description: ''
                });
                showSuccess("Payment Recorded Successfully");
            } else {
                const err = await res.json();
                showError(`Error: ${err.detail || 'Failed to save payment'}`);
            }
        } catch (err) {
            console.error("Failed to save payment", err);
            showError("Failed to save payment");
        }
    };

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px', overflow: 'hidden' }}>
            {/* Header Area */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Banknote size={32} className="text-primary" />
                        Supplier Payments
                    </h1>
                    <p className="text-slate-400">Manage vendor payouts and payment vouchers</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => fetchPayments()}
                        className="p-3 bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} />
                        New Payment
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-card p-4 mb-8 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 ml-1">Date Range</label>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            className="input-field py-2"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                        />
                        <input
                            type="date"
                            className="input-field py-2"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={fetchPayments}
                    className="bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                >
                    Apply Filters
                </button>
            </div>

            {/* Payments Table Area */}
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="w-full text-left">
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr className="text-slate-400 text-xs uppercase tracking-wider" style={{ background: 'var(--surface)' }}>
                                <th className="px-6 py-4 font-semibold">Voucher #</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Payee (Supplier)</th>
                                <th className="px-6 py-4 font-semibold">Method</th>
                                <th className="px-6 py-4 font-semibold">Account</th>
                                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={48} className="opacity-20" />
                                            <p>No payment records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                payments
                                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                                    .map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-white font-mono font-medium">{p.voucher_number}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {new Date(p.payment_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                                        {p.payee_type === 'Supplier' ? 'S' : 'O'}
                                                    </div>
                                                    <span className="text-white">
                                                        {suppliers.find(s => s.id === p.payee_id)?.name || `ID: ${p.payee_id}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700">
                                                    {p.payment_method}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {accounts.find(a => a.id === p.account_id)?.account_name || 'Asset Account'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-lg font-bold text-white">
                                                    Rs. {parseFloat(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center items-center gap-1 text-green-400 text-xs">
                                                    <CheckCircle2 size={14} />
                                                    Posted
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>

                <PaginationControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(payments.length / pageSize)}
                    pageSize={pageSize}
                    totalItems={payments.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* New Payment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-lg shadow-2xl animate-scale-in" style={{ padding: 0 }}>
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white">Create Payment Voucher</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Payment Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field"
                                        value={form.payment_date}
                                        onChange={e => setForm({ ...form, payment_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Method</label>
                                    <select
                                        className="input-field"
                                        value={form.payment_method}
                                        onChange={e => setForm({ ...form, payment_method: e.target.value })}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Card">Card</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Payee (Supplier)</label>
                                <select
                                    required
                                    className="input-field"
                                    value={form.payee_id}
                                    onChange={e => setForm({ ...form, payee_id: e.target.value })}
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (Balance: Rs. {s.ledger_balance || 0})</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">Rs.</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            className="input-field pl-7"
                                            placeholder="0.00"
                                            value={form.amount}
                                            onChange={e => setForm({ ...form, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Paid From</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={form.account_id}
                                        onChange={e => setForm({ ...form, account_id: e.target.value })}
                                    >
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name} ({a.account_code})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Description / Reference</label>
                                <textarea
                                    className="input-field min-h-[100px]"
                                    placeholder="Enter details about this payment..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 rounded-xl font-semibold bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/30 transition-all"
                                >
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
