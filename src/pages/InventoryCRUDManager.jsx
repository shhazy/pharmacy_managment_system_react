import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { inventoryCRUDAPI } from '../services/api';

const InventoryCRUDManager = ({ tenantId, entity, entityName }) => {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', category_id: null });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadItems();
        if (entity === 'sub-categories') {
            loadCategories();
        }
    }, [entity, tenantId]);

    useEffect(() => {
        if (searchTerm) {
            setFilteredItems(items.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        } else {
            setFilteredItems(items);
        }
    }, [searchTerm, items]);

    const loadCategories = async () => {
        try {
            const data = await inventoryCRUDAPI.list('categories', tenantId);
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadItems = async () => {
        try {
            setLoading(true);
            const data = await inventoryCRUDAPI.list(entity, tenantId);
            setItems(data);
            setFilteredItems(data);
        } catch (error) {
            console.error(`Error loading ${entityName}:`, error);
            alert(`Error loading ${entityName}: ${error.message}`);
        } finally {
            setLoading(false);
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

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${entityName.toLowerCase()}?`)) {
            return;
        }
        try {
            await inventoryCRUDAPI.delete(entity, id, tenantId);
            loadItems();
        } catch (error) {
            console.error(`Error deleting ${entityName}:`, error);
            alert(`Error deleting ${entityName}: ${error.message}`);
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
            alert(`Error saving ${entityName}: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '400px',
                color: 'var(--text-secondary)'
            }}>
                Loading {entityName}...
            </div>
        );
    }

    return (
        <div>
            {/* Header with Actions */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
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
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 40px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
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
                        fontWeight: '500'
                    }}
                >
                    <Plus size={18} />
                    Add New
                </button>
            </div>

            {/* Items List */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                overflow: 'hidden'
            }}>
                {filteredItems.length === 0 ? (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        No {entityName.toLowerCase()} found. Click "Add New" to create one.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderBottom: '1px solid var(--border)'
                            }}>
                                <th style={{
                                    padding: '16px',
                                    textAlign: 'left',
                                    color: 'var(--text-primary)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>Name</th>
                                {entity === 'sub-categories' && (
                                    <th style={{
                                        padding: '16px',
                                        textAlign: 'left',
                                        color: 'var(--text-primary)',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}>Category</th>
                                )}
                                <th style={{
                                    padding: '16px',
                                    textAlign: 'left',
                                    color: 'var(--text-primary)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>Status</th>
                                <th style={{
                                    padding: '16px',
                                    textAlign: 'right',
                                    color: 'var(--text-primary)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
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
        </div>
    );
};

export default InventoryCRUDManager;
