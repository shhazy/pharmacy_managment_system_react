import React, { useState } from 'react';
import {
    FileText, TrendingUp, DollarSign, Users, Package,
    Calendar, BarChart3, PieChart, ArrowLeft, ChevronRight,
    Activity, ClipboardList, Clock
} from 'lucide-react';
import TrialBalance from '../components/reports/TrialBalance';
import BalanceSheet from '../components/reports/BalanceSheet';
import IncomeStatement from '../components/reports/IncomeStatement';
import {
    SalesRegister, PurchaseRegister, SupplierLedger,
    APAging, ARAging, DayBook, GeneralLedger
} from '../components/reports/index.jsx';

const Reports = () => {
    const [selectedReportId, setSelectedReportId] = useState(null);

    const reportCategories = [
        {
            title: 'Financial Statements',
            icon: <TrendingUp size={24} color="var(--primary)" />,
            description: 'Core financial health indicators and official statements.',
            reports: [
                { id: 'trial-balance', name: 'Trial Balance', icon: <BarChart3 size={20} />, component: TrialBalance, desc: 'Balance check of all ledger accounts.' },
                { id: 'balance-sheet', name: 'Balance Sheet', icon: <PieChart size={20} />, component: BalanceSheet, desc: 'Assets, liabilities, and equity snapshot.' },
                { id: 'income-statement', name: 'Income Statement (P&L)', icon: <TrendingUp size={20} />, component: IncomeStatement, desc: 'Revenue vs expenses and profitability.' },
            ]
        },
        {
            title: 'Operational Reports',
            icon: <Activity size={24} color="#10b981" />,
            description: 'Day-to-day transaction records and operational logs.',
            reports: [
                { id: 'day-book', name: 'Day Book', icon: <Calendar size={20} />, component: DayBook, desc: 'Daily transaction log in chronological order.' },
                { id: 'sales-register', name: 'Sales Register', icon: <DollarSign size={20} />, component: SalesRegister, desc: 'Complete history of patient sales and invoices.' },
                { id: 'purchase-register', name: 'Purchase Register', icon: <Package size={20} />, component: PurchaseRegister, desc: 'Record of stock inventory arrivals (GRNs).' },
                { id: 'supplier-ledger', name: 'Supplier Ledger', icon: <Users size={20} />, component: SupplierLedger, desc: 'Detailed statement of supplier accounts.' },
                { id: 'general-ledger', name: 'General Ledger', icon: <ClipboardList size={20} />, component: GeneralLedger, desc: 'In-depth transaction view of all accounts.' },
            ]
        },
        {
            title: 'Aging Reports',
            icon: <Clock size={24} color="#f59e0b" />,
            description: 'Credit and debt tracking reports for cash flow management.',
            reports: [
                { id: 'ap-aging', name: 'Accounts Payable Aging', icon: <Users size={20} />, component: APAging, desc: 'Analysis of unpaid supplier bills by due dates.' },
                { id: 'ar-aging', name: 'Accounts Receivable Aging', icon: <Users size={20} />, component: ARAging, desc: 'Tracking of outstanding receivables from credits.' },
            ]
        }
    ];

    const currentReport = reportCategories
        .flatMap(c => c.reports)
        .find(r => r.id === selectedReportId);

    if (selectedReportId && currentReport) {
        const ReportComponent = currentReport.component;
        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                    <button
                        onClick={() => setSelectedReportId(null)}
                        className="btn-secondary"
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <ArrowLeft size={18} />
                        Back to Reports List
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>{currentReport.name}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{currentReport.desc}</p>
                    </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                    <ReportComponent />
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div style={{ marginBottom: '10px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', background: 'linear-gradient(to right, #fff, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Financial Insights
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    Access comprehensive reports to track your pharmacy's financial health and operational efficiency.
                </p>
            </div>

            {reportCategories.map((category, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{
                            padding: '10px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            {category.icon}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{category.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{category.description}</p>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px'
                    }}>
                        {category.reports.map((report) => (
                            <div
                                key={report.id}
                                className="glass-card"
                                style={{
                                    padding: '24px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    height: '100%',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onClick={() => setSelectedReportId(report.id)}
                            >
                                <div style={{
                                    position: 'absolute',
                                    right: '-10px',
                                    top: '-10px',
                                    opacity: 0.05,
                                    transform: 'scale(4)'
                                }}>
                                    {report.icon}
                                </div>

                                <div>
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary)',
                                        marginBottom: '16px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {report.icon}
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{report.name}</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                        {report.desc}
                                    </p>
                                </div>

                                <div style={{
                                    marginTop: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: 'var(--primary)',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                }}>
                                    Generate Report <ChevronRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Reports;
