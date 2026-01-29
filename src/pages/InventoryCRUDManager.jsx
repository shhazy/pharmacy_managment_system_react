import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { inventoryCRUDAPI, appSettingsAPI } from '../services/api';
import PaginationControls from '../components/PaginationControls';
import { showSuccess, showError } from '../utils/toast';
import ConfirmDialog from '../components/ConfirmDialog';

const InventoryCRUDManager = ({ tenantId, entity, entityName }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', category_id: null });
    const [categories, setCategories] = useState([]);

    // Deletion confirmation state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const initSettings = async () => {
            try {
                const settings = await appSettingsAPI.get(tenantId);
                if (settings && settings.default_listing_rows) {
                    setPageSize(settings.default_listing_rows);
                }
            } catch (error) {
                console.error('Error fetching app settings:', error);
            }
        };
        initSettings();
    }, [tenantId]);

    useEffect(() => {
        loadItems();
        if (entity === 'sub-categories') {
            loadCategories();
        }
    }, [entity, tenantId, currentPage, pageSize, debouncedSearchTerm]);


    const loadCategories = async () => {
        try {
            const data = await inventoryCRUDAPI.listAll('categories', tenantId);
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadItems = async () => {
        try {
            if (items.length === 0) setLoading(true);
            else setRefreshing(true);

            const response = await inventoryCRUDAPI.list(entity, tenantId, {
                page: currentPage,
                page_size: pageSize,
                search: debouncedSearchTerm
            });
            setItems(response.items);
            setTotalItems(response.total);
            setTotalPages(response.total_pages);
        } catch (error) {
            console.error(`Error loading ${entityName}:`, error);
            showError(`Error loading ${entityName}: ${error.message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({ name: '', category_id: null });
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category_id: item.category_id || null
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setIdToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        try {
            await inventoryCRUDAPI.delete(entity, idToDelete, tenantId);
            showSuccess(`${entityName} deleted successfully`);
            loadItems();
        } catch (error) {
            console.error(`Error deleting ${entityName}:`, error);
            showError(`Error deleting ${entityName}: ${error.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await inventoryCRUDAPI.update(entity, editingItem.id, formData, tenantId);
            } else {
                await inventoryCRUDAPI.create(entity, formData, tenantId);
            }
            setShowModal(false);
            loadItems();
        } catch (error) {
            console.error(`Error saving ${entityName}:`, error);
            showError(`Error saving ${entityName}: ${error.message}`);
        }
    };


    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        }}>
            {/* Header with Actions - Fixed */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '24px',
                flexShrink: 0,
                paddingBottom: '20px',
                borderBottom: '1px solid var(--border)'
            }}>
                <div style={{ flexShrink: 0 }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
                        {entityName}
                    </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                    <div style={{
                        position: 'relative',
                        flex: 1,
                        maxWidth: '400px'
                    }}>
                        <Search size={18} style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-secondary)'
                        }} />
                        <input
                            type="text"
                            placeholder={`Search ${entityName.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 40px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleCreate}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                        }}
                    >
                        <Plus size={18} />
                        Add New
                    </button>
                </div>
            </div>

            {/* Items List - Scrollable */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                position: 'relative',
                flex: 1,
                overflowY: 'auto',
                minHeight: 0
            }}>
                {/* Initial Loading State */}
                {loading && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        background: 'var(--background)',
                        zIndex: 20,
                        gap: '12px'
                    }}>
                        <div className="spin" style={{ width: '24px', height: '24px', border: '2px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                        <span>Loading {entityName}...</span>
                    </div>
                )}

                {/* Refreshing Overlay */}
                {refreshing && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(1px)',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{ background: 'var(--surface)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div className="spin" style={{ width: '12px', height: '12px', border: '2px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                            Updating...
                        </div>
                    </div>
                )}

                {items.length === 0 && !loading ? (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        No {entityName.toLowerCase()} found. Click "Add New" to create one.
                    </div>
                ) : (
                    <table style={{
                        width: '100%',
                        borderCollapse: 'separate',
                        borderSpacing: 0,
                        opacity: refreshing ? 0.6 : 1,
                        transition: 'opacity 0.2s',
                        visibility: loading ? 'hidden' : 'visible'
                    }}>
                        <thead style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 10
                        }}>
                            <tr style={{
                                borderBottom: '1px solid var(--border)'
                            }}>
                                <th style={{
                                    padding: '16px',
                                    textAlign: 'left',
                                    color: 'var(--text-primary)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    background: '#1a1f2e', // Solid background for sticky header
                                    borderBottom: '1px solid var(--border)'
                                }}>Name</th>
                                {entity === 'sub-categories' && (
                                    <th style={{
                                        padding: '16px',
                                        textAlign: 'left',
                                        color: 'var(--text-primary)',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        background: '#1a1f2e',
                                        borderBottom: '1px solid var(--border)'
                                    }}>Category</th>
                                )}
                                <th style={{
                                    padding: '16px',
                                    textAlign: 'left',
                                    color: 'var(--text-primary)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    background: '#1a1f2e',
                                    borderBottom: '1px solid var(--border)'
                                }}>Status</th>
                                <th style={{
                                    padding: '16px',
                                    textAlign: 'right',
                                    color: 'var(--text-primary)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    background: '#1a1f2e',
                                    borderBottom: '1px solid var(--border)'
                                }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} style={{
                                    borderBottom: '1px solid var(--border)',
                                    transition: 'background 0.2s'
                                }}
                                    onMouseEnter={(e) => e.target.parentElement.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={(e) => e.target.parentElement.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '16px', color: 'var(--text-primary)' }}>
                                        {item.name}
                                    </td>
                                    {entity === 'sub-categories' && (
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                                            {categories.find(c => c.id === item.category_id)?.name || 'N/A'}
                                        </td>
                                    )}
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            background: item.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: item.is_active ? '#10b981' : '#ef4444',
                                            border: `1px solid ${item.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                        }}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleEdit(item)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                                    borderRadius: '6px',
                                                    color: '#818cf8',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <Edit2 size={14} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                                    borderRadius: '6px',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ flexShrink: 0 }}>
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}
                    onClick={() => setShowModal(false)}
                >
                    <div style={{
                        background: 'var(--surface)',
                        borderRadius: '12px',
                        padding: '24px',
                        width: '90%',
                        maxWidth: '500px',
                        border: '1px solid var(--border)'
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                {editingItem ? `Edit ${entityName}` : `Create ${entityName}`}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem',
                                    fontWeight: '500'
                                }}>
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            {entity === 'sub-categories' && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}>
                                        Category *
                                    </label>
                                    <select
                                        required
                                        value={formData.category_id || ''}
                                        onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'flex-end',
                                marginTop: '24px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'transparent',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 20px',
                                        background: 'var(--primary)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    {editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setIdToDelete(null);
                }}
                onConfirm={confirmDelete}
                title={`Delete ${entityName}`}
                message={`Are you sure you want to delete this ${entityName.toLowerCase()}? This action might affect related data and cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

export default InventoryCRUDManager;
