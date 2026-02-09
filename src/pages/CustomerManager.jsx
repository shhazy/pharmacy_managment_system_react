import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User as UserIcon, Phone, Mail, MapPin, CreditCard, ChevronRight, X, Save } from 'lucide-react';
import { customerAPI } from '../services/api';
import PaginationControls from '../components/PaginationControls';
import { showSuccess, showError } from '../utils/toast';
import ConfirmDialog from '../components/ConfirmDialog';

const CustomerManager = ({ tenantId }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal & Form
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState(getInitialFormData());

    // Dropdowns
    const [types, setTypes] = useState([]);
    const [groups, setGroups] = useState([]);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);

    function getInitialFormData() {
        return {
            customer_code: '',
            name: '',
            type_id: '',
            group_id: '',
            start_date: '',
            expiry_date: '',
            status: 'Active',
            marital_status: 'Single',
            ref_no: '',
            ref_name: '',
            ref_phone: '',
            city: '',
            area: '',
            phone_res: '',
            phone_off: '',
            mobile_phone: '',
            fax: '',
            email: '',
            address: '',
            comments: '',
            mailing_status: false,
            ntn_no: '',
            gst_reg_no: '',
            cnic: '',
            occupation: '',
            alt_card_no: '',
            end_date: '',
            allow_credit: false,
            credit_limit: 0,
            opening_balance: 0,
            opening_amount: 0,
            opening_date: ''
        };
    }

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        loadCustomers();
    }, [tenantId, currentPage, pageSize, debouncedSearchTerm]);

    useEffect(() => {
        if (showModal) {
            loadDropdowns();
        }
    }, [showModal]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const response = await customerAPI.list(tenantId, {
                page: currentPage,
                page_size: pageSize,
                search: debouncedSearchTerm
            });
            setCustomers(response.items);
            setTotalItems(response.total);
            setTotalPages(response.total_pages);
        } catch (error) {
            showError("Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    const loadDropdowns = async () => {
        try {
            const [typesData, groupsData] = await Promise.all([
                customerAPI.listAllTypes(tenantId),
                customerAPI.listAllGroups(tenantId)
            ]);
            setTypes(typesData);
            setGroups(groupsData);
        } catch (error) {
            console.error("Error loading dropdowns", error);
        }
    };

    const handleCreate = () => {
        setEditingCustomer(null);
        setFormData(getInitialFormData());
        setShowModal(true);
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            ...getInitialFormData(),
            ...customer,
            type_id: customer.type_id || '',
            group_id: customer.group_id || '',
            start_date: customer.start_date || '',
            expiry_date: customer.expiry_date || '',
            opening_date: customer.opening_date || '',
            end_date: customer.end_date || ''
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setIdToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await customerAPI.delete(idToDelete, tenantId);
            showSuccess("Customer deleted successfully");
            loadCustomers();
            setIsConfirmOpen(false);
        } catch (error) {
            showError("Failed to delete customer");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Clean up empty strings for optional fields if needed, or let backend handle
            const submissionData = { ...formData };
            if (submissionData.type_id === '') submissionData.type_id = null;
            if (submissionData.group_id === '') submissionData.group_id = null;

            // Fix: Date fields should be null if empty string
            const dateFields = ['start_date', 'expiry_date', 'end_date', 'opening_date'];
            dateFields.forEach(field => {
                if (submissionData[field] === '') submissionData[field] = null;
            });

            if (editingCustomer) {
                await customerAPI.update(editingCustomer.id, submissionData, tenantId);
                showSuccess("Customer updated successfully");
            } else {
                await customerAPI.create(submissionData, tenantId);
                showSuccess("Customer created successfully");
            }
            setShowModal(false);
            loadCustomers();
        } catch (error) {
            let msg = "Failed to save customer";
            if (error.detail && Array.isArray(error.detail)) {
                msg = error.detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
            } else if (error.message) {
                msg = error.message;
            }
            showError(msg);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '6px',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        fontWeight: '500'
    };

    const sectionTitleStyle = {
        fontSize: '1rem',
        fontWeight: '600',
        color: 'var(--primary)',
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>Customer Management</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage your pharmacy customers and credit accounts</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        borderRadius: '10px',
                        fontWeight: '600'
                    }}
                >
                    <Plus size={20} />
                    Add Customer
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '16px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search by name, code or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: '40px' }}
                    />
                </div>
            </div>

            {/* List */}
            <div className="glass-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>CUSTOMER</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>CONTACT</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>TYPE / GROUP</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>CREDIT STATUS</th>
                                <th style={{ padding: '16px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No customers found</td>
                                </tr>
                            ) : (
                                customers.map(customer => (
                                    <tr key={customer.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--primary)'
                                                }}>
                                                    <UserIcon size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{customer.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{customer.customer_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Phone size={14} /> {customer.mobile_phone || 'N/A'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                <Mail size={14} /> {customer.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{
                                                display: 'inline-flex',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: 'rgba(16, 185, 129, 0.1)',
                                                color: '#10b981',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                marginBottom: '4px'
                                            }}>
                                                {customer.customer_type?.name || 'Standard'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {customer.customer_group?.name || 'General'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {customer.allow_credit ? (
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: '600' }}>
                                                        Limit: {new Intl.NumberFormat().format(customer.credit_limit)}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        Bal: {new Intl.NumberFormat().format(customer.opening_balance)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No Credit</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleEdit(customer)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(customer.id)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            </div>

            {/* Form Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>
                                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>

                                {/* Section: General Info */}
                                <div style={{ gridColumn: 'span 3' }}>
                                    <div style={sectionTitleStyle}><UserIcon size={18} /> Basic Information</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                        <div>
                                            <label style={labelStyle}>Customer Code <span style={{ color: '#ef4444' }}>*</span></label>
                                            <input required type="text" value={formData.customer_code} onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })} style={inputStyle} placeholder="e.g. C001" />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                                            <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} placeholder="John Doe" />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Customer Type</label>
                                            <select value={formData.type_id} onChange={(e) => setFormData({ ...formData, type_id: e.target.value })} style={inputStyle}>
                                                <option value="">Select Type</option>
                                                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Customer Group</label>
                                            <select value={formData.group_id} onChange={(e) => setFormData({ ...formData, group_id: e.target.value })} style={inputStyle}>
                                                <option value="">Select Group</option>
                                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Start Date</label>
                                            <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Expiry Date</label>
                                            <input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Status</label>
                                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={inputStyle}>
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                                <option value="Blocked">Blocked</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Marital Status</label>
                                            <select value={formData.marital_status} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })} style={inputStyle}>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Contact Info */}
                                <div style={{ gridColumn: 'span 2' }}>
                                    <div style={sectionTitleStyle}><MapPin size={18} /> Contact & Address</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                        <div>
                                            <label style={labelStyle}>Mobile Phone</label>
                                            <input type="text" value={formData.mobile_phone} onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Email Address</label>
                                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>City</label>
                                            <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Area</label>
                                            <input type="text" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={labelStyle}>Full Address</label>
                                            <textarea rows="2" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={{ ...inputStyle, resize: 'none' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Credit Info */}
                                <div style={{ gridColumn: 'span 1' }}>
                                    <div style={sectionTitleStyle}><CreditCard size={18} /> Credit Settings</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
                                            <input type="checkbox" id="allow_credit" checked={formData.allow_credit} onChange={(e) => setFormData({ ...formData, allow_credit: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                            <label htmlFor="allow_credit" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer', fontSize: '1rem' }}>Allow Credit Sales</label>
                                        </div>
                                        {formData.allow_credit && (
                                            <>
                                                <div>
                                                    <label style={labelStyle}>Credit Limit</label>
                                                    <input type="number" value={formData.credit_limit} onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })} style={inputStyle} />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Opening Balance</label>
                                                    <input type="number" value={formData.opening_balance} onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })} style={inputStyle} />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Opening Date</label>
                                                    <input type="date" value={formData.opening_date} onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })} style={inputStyle} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Section: IDs & Taxation */}
                                <div style={{ gridColumn: 'span 3' }}>
                                    <div style={sectionTitleStyle}><ChevronRight size={18} /> Identification & Taxation</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                        <div>
                                            <label style={labelStyle}>CNIC / ID Number</label>
                                            <input type="text" value={formData.cnic} onChange={(e) => setFormData({ ...formData, cnic: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>NTN Number</label>
                                            <input type="text" value={formData.ntn_no} onChange={(e) => setFormData({ ...formData, ntn_no: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>GST Registration</label>
                                            <input type="text" value={formData.gst_reg_no} onChange={(e) => setFormData({ ...formData, gst_reg_no: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Occupation</label>
                                            <input type="text" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} style={inputStyle} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '12px 32px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '12px 40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Save size={18} />
                                    {editingCustomer ? 'Update Customer' : 'Save Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Customer"
                message="Are you sure you want to deactivate this customer? This action will not delete historical records."
                type="danger"
            />
        </div>
    );
};

export default CustomerManager;
