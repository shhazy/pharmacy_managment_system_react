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
