import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, RefreshCw, Printer, Download, ChevronRight, Users, FileText, Clock, ClipboardList, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

/**
 * A premium, unified filter bar for all reports.
 * Used for date ranges and entity selection (like suppliers).
 */
export const ReportFilterBar = ({
    onFetch,
    loading,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    asOfDate,
    setAsOfDate,
    children // For extra filters like Supplier select
}) => {
    return (
        <div className="glass-card fade-in" style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>

                {asOfDate !== undefined && (
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <Calendar size={14} className="text-primary" />
                            AS OF DATE
                        </label>
                        <input
                            type="date"
                            className="input-field"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
                        />
                    </div>
                )}

                {fromDate !== undefined && (
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <Calendar size={14} className="text-primary" />
                            FROM DATE
                        </label>
                        <input
                            type="date"
                            className="input-field"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                )}

                {toDate !== undefined && (
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <Calendar size={14} className="text-primary" />
                            TO DATE
                        </label>
                        <input
                            type="date"
                            className="input-field"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                )}

                {children}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onFetch}
                        disabled={loading}
                        className="btn-primary"
                        style={{ height: '45px', padding: '0 24px', whiteSpace: 'nowrap' }}
                    >
                        {loading ? <RefreshCw size={18} className="animate-spin" /> : <Filter size={18} />}
                        Generate Report
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="btn-secondary"
                        style={{ height: '45px', width: '45px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Print Report"
                    >
                        <Printer size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const PurchaseRegister = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/accounting/reports/purchase-register?from_date=${fromDate}&to_date=${toDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'X-Tenant-ID': localStorage.getItem('tenant_id')
                    }
                }
            );
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error fetching purchase register:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, []);

    return (
        <div className="fade-in">
            <ReportFilterBar
                onFetch={fetchReport}
                loading={loading}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
            />

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">GRN #</th>
                            <th className="px-6 py-4 font-semibold">Supplier</th>
                            <th className="px-6 py-4 font-semibold">Invoice #</th>
                            <th className="px-6 py-4 font-semibold">Mode</th>
                            <th className="px-6 py-4 font-semibold text-right">Adv. Tax</th>
                            <th className="px-6 py-4 font-semibold text-right">Net Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {reportData?.items?.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-800/20 text-slate-300">
                                <td className="px-6 py-4">{new Date(item.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-mono text-white">{item.grn_number}</td>
                                <td className="px-6 py-4">{item.supplier_name}</td>
                                <td className="px-6 py-4">{item.invoice_number || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${item.payment_mode === 'Cash' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        {item.payment_mode}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-yellow-400">
                                    {parseFloat(item.advance_tax) > 0 ? `Rs. ${parseFloat(item.advance_tax).toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-white">Rs. {parseFloat(item.amount).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>TOTAL PURCHASES</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>Rs. {parseFloat(reportData?.total_amount || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SupplierLedger = () => {
    const [reportData, setReportData] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const tenantId = localStorage.getItem('tenant_id');

    useEffect(() => {
        const fetchSuppliers = async () => {
            const res = await fetch(`${API_BASE_URL}/inventory/suppliers`, {
                headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setSuppliers(Array.isArray(data) ? data : []);
        };
        fetchSuppliers();
    }, []);

    const fetchReport = async () => {
        if (!selectedSupplier) return;
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/accounting/reports/supplier-ledger/${selectedSupplier}?from_date=${fromDate}&to_date=${toDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'X-Tenant-ID': tenantId
                    }
                }
            );
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error fetching supplier ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <ReportFilterBar
                onFetch={fetchReport}
                loading={loading}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
            >
                <div style={{ flex: '1.5', minWidth: '250px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <Users size={14} className="text-primary" />
                        SELECT SUPPLIER
                    </label>
                    <select
                        className="input-field"
                        value={selectedSupplier}
                        onChange={e => setSelectedSupplier(e.target.value)}
                    >
                        <option value="">Choose a supplier...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </ReportFilterBar>

            {reportData && (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.05)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>OPENING BALANCE</p>
                            <p style={{ fontWeight: '700', color: 'white' }}>Rs. {reportData.opening_balance?.toLocaleString()}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>CURRENT PAYABLE</p>
                            <p style={{ fontWeight: '800', color: '#f43f5e', fontSize: '1.2rem' }}>Rs. {reportData.closing_balance?.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/30 text-slate-400 text-[10px] uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Ref #</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Debit (Paid)</th>
                                    <th className="px-6 py-4 text-right">Credit (Purchase)</th>
                                    <th className="px-6 py-4 text-right">Running Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-sm">
                                {reportData.transactions.map((t, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/10 text-slate-300">
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(t.transaction_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{t.reference_number}</td>
                                        <td className="px-6 py-4 text-xs max-w-xs truncate" title={t.description}>{t.description}</td>
                                        <td className="px-6 py-4 text-right text-green-400">{t.debit_amount > 0 ? `Rs. ${parseFloat(t.debit_amount).toLocaleString()}` : '-'}</td>
                                        <td className="px-6 py-4 text-right text-red-400">{t.credit_amount > 0 ? `Rs. ${parseFloat(t.credit_amount).toLocaleString()}` : '-'}</td>
                                        <td className="px-6 py-4 text-right font-bold text-white">Rs. {parseFloat(t.balance).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export const SalesRegister = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/accounting/reports/sales-register?from_date=${fromDate}&to_date=${toDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'X-Tenant-ID': localStorage.getItem('tenant_id')
                    }
                }
            );
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error fetching sales register:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, []);

    return (
        <div className="fade-in">
            <ReportFilterBar
                onFetch={fetchReport}
                loading={loading}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
            />

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.05)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '32px' }}>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 'bold' }}>TOTAL SALES</p>
                        <p style={{ fontWeight: '800', color: '#6366f1', fontSize: '1.2rem' }}>Rs. {parseFloat(reportData?.total_sales || 0).toLocaleString()}</p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 'bold' }}>RETURNS</p>
                        <p style={{ fontWeight: '800', color: '#f43f5e', fontSize: '1.2rem' }}>Rs. {parseFloat(reportData?.total_returns || 0).toLocaleString()}</p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 'bold' }}>NET SALES</p>
                        <p style={{ fontWeight: '800', color: '#10b981', fontSize: '1.2rem' }}>Rs. {parseFloat(reportData?.net_sales || 0).toLocaleString()}</p>
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Invoice #</th>
                            <th className="px-6 py-4 font-semibold">Customer</th>
                            <th className="px-6 py-4 font-semibold">Mode</th>
                            <th className="px-6 py-4 font-semibold text-right">Amount</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                        {reportData?.sales?.map((sale, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/20 text-slate-300">
                                <td className="px-6 py-4">{new Date(sale.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-mono text-white">{sale.invoice_number}</td>
                                <td className="px-6 py-4">{sale.customer_name}</td>
                                <td className="px-6 py-4">{sale.payment_method}</td>
                                <td className={`px-6 py-4 text-right font-bold ${sale.status === 'Return' ? 'text-red-400' : 'text-white'}`}>
                                    Rs. {parseFloat(sale.net_total).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${sale.status === 'Paid' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {sale.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const DayBook = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/accounting/reports/day-book?from_date=${fromDate}&to_date=${toDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'X-Tenant-ID': localStorage.getItem('tenant_id')
                    }
                }
            );
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error fetching day book:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, []);

    return (
        <div className="fade-in">
            <ReportFilterBar
                onFetch={fetchReport}
                loading={loading}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
            />

            {reportData?.entries?.map((entry, idx) => (
                <div key={idx} className="glass-card mb-4" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: '800', fontMono: true }}>{entry.entry_number}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(entry.entry_date).toLocaleDateString()}</span>
                            <span className="bg-slate-800 px-3 py-1 rounded text-[10px] uppercase font-bold text-slate-400">{entry.transaction_type}</span>
                        </div>
                        <p style={{ color: 'white', fontWeight: '500', fontSize: '0.9rem' }}>{entry.description}</p>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="text-slate-500 text-[10px] uppercase font-bold opacity-50">
                            <tr>
                                <th className="px-6 py-2">Code</th>
                                <th className="px-6 py-2">Account</th>
                                <th className="px-6 py-2 text-right">Debit</th>
                                <th className="px-6 py-2 text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {entry.lines.map((line, lidx) => (
                                <tr key={lidx} className="text-slate-300">
                                    <td className="px-6 py-3 font-mono text-xs">{line.account_code}</td>
                                    <td className="px-6 py-3">{line.account_name}</td>
                                    <td className="px-6 py-3 text-right text-green-400">{line.debit_amount > 0 ? `Rs. ${parseFloat(line.debit_amount).toLocaleString()}` : '-'}</td>
                                    <td className="px-6 py-3 text-right text-red-400">{line.credit_amount > 0 ? `Rs. ${parseFloat(line.credit_amount).toLocaleString()}` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export const APAging = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/accounting/reports/accounts-payable-aging?as_of_date=${asOfDate}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': localStorage.getItem('tenant_id') }
            });
            const data = await response.json();
            setReportData(data);
        } catch (error) { console.error('Error fetching AP aging:', error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchReport(); }, []);

    return (
        <div className="fade-in">
            <ReportFilterBar onFetch={fetchReport} loading={loading} asOfDate={asOfDate} setAsOfDate={setAsOfDate} />
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-wider">
                            <th className="px-6 py-4">Supplier</th>
                            <th className="px-6 py-4 text-right">Total Payable</th>
                            <th className="px-6 py-4 text-right">Current</th>
                            <th className="px-6 py-4 text-right">31-60</th>
                            <th className="px-6 py-4 text-right">61-90</th>
                            <th className="px-6 py-4 text-right">91-120</th>
                            <th className="px-6 py-4 text-right">120+</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {reportData?.items?.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/20 text-slate-300">
                                <td className="px-6 py-4 font-bold text-white">{item.entity_name}</td>
                                <td className="px-6 py-4 text-right font-bold">Rs. {parseFloat(item.total_balance).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">Rs. {parseFloat(item.current).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">Rs. {parseFloat(item['30_days']).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">Rs. {parseFloat(item['60_days']).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">Rs. {parseFloat(item['90_days']).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">Rs. {parseFloat(item.over_90_days).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const ARAging = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/accounting/reports/accounts-receivable-aging?as_of_date=${asOfDate}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': localStorage.getItem('tenant_id') }
            });
            const data = await response.json();
            setReportData(data);
        } catch (error) { console.error('Error fetching AR aging:', error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchReport(); }, []);

    return (
        <div className="fade-in">
            <ReportFilterBar onFetch={fetchReport} loading={loading} asOfDate={asOfDate} setAsOfDate={setAsOfDate} />
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-wider">
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4 text-right">Total Receivable</th>
                            <th className="px-6 py-4 text-right">Current</th>
                            <th className="px-6 py-4 text-right">31-60</th>
                            <th className="px-6 py-4 text-right">61-90</th>
                            <th className="px-6 py-4 text-right">91-120</th>
                            <th className="px-6 py-4 text-right">120+</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {reportData?.items?.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/20 text-slate-300">
                                <td className="px-6 py-4 font-bold text-white">{item.entity_name}</td>
                                <td className="px-6 py-4 text-right font-bold">Rs. {parseFloat(item.total_balance).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">Rs. {parseFloat(item.current).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">Rs. {parseFloat(item['30_days']).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">Rs. {parseFloat(item['60_days']).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">Rs. {parseFloat(item['90_days']).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">Rs. {parseFloat(item.over_90_days).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const GeneralLedger = () => {
    const [reportData, setReportData] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchAccounts = async () => {
            const res = await fetch(`${API_BASE_URL}/accounting/accounts`, {
                headers: { 'X-Tenant-ID': localStorage.getItem('tenant_id'), 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setAccounts(Array.isArray(data) ? data : []);
        };
        fetchAccounts();
    }, []);

    const fetchReport = async () => {
        if (!selectedAccount) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/accounting/reports/general-ledger/${selectedAccount}?from_date=${fromDate}&to_date=${toDate}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': localStorage.getItem('tenant_id') }
            });
            const data = await response.json();
            setReportData(data);
        } catch (error) { console.error('Error fetching GL:', error); } finally { setLoading(false); }
    };

    return (
        <div className="fade-in">
            <ReportFilterBar onFetch={fetchReport} loading={loading} fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate}>
                <div style={{ flex: '1.5', minWidth: '250px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <ClipboardList size={14} className="text-primary" />
                        SELECT ACCOUNT
                    </label>
                    <select className="input-field" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                        <option value="">Choose an account...</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
                    </select>
                </div>
            </ReportFilterBar>

            {reportData && (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <p className="text-slate-400 text-[10px] uppercase font-bold">Opening Balance</p>
                            <p className="text-white font-bold">Rs. {parseFloat(reportData.opening_balance).toLocaleString()}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p className="text-slate-400 text-[10px] uppercase font-bold">Closing Balance</p>
                            <p className="text-primary font-black text-xl">Rs. {parseFloat(reportData.closing_balance).toLocaleString()}</p>
                        </div>
                    </div>
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-800/30 text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Ref #</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right">Debit</th>
                                <th className="px-6 py-4 text-right">Credit</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {reportData.transactions.map((t, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/10 text-slate-300">
                                    <td className="px-6 py-4">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-mono text-primary">{t.entry_number}</td>
                                    <td className="px-6 py-4">{t.description}</td>
                                    <td className="px-6 py-4 text-right text-green-400">{t.debit_amount > 0 ? `Rs. ${parseFloat(t.debit_amount).toLocaleString()}` : '-'}</td>
                                    <td className="px-6 py-4 text-right text-red-400">{t.credit_amount > 0 ? `Rs. ${parseFloat(t.credit_amount).toLocaleString()}` : '-'}</td>
                                    <td className="px-6 py-4 text-right font-bold text-white">Rs. {parseFloat(t.balance).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export const CashSessionRegister = () => {
    const [reportData, setReportData] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const tenantId = localStorage.getItem('tenant_id');

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cash-registers/sessions?start_date=${fromDate}&end_date=${toDate}`, {
                headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setReportData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionDetail = async (sessionId) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cash-registers/sessions/${sessionId}`, {
                headers: { 'X-Tenant-ID': tenantId, 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setSelectedSession(data);
        } catch (error) {
            console.error('Error fetching session detail:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSessions(); }, []);

    if (selectedSession) {
        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <button
                    onClick={() => setSelectedSession(null)}
                    className="btn-secondary"
                    style={{ width: 'fit-content', border: 'none', background: 'transparent', paddingLeft: 0, color: 'var(--primary)' }}
                >
                    <ArrowLeft size={18} />
                    Back to Session List
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--primary)' }}>
                        <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Session Info</p>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>{selectedSession.session_number}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Register:</span> <span style={{ color: 'white', fontWeight: 'bold' }}>{selectedSession.register?.register_name}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Cashier ID:</span> <span style={{ color: 'white', fontWeight: 'bold' }}>{selectedSession.user_id}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Status:</span> <span style={{ color: selectedSession.status === 'open' ? '#10b981' : '#94a3b8', fontWeight: 'bold' }}>{selectedSession.status.toUpperCase()}</span></div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #3b82f6' }}>
                        <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Reconciliation</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', marginTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Expected:</span> <span style={{ color: 'white' }}>Rs. {parseFloat(selectedSession.expected_cash || 0).toLocaleString()}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Counted:</span> <span style={{ color: 'white' }}>Rs. {parseFloat(selectedSession.closing_counted_cash || 0).toLocaleString()}</span></div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>Variance:</span>
                                <span style={{ fontWeight: '900', color: parseFloat(selectedSession.variance || 0) < 0 ? '#f43f5e' : parseFloat(selectedSession.variance || 0) > 0 ? '#f59e0b' : '#10b981' }}>
                                    Rs. {parseFloat(selectedSession.variance || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #a855f7' }}>
                        <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Timeline</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', marginTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Opened:</span> <span style={{ color: 'white' }}>{new Date(selectedSession.opened_at).toLocaleString()}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Closed:</span> <span style={{ color: 'white' }}>{selectedSession.closed_at ? new Date(selectedSession.closed_at).toLocaleString() : 'Running...'}</span></div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold' }}>
                            <DollarSign size={18} />
                            CASH MOVEMENTS
                        </div>
                        <table style={{ width: '100%', fontSize: '0.85rem' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <tr style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '10px' }}>
                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Type</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Reason</th>
                                    <th style={{ textAlign: 'right', padding: '12px 16px' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedSession.cash_movements?.map((m, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                background: m.movement_type === 'deposit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                                color: m.movement_type === 'deposit' ? '#10b981' : '#f43f5e'
                                            }}>
                                                {m.movement_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{m.reason}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: 'white' }}>Rs. {parseFloat(m.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {(!selectedSession.cash_movements || selectedSession.cash_movements.length === 0) && (
                                    <tr><td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>No cash movements recorded</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="glass-card" style={{ padding: 0 }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontWeight: 'bold' }}>
                            <Activity size={18} />
                            CLOSING DENOMINATIONS
                        </div>
                        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {['notes_5000', 'notes_1000', 'notes_500', 'notes_100', 'notes_50', 'notes_20', 'notes_10', 'notes_5', 'notes_1', 'coins_5', 'coins_2', 'coins_1'].map(key => {
                                const val = selectedSession.closing_denomination?.[key] || 0;
                                if (val === 0) return null;
                                const label = key.replace('_', ' ').replace('notes', 'Rs.').replace('coins', 'Coin').toUpperCase();
                                return (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{label}</span>
                                        <span style={{ color: 'white', fontFamily: 'monospace', fontWeight: 'bold' }}>x {val}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <ReportFilterBar
                onFetch={fetchSessions}
                loading={loading}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
            />

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginTop: '24px' }}>
                <table style={{ width: '100%', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(30, 41, 59, 0.5)', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '16px 24px' }}>Session #</th>
                            <th style={{ padding: '16px 24px' }}>Register</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right' }}>Cash In</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right' }}>Returns</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right' }}>Variance</th>
                            <th style={{ padding: '16px 24px' }}>Status</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody style={{ color: '#cbd5e1' }}>
                        {reportData.map(session => (
                            <tr key={session.id} style={{ borderBottom: '1px solid rgba(30, 41, 59, 1)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px 24px' }}>
                                    <div style={{ color: 'white', fontWeight: 'bold' }}>{session.session_number}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>{new Date(session.opened_at).toLocaleString()}</div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>{session.register?.register_name || `ID: ${session.register_id}`}</td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>Rs. {parseFloat(session.expected_cash || 0).toLocaleString()}</td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>---</td>
                                <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 'bold', color: parseFloat(session.variance || 0) < 0 ? '#f43f5e' : parseFloat(session.variance || 0) > 0 ? '#f59e0b' : '#10b981' }}>
                                    Rs. {parseFloat(session.variance || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '20px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        background: session.status === 'open' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                        color: session.status === 'open' ? '#10b981' : '#94a3b8'
                                    }}>
                                        {session.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                    <button
                                        onClick={() => fetchSessionDetail(session.id)}
                                        className="btn-secondary"
                                        style={{ padding: '8px', border: 'none', background: 'transparent', color: 'var(--primary)' }}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {reportData.length === 0 && !loading && (
                            <tr><td colSpan="7" style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>No sessions found for the selected period</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
