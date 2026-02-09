import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react';
import { customerAPI } from '../services/api';
import PaginationControls from '../components/PaginationControls';
import { showSuccess, showError } from '../utils/toast';
import ConfirmDialog from '../components/ConfirmDialog';

const GenericCustomerCRUD = ({ tenantId, entity, entityName }) => {
    const [items, setItems] = useState([]);
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
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        loadItems();
    }, [tenantId, currentPage, pageSize, debouncedSearchTerm, entity]);

    const loadItems = async () => {
        try {
            setLoading(true);
            let response;
            if (entity === 'types') {
                response = await customerAPI.listTypes(tenantId, { page: currentPage, page_size: pageSize, search: debouncedSearchTerm });
            } else {
                response = await customerAPI.listGroups(tenantId, { page: currentPage, page_size: pageSize, search: debouncedSearchTerm });
            }
            setItems(response.items);
            setTotalItems(response.total);
            setTotalPages(response.total_pages);
        } catch (error) {
            showError(`Failed to load ${entityName}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({ name: '', description: '' });
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ name: item.name, description: item.description || '' });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setIdToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        try {
            if (entity === 'types') {
                await customerAPI.deleteType(idToDelete, tenantId);
            } else {
                await customerAPI.deleteGroup(idToDelete, tenantId);
            }
            showSuccess(`${entityName} deleted successfully`);
            loadItems();
            setIsConfirmOpen(false);
        } catch (error) {
            showError(`Failed to delete ${entityName}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                if (entity === 'types') {
                    await customerAPI.updateType(editingItem.id, formData, tenantId);
                } else {
                    await customerAPI.updateGroup(editingItem.id, formData, tenantId);
                }
                showSuccess(`${entityName} updated successfully`);
            } else {
                if (entity === 'types') {
                    await customerAPI.createType(formData, tenantId);
                } else {
                    await customerAPI.createGroup(formData, tenantId);
                }
                showSuccess(`${entityName} created successfully`);
            }
            setShowModal(false);
            loadItems();
        } catch (error) {
            let msg = `Failed to save ${entityName}`;
            if (error.detail && Array.isArray(error.detail)) {
                msg = error.detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
            } else if (error.message) {
                msg = error.message;
            }
            showError(msg);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{entityName}</h2>
                <button onClick={handleCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px' }}>
                    <Plus size={18} /> Add New
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ padding: '12px', display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder={`Search ${entityName.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                    />
                </div>
            </div>

            {/* List */}
            <div className="glass-card" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>NAME</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DESCRIPTION</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No data found</td></tr>
                        ) : (
                            items.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>{item.name}</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{item.description || '-'}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleEdit(item)} style={{ padding: '6px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.1)', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(item.id)} style={{ padding: '6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} totalItems={totalItems} onPageSizeChange={setPageSize} />

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>{editingItem ? 'Edit' : 'Create'} {entityName}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Description</label>
                                <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', resize: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}><Save size={16} /> Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete} title={`Delete ${entityName}`} message={`Are you sure you want to delete this ${entityName.toLowerCase()}?`} type="danger" />
        </div>
    );
};

export default GenericCustomerCRUD;
