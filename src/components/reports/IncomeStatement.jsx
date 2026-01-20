import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';
import { ReportFilterBar } from './index.jsx';

const IncomeStatement = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/accounting/reports/income-statement?from_date=${fromDate}&to_date=${toDate}`,
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
            console.error('Error fetching income statement:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const profitMargin = reportData ? ((reportData.net_profit / reportData.total_revenue) * 100).toFixed(2) : 0;

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

            {loading ? (
                <div className="glass-card text-center py-24">
                    <RefreshCw size={48} className="animate-spin text-primary mx-auto mb-4" />
                    <p className="text-slate-400">Analyzing financial data...</p>
                </div>
            ) : reportData ? (
                <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                        {/* Revenue Section */}
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderBottom: '1px solid var(--border)' }}>
                                <h3 className="text-lg font-bold text-green-400" style={{ margin: 0 }}>Revenue Stream</h3>
                                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1" style={{ margin: 0 }}>Income accounts</p>
                            </div>
                            <div className="p-6" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {reportData.revenue?.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 12px',
                                        borderBottom: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        background: 'rgba(0,0,0,0.1)'
                                    }}>
                                        <span className="text-slate-300" style={{ fontWeight: '500' }}>{item.account_name}</span>
                                        <span className="text-white font-mono" style={{ fontWeight: '700' }}>
                                            Rs. {parseFloat(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    background: 'linear-gradient(to right, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span className="text-green-400 font-bold uppercase text-xs tracking-widest">Total Revenue</span>
                                    <span className="text-green-400 font-bold font-mono text-2xl">
                                        Rs. {parseFloat(reportData.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Expenses Section */}
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '20px', background: 'rgba(244, 63, 94, 0.05)', borderBottom: '1px solid var(--border)' }}>
                                <h3 className="text-lg font-bold text-red-400" style={{ margin: 0 }}>Operating Expenses</h3>
                                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1" style={{ margin: 0 }}>Cost accounts</p>
                            </div>
                            <div className="p-6" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {reportData.expenses?.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 12px',
                                        borderBottom: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        background: 'rgba(0,0,0,0.1)'
                                    }}>
                                        <span className="text-slate-300" style={{ fontWeight: '500' }}>{item.account_name}</span>
                                        <span className="text-white font-mono" style={{ fontWeight: '700' }}>
                                            Rs. {parseFloat(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    background: 'linear-gradient(to right, rgba(244, 63, 94, 0.2), rgba(244, 63, 94, 0.05))',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(244, 63, 94, 0.3)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span className="text-red-400 font-bold uppercase text-xs tracking-widest">Total Expenses</span>
                                    <span className="text-red-400 font-bold font-mono text-2xl">
                                        Rs. {parseFloat(reportData.total_expenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Profit Summary */}
                    <div className="glass-card" style={{
                        padding: '32px',
                        border: `2px solid ${parseFloat(reportData.net_profit) >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                        background: parseFloat(reportData.net_profit) >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)',
                        borderRadius: '16px'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
                            <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)', paddingRight: '16px' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>Net Financial Result</p>
                                <p style={{ fontSize: '2.5rem', fontWeight: '900', color: parseFloat(reportData.net_profit) >= 0 ? '#10b981' : '#f43f5e', margin: 0 }}>
                                    Rs. {parseFloat(reportData.net_profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>

                            <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)', paddingRight: '16px' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>Profit Margin</p>
                                <p style={{ fontSize: '2.5rem', fontWeight: '900', color: parseFloat(profitMargin) >= 0 ? '#10b981' : '#f43f5e', margin: 0 }}>
                                    {profitMargin}%
                                </p>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>Reporting Period</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{new Date(fromDate).toLocaleDateString()}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: '200' }}>→</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{new Date(toDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default IncomeStatement;
