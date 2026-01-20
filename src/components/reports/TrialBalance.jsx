import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';
import { ReportFilterBar } from './index.jsx';

const TrialBalance = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/accounting/reports/trial-balance?as_of_date=${asOfDate}`,
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
            console.error('Error fetching trial balance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const isBalanced = reportData ? Math.abs(reportData.total_debit - reportData.total_credit) < 0.01 : false;

    return (
        <div className="fade-in">
            <ReportFilterBar
                onFetch={fetchReport}
                loading={loading}
                asOfDate={asOfDate}
                setAsOfDate={setAsOfDate}
            />

            {loading ? (
                <div className="glass-card text-center py-24">
                    <RefreshCw size={48} className="animate-spin text-primary mx-auto mb-4" />
                    <p className="text-slate-400">Balancing account ledgers...</p>
                </div>
            ) : reportData ? (
                <div className="space-y-6">
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-wider">
                                        <th className="text-left py-4 px-6">Account Code</th>
                                        <th className="text-left py-4 px-6">Account Name</th>
                                        <th className="text-left py-4 px-6">Type</th>
                                        <th className="text-right py-4 px-6">Debit Balance</th>
                                        <th className="text-right py-4 px-6">Credit Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.items?.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-6 text-slate-400 font-mono text-xs">{item.account_code}</td>
                                            <td className="py-4 px-6 text-white font-medium">{item.account_name}</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${item.account_type === 'Asset' || item.account_type === 'Expense'
                                                        ? 'bg-blue-500/10 text-blue-400'
                                                        : 'bg-purple-500/10 text-purple-400'
                                                    }`}>
                                                    {item.account_type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right text-green-400 font-mono">
                                                {item.debit_balance > 0 ? `Rs. ${item.debit_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                                            </td>
                                            <td className="py-4 px-6 text-right text-indigo-400 font-mono">
                                                {item.credit_balance > 0 ? `Rs. ${item.credit_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-800/50">
                                    <tr className="font-bold">
                                        <td colSpan="3" className="py-6 px-6 text-white text-right uppercase tracking-widest text-xs">Total Trial Balance</td>
                                        <td className="py-6 px-6 text-right text-green-400 font-mono text-xl border-t border-slate-700">
                                            Rs. {reportData.total_debit?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-6 px-6 text-right text-indigo-400 font-mono text-xl border-t border-slate-700">
                                            Rs. {reportData.total_credit?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className={`glass-card p-6 flex items-center gap-4 border-2 ${isBalanced ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
                        }`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isBalanced ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {isBalanced ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        </div>
                        <div>
                            <h4 className={`text-lg font-bold ${isBalanced ? 'text-green-400' : 'text-red-400'}`}>
                                {isBalanced ? 'Trial Balance Verified' : 'Trial Balance Out of Sync'}
                            </h4>
                            <p className="text-slate-400 text-sm">
                                {isBalanced
                                    ? 'All ledger accounts are correctly balanced. Total debits match total credits.'
                                    : 'There is a discrepancy between total debits and credits. Please check journal entries.'}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default TrialBalance;
