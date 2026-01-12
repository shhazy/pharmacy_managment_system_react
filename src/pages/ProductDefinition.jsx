import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Plus, Search, ChevronDown } from 'lucide-react';
import { inventoryCRUDAPI, API_BASE_URL } from '../services/api';

const ProductDefinition = ({ tenantId, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [lineItems, setLineItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [productGroups, setProductGroups] = useState([]);
    const [categoryGroups, setCategoryGroups] = useState([]);
    const [generics, setGenerics] = useState([]);
    const [calculateSeasons, setCalculateSeasons] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [racks, setRacks] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [purchaseConvUnits, setPurchaseConvUnits] = useState([]);

    // Search states for dropdowns
    const [searchStates, setSearchStates] = useState({
        lineItem: '', category: '', subCategory: '', productGroup: '', categoryGroup: '',
        generic: '', calSeason: '', manufacturer: '', rack: '', supplier: '', purchaseConvUnit: ''
    });

    // Form data
    const [formData, setFormData] = useState(initialData || {
        line_item_id: null,
        product_name: '',
        category_id: null,
        sub_category_id: null,
        product_group_id: null,
        category_group_id: null,
        generics_id: null,
        cal_season_id: null,
        manufacturer_id: null,
        rack_id: null,
        supplier_id: null,
        purchase_conv_unit_id: null,
        control_drug: false,
        purchase_conv_factor: null,
        average_cost: null,
        date: new Date().toISOString().split('T')[0],
        retail_price: null,
        active: true,
        technical_details: '',
        internal_comments: '',
        product_type: 1, // 1 = Basic, 2 = Assembly
        min_inventory_level: null,
        optimal_inventory_level: null,
        max_inventory_level: null,
        allow_below_cost_sale: false,
        allow_price_change: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]
            });
        }
    }, [initialData]);

    useEffect(() => {
        loadAllData();
    }, [tenantId]);

    const loadAllData = async () => {
        try {
            setLoading(true);
            const [
                lineItemsData, categoriesData, subCategoriesData, productGroupsData,
                categoryGroupsData, genericsData, calSeasonsData, manufacturersData,
                racksData, suppliersData, purchaseConvUnitsData
            ] = await Promise.all([
                inventoryCRUDAPI.list('line-items', tenantId),
                inventoryCRUDAPI.list('categories', tenantId),
                inventoryCRUDAPI.list('sub-categories', tenantId),
                inventoryCRUDAPI.list('product-groups', tenantId),
                inventoryCRUDAPI.list('category-groups', tenantId),
                inventoryCRUDAPI.list('generics', tenantId),
                inventoryCRUDAPI.list('calculate-seasons', tenantId),
                inventoryCRUDAPI.list('manufacturers', tenantId),
                inventoryCRUDAPI.list('racks', tenantId),
                inventoryCRUDAPI.list('suppliers', tenantId),
                inventoryCRUDAPI.list('purchase-conversion-units', tenantId)
            ]);

            setLineItems(lineItemsData || []);
            setCategories(categoriesData || []);
            setSubCategories(subCategoriesData || []);
            setProductGroups(productGroupsData || []);
            setCategoryGroups(categoryGroupsData || []);
            setGenerics(genericsData || []);
            setCalculateSeasons(calSeasonsData || []);
            setManufacturers(manufacturersData || []);
            setRacks(racksData || []);
            setSuppliers(suppliersData || []);
            setPurchaseConvUnits(purchaseConvUnitsData || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                ...formData,
                date: formData.date ? new Date(formData.date).toISOString() : null
            };

            const isEditing = !!formData.id;
            const url = isEditing ? `${API_BASE_URL}/products/${formData.id}` : `${API_BASE_URL}/products`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': tenantId,
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                alert(`Error: ${error.detail || 'Failed to save product'}`);
            } else {
                alert(isEditing ? 'Product updated successfully!' : 'Product created successfully!');
                // Reset form
                setFormData({
                    line_item_id: null, product_name: '', category_id: null, sub_category_id: null,
                    product_group_id: null, category_group_id: null, generics_id: null,
                    cal_season_id: null, manufacturer_id: null, rack_id: null, supplier_id: null,
                    purchase_conv_unit_id: null, control_drug: false, purchase_conv_factor: null,
                    average_cost: null, date: new Date().toISOString().split('T')[0], retail_price: null,
                    active: true, technical_details: '', internal_comments: '', product_type: 1,
                    min_inventory_level: null, optimal_inventory_level: null, max_inventory_level: null,
                    allow_below_cost_sale: false, allow_price_change: true
                });
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    // Searchable dropdown component
    const SearchableDropdown = ({
        label, value, options, searchKey, onChange, placeholder, entity, onAddNew
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);
        const searchTerm = searchStates[searchKey] || '';
        const filteredOptions = options.filter(opt =>
            opt.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const selectedOption = options.find(opt => opt.id === value);

        // Close dropdown when clicking outside
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                    setSearchStates(prev => ({ ...prev, [searchKey]: '' }));
                }
            };
            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [isOpen, searchKey]);

        return (
            <div ref={dropdownRef} style={{ marginBottom: '16px', position: 'relative' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }}>
                    {label}
                </label>
                <div style={{ position: 'relative' }}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            width: '100%',
                            padding: '10px 40px 10px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span>{selectedOption ? selectedOption.name : placeholder}</span>
                        <ChevronDown size={16} />
                    </button>
                    {isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            marginTop: '4px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ padding: '8px' }}>
                                <div style={{ position: 'relative', marginBottom: '8px' }}>
                                    <Search size={16} style={{
                                        position: 'absolute',
                                        left: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--text-secondary)'
                                    }} />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchStates(prev => ({ ...prev, [searchKey]: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '8px 8px 8px 32px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.85rem'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                {onAddNew && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onAddNew(entity);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            marginBottom: '8px',
                                            background: 'var(--primary)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Plus size={14} />
                                        Add New {label}
                                    </button>
                                )}
                                {filteredOptions.length === 0 ? (
                                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        No options found
                                    </div>
                                ) : (
                                    filteredOptions.map(option => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(option.id);
                                                setIsOpen(false);
                                                setSearchStates(prev => ({ ...prev, [searchKey]: '' }));
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                background: value === option.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                marginBottom: '4px'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (value !== option.id) e.target.style.background = 'rgba(255,255,255,0.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (value !== option.id) e.target.style.background = 'transparent';
                                            }}
                                        >
                                            {option.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'var(--text-secondary)' }}>
                Loading...
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '24px'
            }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--text-primary)' }}>
                    Product Definition
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    {/* Left Column */}
                    <div>
                        <SearchableDropdown
                            label="Line Item"
                            value={formData.line_item_id}
                            options={lineItems}
                            searchKey="lineItem"
                            onChange={(id) => setFormData(prev => ({ ...prev, line_item_id: id }))}
                            placeholder="Select Line Item"
                            entity="line-items"
                            onAddNew={(entity) => {
                                const name = prompt('Enter Line Item name:');
                                if (name) {
                                    inventoryCRUDAPI.create(entity, { name }, tenantId)
                                        .then(() => loadAllData())
                                        .catch(err => alert('Error creating line item: ' + err.message));
                                }
                            }}
                        />

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Product Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.product_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
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

                        <SearchableDropdown
                            label="Category"
                            value={formData.category_id}
                            options={categories}
                            searchKey="category"
                            onChange={(id) => setFormData(prev => ({ ...prev, category_id: id }))}
                            placeholder="Select Category"
                            entity="categories"
                            onAddNew={(entity) => {
                                const name = prompt('Enter Category name:');
                                if (name) {
                                    inventoryCRUDAPI.create(entity, { name }, tenantId)
                                        .then(() => loadAllData())
                                        .catch(err => alert('Error creating category: ' + err.message));
                                }
                            }}
                        />

                        <SearchableDropdown
                            label="Sub Category"
                            value={formData.sub_category_id}
                            options={subCategories}
                            searchKey="subCategory"
                            onChange={(id) => setFormData(prev => ({ ...prev, sub_category_id: id }))}
                            placeholder="Select Sub Category"
                            entity="sub-categories"
                            onAddNew={(entity) => {
                                const name = prompt('Enter Sub Category name:');
                                if (!name) return;

                                let catId = formData.category_id;
                                if (!catId) {
                                    const input = prompt('Please enter Category ID (or select Category first):');
                                    if (!input) return;
                                    catId = parseInt(input);
                                }

                                if (name && catId) {
                                    inventoryCRUDAPI.create(entity, { name, category_id: catId }, tenantId)
                                        .then(() => loadAllData())
                                        .catch(err => {
                                            console.error(err);
                                            alert('Error creating sub category: ' + (err.detail || err.message || 'Unknown error'));
                                        });
                                }
                            }}
                        />

                        <SearchableDropdown
                            label="Product Group"
                            value={formData.product_group_id}
                            options={productGroups}
                            searchKey="productGroup"
                            onChange={(id) => setFormData(prev => ({ ...prev, product_group_id: id }))}
                            placeholder="Select Product Group"
                            entity="product-groups"
                            onAddNew={(entity) => {
                                const name = prompt('Enter Product Group name:');
                                if (name) {
                                    inventoryCRUDAPI.create(entity, { name }, tenantId)
                                        .then(() => loadAllData())
                                        .catch(err => alert('Error creating product group: ' + err.message));
                                }
                            }}
                        />

                        <SearchableDropdown
                            label="Category Group"
                            value={formData.category_group_id}
                            options={categoryGroups}
                            searchKey="categoryGroup"
                            onChange={(id) => setFormData(prev => ({ ...prev, category_group_id: id }))}
                            placeholder="Select Category Group"
                            entity="category-groups"
                            onAddNew={(entity) => {
                                const name = prompt('Enter Category Group name:');
                                if (name) {
                                    inventoryCRUDAPI.create(entity, { name }, tenantId)
                                        .then(() => loadAllData())
                                        .catch(err => alert('Error creating category group: ' + err.message));
                                }
                            }}
                        />

                        <SearchableDropdown
                            label="Generics"
                            value={formData.generics_id}
                            options={generics}
                            searchKey="generic"
                            onChange={(id) => setFormData(prev => ({ ...prev, generics_id: id }))}
                            placeholder="Select Generic"
                            entity="generics"
                            onAddNew={(entity) => {
                                const name = prompt('Enter Generic name:');
                                if (name) {
                                    inventoryCRUDAPI.create(entity, { name }, tenantId)
                                        .then(() => loadAllData())
                                        .catch(err => alert('Error creating generic: ' + err.message));
                                }
                            }}
                        />

                        <SearchableDropdown
                            label="Cal. Season"
                            value={formData.cal_season_id}
                            options={calculateSeasons}
                            searchKey="calSeason"
                            onChange={(id) => setFormData(prev => ({ ...prev, cal_season_id: id }))}
                            placeholder="Select Calculate Season"
                            entity="calculate-seasons"
                            onAddNew={(entity) => {
                                const name = prompt('Enter Calculate Season name:');
                                if (name) {
                                    inventoryCRUDAPI.create(entity, { name }, tenantId)
                                        .then(() => loadAllData())
                                        .catch(err => alert('Error creating calculate season: ' + err.message));
                                }
                            }}
                        />

                        <SearchableDropdown
                            label="Manufacturer"
                            value={formData.manufacturer_id}
                            options={manufacturers}
                            searchKey="manufacturer"
                            onChange={(id) => setFormData(prev => ({ ...prev, manufacturer_id: id }))}
                            placeholder="Select Manufacturer"
                            entity="manufacturers"
                            onAddNew={(entity) => {
                                const name = prompt('Enter Manufacturer name:');
                                if (name) {
                                    inventoryCRUDAPI.create(entity, { name }, tenantId)
                                        .then(() => loadAllData())
                                        .catch(err => alert('Error creating manufacturer: ' + err.message));
                                }
                            }}
                        />

                        <SearchableDropdown
                            label="Rack"
                            value={formData.rack_id}
                            options={racks}
                            searchKey="rack"
                            onChange={(id) => setFormData(prev => ({ ...prev, rack_id: id }))}
                            placeholder="Select Rack"
                            entity="racks"
                            onAddNew={(entity) => {
                                const name = prompt('Enter Rack name:');
                                if (name) {
                                    inventoryCRUDAPI.create(entity, { name }, tenantId)
                                        .then(() => loadAllData())
                                        .catch(err => alert('Error creating rack: ' + err.message));
                                }
                            }}
                        />

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Control Drug
                            </label>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="control_drug"
                                        checked={formData.control_drug === true}
                                        onChange={() => setFormData(prev => ({ ...prev, control_drug: true }))}
                                    />
                                    <span>Yes</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="control_drug"
                                        checked={formData.control_drug === false}
                                        onChange={() => setFormData(prev => ({ ...prev, control_drug: false }))}
                                    />
                                    <span>No</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div>
                        <SearchableDropdown
                            label="Supplier"
                            value={formData.supplier_id}
                            options={suppliers}
                            searchKey="supplier"
                            onChange={(id) => setFormData(prev => ({ ...prev, supplier_id: id }))}
                            placeholder="Select Supplier"
                            entity="suppliers"
                            onAddNew={(entity) => {
                                const name = prompt('Enter Supplier name:');
                                if (name) {
                                    inventoryCRUDAPI.create(entity, { name }, tenantId)
                                        .then(() => loadAllData())
                                        .catch(err => alert('Error creating supplier: ' + err.message));
                                }
                            }}
                        />

                        <SearchableDropdown
                            label="Purchase Conv. Unit"
                            value={formData.purchase_conv_unit_id}
                            options={purchaseConvUnits}
                            searchKey="purchaseConvUnit"
                            onChange={(id) => setFormData(prev => ({ ...prev, purchase_conv_unit_id: id }))}
                            placeholder="Select Purchase Conversion Unit"
                            entity="purchase-conversion-units"
                            onAddNew={(entity) => {
                                const name = prompt('Enter Purchase Conversion Unit name:');
                                if (name) {
                                    inventoryCRUDAPI.create(entity, { name }, tenantId)
                                        .then(() => loadAllData())
                                        .catch(err => alert('Error creating purchase conversion unit: ' + err.message));
                                }
                            }}
                        />

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Purchase Conv. Factor
                            </label>
                            <input
                                type="number"
                                value={formData.purchase_conv_factor || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, purchase_conv_factor: e.target.value ? parseInt(e.target.value) : null }))}
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

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Average Cost (Unit)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.average_cost || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, average_cost: e.target.value ? parseFloat(e.target.value) : null }))}
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

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Date
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Retail Price (Unit)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.retail_price || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, retail_price: e.target.value ? parseFloat(e.target.value) : null }))}
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

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                />
                                Active
                            </label>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Technical Detail
                            </label>
                            <textarea
                                value={formData.technical_details}
                                onChange={(e) => setFormData(prev => ({ ...prev, technical_details: e.target.value }))}
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Internal Comments
                            </label>
                            <textarea
                                value={formData.internal_comments}
                                onChange={(e) => setFormData(prev => ({ ...prev, internal_comments: e.target.value }))}
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Product Type
                            </label>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="product_type"
                                        checked={formData.product_type === 1}
                                        onChange={() => setFormData(prev => ({ ...prev, product_type: 1 }))}
                                    />
                                    <span>Basic</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="product_type"
                                        checked={formData.product_type === 2}
                                        onChange={() => setFormData(prev => ({ ...prev, product_type: 2 }))}
                                    />
                                    <span>Assembly</span>
                                </label>
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Min Inventory Level
                            </label>
                            <input
                                type="number"
                                value={formData.min_inventory_level || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, min_inventory_level: e.target.value ? parseInt(e.target.value) : null }))}
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

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Optimal Inventory Level
                            </label>
                            <input
                                type="number"
                                value={formData.optimal_inventory_level || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, optimal_inventory_level: e.target.value ? parseInt(e.target.value) : null }))}
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

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}>
                                Max Inventory Level
                            </label>
                            <input
                                type="number"
                                value={formData.max_inventory_level || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, max_inventory_level: e.target.value ? parseInt(e.target.value) : null }))}
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

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData.allow_below_cost_sale}
                                    onChange={(e) => setFormData(prev => ({ ...prev, allow_below_cost_sale: e.target.checked }))}
                                />
                                Allow Below Cost Sale
                            </label>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData.allow_price_change}
                                    onChange={(e) => setFormData(prev => ({ ...prev, allow_price_change: e.target.checked }))}
                                />
                                Allow Price Change
                            </label>
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid var(--border)'
                }}>
                    <button
                        onClick={handleSave}
                        disabled={saving || !formData.product_name}
                        style={{
                            padding: '12px 24px',
                            background: saving || !formData.product_name ? 'rgba(99, 102, 241, 0.5)' : 'var(--primary)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            cursor: saving || !formData.product_name ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDefinition;
