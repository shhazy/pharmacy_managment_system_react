import React, { useState, useEffect, useRef } from 'react';
import {
    Save, X, Plus, Search, ChevronDown, Check, Info, Settings,
    Layers, Package, DollarSign, List, Truck, Box, Edit3, Clipboard
} from 'lucide-react';
import { inventoryCRUDAPI, API_BASE_URL } from '../services/api';

const ProductDefinition = ({ tenantId, initialData, onSaveSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('identity');

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
        if (!formData.product_name || !formData.category_id || !formData.manufacturer_id) {
            alert('Please fill in all mandatory fields (Name, Category, Manufacturer)');
            return;
        }

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
                if (onSaveSuccess) onSaveSuccess();
                if (!isEditing) {
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
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    const handleAddNew = async (entity, label) => {
        const name = prompt(`Enter new ${label} name:`);
        if (!name) return;

        try {
            let payload = { name };
            if (entity === 'sub-categories') {
                if (!formData.category_id) {
                    alert('Please select a category first');
                    return;
                }
                payload.category_id = formData.category_id;
            }

            await inventoryCRUDAPI.create(entity, payload, tenantId);
            await loadAllData();
        } catch (err) {
            alert(`Error creating ${label}: ` + (err.detail || err.message));
        }
    };

    const SearchableDropdown = ({
        label, value, options, searchKey, onChange, placeholder, entity, mandatory
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);
        const searchTerm = searchStates[searchKey] || '';
        const filteredOptions = options.filter(opt =>
            (opt.name || opt.category_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        const selectedOption = options.find(opt => opt.id === value);

        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                    setSearchStates(prev => ({ ...prev, [searchKey]: '' }));
                }
            };
            if (isOpen) document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [isOpen, searchKey]);

        return (
            <div ref={dropdownRef} className="input-group" style={{ marginBottom: '20px', position: 'relative' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {label} {mandatory && <span style={{ color: 'var(--accent)' }}>*</span>}
                </label>
                <div style={{ position: 'relative' }}>
                    <div
                        onClick={() => setIsOpen(!isOpen)}
                        className="input-field"
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderColor: isOpen ? 'var(--primary)' : 'var(--border)',
                            background: selectedOption ? 'rgba(99, 102, 241, 0.05)' : 'var(--surface)'
                        }}
                    >
                        <span style={{ color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {selectedOption ? (selectedOption.name || selectedOption.category_name) : placeholder}
                        </span>
                        <ChevronDown size={18} style={{
                            transition: 'transform 0.3s ease',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }} />
                    </div>

                    {isOpen && (
                        <div className="fade-in" style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            right: 0,
                            background: 'var(--surface)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                            zIndex: 1000,
                            padding: '8px',
                            backdropFilter: 'blur(20px)'
                        }}>
                            <div style={{ position: 'relative', marginBottom: '8px' }}>
                                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Type to search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchStates(prev => ({ ...prev, [searchKey]: e.target.value }))}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        width: '100%',
                                        padding: '8px 8px 8px 32px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '0.85rem'
                                    }}
                                />
                            </div>

                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {filteredOptions.length === 0 ? (
                                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        Not found
                                    </div>
                                ) : (
                                    filteredOptions.map(opt => (
                                        <div
                                            key={opt.id}
                                            onClick={() => {
                                                onChange(opt.id);
                                                setIsOpen(false);
                                                setSearchStates(prev => ({ ...prev, [searchKey]: '' }));
                                            }}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                background: value === opt.id ? 'var(--primary)' : 'transparent',
                                                color: value === opt.id ? 'white' : 'var(--text-primary)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '2px'
                                            }}
                                            onMouseEnter={(e) => { if (value !== opt.id) e.target.style.background = 'rgba(255,255,255,0.05)' }}
                                            onMouseLeave={(e) => { if (value !== opt.id) e.target.style.background = 'transparent' }}
                                        >
                                            {opt.name || opt.category_name}
                                            {value === opt.id && <Check size={14} />}
                                        </div>
                                    ))
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddNew(entity, label);
                                    setIsOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    marginTop: '8px',
                                    padding: '10px',
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--primary)',
                                    border: '1px dashed var(--primary)',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Plus size={16} /> Add New {label}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const SectionTab = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveSection(id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: activeSection === id ? 'var(--primary)' : 'transparent',
                color: activeSection === id ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                flex: 1,
                justifyContent: 'center'
            }}
        >
            <Icon size={18} />
            <span className="hide-mobile">{label}</span>
        </button>
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: '16px' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>Preparing Workspace...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 40px' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        {formData.id ? 'Edit Product' : 'Define Product'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Complete the details below to register a new product in your inventory.</p>
                </div>
                <div className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                    {formData.id ? 'Mode: Updating' : 'Mode: New Entry'}
                </div>
            </div>

            {/* Navigation Stepper */}
            <div className="glass-card" style={{ padding: '8px', marginBottom: '24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                <SectionTab id="identity" label="Core Identity" icon={Package} />
                <SectionTab id="org" label="Classification" icon={Layers} />
                <SectionTab id="pricing" label="Logistics & Pricing" icon={DollarSign} />
                <SectionTab id="advanced" label="Inventory & Advanced" icon={Settings} />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Content Section */}
                <div className="glass-card fade-in" key={activeSection}>
                    {activeSection === 'identity' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            <div className="input-group">
                                <label>Product Name <span style={{ color: 'var(--accent)' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <Package size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        placeholder="Enter medicine / product name"
                                        className="input-field"
                                        style={{ paddingLeft: '44px' }}
                                        value={formData.product_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <SearchableDropdown
                                label="Manufacturer"
                                mandatory
                                value={formData.manufacturer_id}
                                options={manufacturers}
                                searchKey="manufacturer"
                                onChange={(id) => setFormData(prev => ({ ...prev, manufacturer_id: id }))}
                                placeholder="Select Manufacturer"
                                entity="manufacturers"
                            />

                            <SearchableDropdown
                                label="Generic Name"
                                value={formData.generics_id}
                                options={generics}
                                searchKey="generic"
                                onChange={(id) => setFormData(prev => ({ ...prev, generics_id: id }))}
                                placeholder="Search Generics..."
                                entity="generics"
                            />

                            <SearchableDropdown
                                label="Line Item Type"
                                value={formData.line_item_id}
                                options={lineItems}
                                searchKey="lineItem"
                                onChange={(id) => setFormData(prev => ({ ...prev, line_item_id: id }))}
                                placeholder="Select Type"
                                entity="line-items"
                            />

                            <div className="input-group">
                                <label>Registration Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                />
                            </div>

                            <div className="input-group">
                                <label>Control Status</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <button
                                        className={formData.control_drug ? 'btn-primary' : 'btn-secondary'}
                                        onClick={() => setFormData(prev => ({ ...prev, control_drug: true }))}
                                        style={{ height: '44px', fontSize: '0.9rem' }}
                                    >
                                        Control Drug
                                    </button>
                                    <button
                                        className={!formData.control_drug ? 'btn-primary' : 'btn-secondary'}
                                        onClick={() => setFormData(prev => ({ ...prev, control_drug: false }))}
                                        style={{ height: '44px', fontSize: '0.9rem' }}
                                    >
                                        Standard
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'org' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            <SearchableDropdown
                                label="Primary Category"
                                mandatory
                                value={formData.category_id}
                                options={categories}
                                searchKey="category"
                                onChange={(id) => setFormData(prev => ({ ...prev, category_id: id }))}
                                placeholder="Select Category"
                                entity="categories"
                            />

                            <SearchableDropdown
                                label="Sub Category"
                                value={formData.sub_category_id}
                                options={subCategories}
                                searchKey="subCategory"
                                onChange={(id) => setFormData(prev => ({ ...prev, sub_category_id: id }))}
                                placeholder="Select Sub Category"
                                entity="sub-categories"
                            />

                            <SearchableDropdown
                                label="Product Group"
                                value={formData.product_group_id}
                                options={productGroups}
                                searchKey="productGroup"
                                onChange={(id) => setFormData(prev => ({ ...prev, product_group_id: id }))}
                                placeholder="Select Group"
                                entity="product-groups"
                            />

                            <SearchableDropdown
                                label="Category Group"
                                value={formData.category_group_id}
                                options={categoryGroups}
                                searchKey="categoryGroup"
                                onChange={(id) => setFormData(prev => ({ ...prev, category_group_id: id }))}
                                placeholder="Select Group"
                                entity="category-groups"
                            />

                            <SearchableDropdown
                                label="Default Rack"
                                value={formData.rack_id}
                                options={racks}
                                searchKey="rack"
                                onChange={(id) => setFormData(prev => ({ ...prev, rack_id: id }))}
                                placeholder="Select Rack Location"
                                entity="racks"
                            />

                            <SearchableDropdown
                                label="Calculation Season"
                                value={formData.cal_season_id}
                                options={calculateSeasons}
                                searchKey="calSeason"
                                onChange={(id) => setFormData(prev => ({ ...prev, cal_season_id: id }))}
                                placeholder="Select Season"
                                entity="calculate-seasons"
                            />
                        </div>
                    )}

                    {activeSection === 'pricing' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            <div className="input-group">
                                <label>Average Cost (per Unit)</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem' }}>PKR</div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="input-field"
                                        style={{ paddingLeft: '32px' }}
                                        value={formData.average_cost || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, average_cost: e.target.value ? parseFloat(e.target.value) : null }))}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Retail Price (per Unit)</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.8rem' }}>PKR</div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="input-field"
                                        style={{ paddingLeft: '32px' }}
                                        value={formData.retail_price || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, retail_price: e.target.value ? parseFloat(e.target.value) : null }))}
                                    />
                                </div>
                            </div>

                            <SearchableDropdown
                                label="Preferred Supplier"
                                value={formData.supplier_id}
                                options={suppliers}
                                searchKey="supplier"
                                onChange={(id) => setFormData(prev => ({ ...prev, supplier_id: id }))}
                                placeholder="Select Supplier"
                                entity="suppliers"
                            />

                            <div className="input-group" style={{ gridColumn: 'span 1' }}>
                                <label>Conversion Logic</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <SearchableDropdown
                                            label="Bulk Unit"
                                            value={formData.purchase_conv_unit_id}
                                            options={purchaseConvUnits}
                                            searchKey="purchaseConvUnit"
                                            onChange={(id) => setFormData(prev => ({ ...prev, purchase_conv_unit_id: id }))}
                                            placeholder="Unit (e.g. Box)"
                                            entity="purchase-conversion-units"
                                        />
                                    </div>
                                    <div style={{ width: '100px' }}>
                                        <label>Factor</label>
                                        <input
                                            type="number"
                                            placeholder="QTY"
                                            className="input-field"
                                            value={formData.purchase_conv_factor || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, purchase_conv_factor: e.target.value ? parseInt(e.target.value) : null }))}
                                        />
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Example: 1 Box = 10 Tablets (Factor: 10)
                                </p>
                            </div>
                        </div>
                    )}

                    {activeSection === 'advanced' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            <div className="input-group">
                                <label>Inventory Thresholds</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>MIN</span>
                                        <input
                                            type="number" className="input-field" placeholder="10"
                                            value={formData.min_inventory_level || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, min_inventory_level: parseInt(e.target.value) || null }))}
                                        />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>OPT</span>
                                        <input
                                            type="number" className="input-field" placeholder="50"
                                            value={formData.optimal_inventory_level || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, optimal_inventory_level: parseInt(e.target.value) || null }))}
                                        />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', display: 'block', marginBottom: '4px' }}>MAX</span>
                                        <input
                                            type="number" className="input-field" placeholder="100"
                                            value={formData.max_inventory_level || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, max_inventory_level: parseInt(e.target.value) || null }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Product Classification</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <button
                                        className={formData.product_type === 1 ? 'btn-primary' : 'btn-secondary'}
                                        onClick={() => setFormData(prev => ({ ...prev, product_type: 1 }))}
                                        style={{ height: '44px', fontSize: '0.9rem' }}
                                    >
                                        Basic Product
                                    </button>
                                    <button
                                        className={formData.product_type === 2 ? 'btn-primary' : 'btn-secondary'}
                                        onClick={() => setFormData(prev => ({ ...prev, product_type: 2 }))}
                                        style={{ height: '44px', fontSize: '0.9rem' }}
                                    >
                                        Assembly / Kit
                                    </button>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Operational Flags</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={formData.active} onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))} />
                                        Active Product
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={formData.allow_price_change} onChange={(e) => setFormData(prev => ({ ...prev, allow_price_change: e.target.checked }))} />
                                        Movable Price
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: formData.allow_below_cost_sale ? 'var(--accent)' : 'inherit' }}>
                                        <input type="checkbox" checked={formData.allow_below_cost_sale} onChange={(e) => setFormData(prev => ({ ...prev, allow_below_cost_sale: e.target.checked }))} />
                                        Below Cost Sale
                                    </label>
                                </div>
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 1' }}>
                                <label>Technical Specifications</label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    placeholder="Chemical composition, storage rules..."
                                    value={formData.technical_details}
                                    onChange={(e) => setFormData(prev => ({ ...prev, technical_details: e.target.value }))}
                                />
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 1' }}>
                                <label>Internal Remarks</label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    placeholder="Notes for staff..."
                                    value={formData.internal_comments}
                                    onChange={(e) => setFormData(prev => ({ ...prev, internal_comments: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' }}>
                    <button
                        className="btn-secondary"
                        style={{ padding: '14px 28px' }}
                        onClick={() => window.history.back()}
                    >
                        Discard Changes
                    </button>
                    <button
                        className="btn-primary"
                        style={{ padding: '14px 40px', fontSize: '1.05rem' }}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <><div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div> Saving...</>
                        ) : (
                            <><Save size={20} /> {formData.id ? 'Authorize Updates' : 'Commit Product'}</>
                        )}
                    </button>
                </div>
            </div>

            {/* Legend / Info */}
            <div style={{ marginTop: '40px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <Info size={14} />
                    <span>Red asterisks indicate required fields.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <Search size={14} />
                    <span>Searchable dropdowns support adding new items on the fly.</span>
                </div>
            </div>
        </div>
    );
};

export default ProductDefinition;
