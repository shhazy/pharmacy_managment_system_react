import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';
import { ReportFilterBar } from './index.jsx';

const BalanceSheet = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/accounting/reports/balance-sheet?as_of_date=${asOfDate}`,
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
            console.error('Error fetching balance sheet:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const isEquationBalanced = reportData ?
        Math.abs(Number(reportData.total_assets || 0) - (Number(reportData.total_liabilities || 0) + Number(reportData.total_equity || 0))) < 0.01 : false;

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
                    <p className="text-slate-400">Compiling assets and liabilities...</p>
                </div>
            ) : reportData ? (
                <div className="space-y-6">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                        {/* Assets Pillar */}
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', borderBottom: '1px solid var(--border)' }}>
                                <h3 className="text-lg font-bold text-green-400" style={{ margin: 0 }}>Assets</h3>
                                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1" style={{ margin: 0 }}>What the pharmacy owns</p>
                            </div>
                            <div className="p-6" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {reportData.assets?.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 12px',
                                        borderBottom: idx === (reportData.assets.length - 1) ? 'none' : '1px solid var(--border)',
                                        borderRadius: '8px',
                                        transition: 'background 0.2s'
                                    }} className="hover:bg-slate-800/10">
                                        <span className="text-slate-300" style={{ fontSize: '0.95rem' }}>{item.account_name}</span>
                                        <span className="text-white font-mono" style={{ fontWeight: '600' }}>
                                            Rs. {parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    background: 'linear-gradient(to right, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span className="text-green-400 font-bold uppercase text-xs tracking-widest">Total Assets</span>
                                    <span className="text-green-400 font-bold font-mono text-2xl">
                                        Rs. {parseFloat(reportData.total_assets || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Liabilities & Equity Pillar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Liabilities Section */}
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '20px', background: 'rgba(244, 63, 94, 0.05)', borderBottom: '1px solid var(--border)' }}>
                                    <h3 className="text-lg font-bold text-red-400" style={{ margin: 0 }}>Liabilities</h3>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest mt-1" style={{ margin: 0 }}>What the pharmacy owes</p>
                                </div>
                                <div className="p-6" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {reportData.liabilities?.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span className="text-slate-300 text-sm">{item.account_name}</span>
                                            <span className="text-white font-mono text-sm">Rs. {parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0 0', marginTop: '12px' }}>
                                        <span className="text-red-400 font-bold text-xs uppercase tracking-widest">Total Liabilities</span>
                                        <span className="text-red-400 font-bold font-mono" style={{ fontSize: '1.1rem' }}>
                                            Rs. {parseFloat(reportData.total_liabilities || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Equity Section */}
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.05)', borderBottom: '1px solid var(--border)' }}>
                                    <h3 className="text-lg font-bold text-indigo-400" style={{ margin: 0 }}>Equity</h3>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest mt-1" style={{ margin: 0 }}>Owners' residual interest</p>
                                </div>
                                <div className="p-6" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {reportData.equity?.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span className="text-slate-300 text-sm">{item.account_name}</span>
                                            <span className="text-white font-mono text-sm">Rs. {parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0 0', marginTop: '12px' }}>
                                        <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest">Total Equity</span>
                                        <span className="text-indigo-400 font-bold font-mono" style={{ fontSize: '1.1rem' }}>
                                            Rs. {parseFloat(reportData.total_equity || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Equation Verification */}
                    <div className="glass-card" style={{
                        padding: '32px',
                        border: `2px solid ${isEquationBalanced ? 'rgba(99, 102, 241, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                        background: isEquationBalanced ? 'rgba(99, 102, 241, 0.05)' : 'rgba(244, 63, 94, 0.05)'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <h4 style={{
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                fontWeight: '900',
                                color: 'var(--text-secondary)',
                                letterSpacing: '0.3em',
                                marginBottom: '32px'
                            }}>
                                Fundamental Accounting Equation
                            </h4>

                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '8px' }}>TOTAL ASSETS</p>
                                    <p style={{ fontSize: '2rem', fontWeight: '900', color: '#10b981', margin: 0 }}>
                                        Rs. {parseFloat(reportData.total_assets || 0).toLocaleString()}
                                    </p>
                                </div>

                                <div style={{ fontSize: '2rem', color: 'var(--border)', fontWeight: '200' }}>=</div>

                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '8px' }}>LIABILITIES</p>
                                    <p style={{ fontSize: '2rem', fontWeight: '900', color: '#f43f5e', margin: 0 }}>
                                        Rs. {parseFloat(reportData.total_liabilities || 0).toLocaleString()}
                                    </p>
                                </div>

                                <div style={{ fontSize: '2rem', color: 'var(--border)', fontWeight: '200' }}>+</div>

                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '8px' }}>EQUITY</p>
                                    <p style={{ fontSize: '2rem', fontWeight: '900', color: '#6366f1', margin: 0 }}>
                                        Rs. {parseFloat(reportData.total_equity || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '32px',
                                paddingTop: '24px',
                                borderTop: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}>
                                {isEquationBalanced ? (
                                    <>
                                        <CheckCircle2 size={18} className="text-green-400" />
                                        <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em' }}>
                                            Balance Sheet Equation Verified
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={18} className="text-red-400" />
                                        <span style={{ color: '#f43f5e', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.1em' }}>
                                            Equation Out of Balance
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default BalanceSheet;
