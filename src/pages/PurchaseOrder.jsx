import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Filter,
    Download,
    Printer,
    Save,
    RefreshCw,
    Trash2,
    ChevronDown,
    ChevronRight,
    Calendar,
    Truck,
    Building2,
    FileText,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { procurementAPI, inventoryAPI, inventoryCRUDAPI } from '../services/api';

const PurchaseOrder = ({ tenantId }) => {
    // --- STATE ---
    const [supplier, setSupplier] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [genMethod, setGenMethod] = useState('none'); // min, optimal, max, sale, none
    const [groupOnManufacturer, setGroupOnManufacturer] = useState(true);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [manufacturers, setManufacturers] = useState({});
    const [loading, setLoading] = useState(false);
    const [conversionUnits, setConversionUnits] = useState([]);
    const [activeTab, setActiveTab] = useState('Purchase Order'); // Purchase Order, Records
    const [editingPoId, setEditingPoId] = useState(null);

    // --- RECORDS STATE ---
    const [records, setRecords] = useState([]);
    const [recordFilters, setRecordFilters] = useState({
        supplier: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    // --- SALE PERIOD POPUP STATE ---
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [saleStartDate, setSaleStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 30 days ago
    const [saleEndDate, setSaleEndDate] = useState(new Date().toISOString().split('T')[0]);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchInitialData = async () => {
            // Fetch Suppliers
            try {
                const supList = await procurementAPI.getSuppliers(tenantId);
                setSuppliers(Array.isArray(supList) ? supList : []);
            } catch (err) {
                console.error("Error fetching suppliers", err);
            }

            // Fetch Manufacturers
            try {
                const mfgList = await inventoryAPI.getManufacturers(tenantId);
                // Map manufacturers for easy lookup
                const mfgMap = {};
                if (Array.isArray(mfgList)) {
                    mfgList.forEach(m => { mfgMap[m.id] = m.name; });
                }
                setManufacturers(mfgMap);
            } catch (err) {
                console.error("Error fetching manufacturers", err);
            }

            // Fetch Conversion Units
            try {
                const units = await inventoryCRUDAPI.list('purchase-conversion-units', tenantId);
                setConversionUnits(Array.isArray(units) ? units : []);
            } catch (err) {
                console.error("Error fetching conversion units", err);
            }
        };
        fetchInitialData();
    }, [tenantId]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await procurementAPI.getPurchaseOrders(tenantId);
            setRecords(data);
        } catch (err) {
            console.error("Error fetching records", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'Records') {
            fetchRecords();
        }
    }, [activeTab]);

    const handleSupplierChange = async (supId) => {
        setSupplier(supId);
        if (!supId) {
            setProducts([]);
            return [];
        }

        setLoading(true);
        try {
            const inventory = await inventoryAPI.getInventory(tenantId);
            const supplierProducts = inventory
                .filter(p => !supId || p.supplier_id === parseInt(supId))
                .map(p => {
                    const shopInv = (p.stock_inventory || p.batches || []).reduce((sum, b) => sum + (b.quantity || b.current_stock || 0), 0) || 0;
                    return {
                        id: p.id,
                        code: p.product_code || `P-${p.id}`,
                        name: p.product_name || p.name,
                        manufacturer: manufacturers[p.manufacturer_id] || (p.manufacturer?.name) || 'N/A',
                        unit: p.unit || p.uom || 'Unit',
                        factor: p.purchase_conv_factor || 1,
                        cost: p.average_cost || 0,
                        disc: p.max_discount || 0,
                        invLevel: p.min_inventory_level || p.reorder_level || 0,
                        shopInv: shopInv,
                        purchase_conv_unit_id: p.purchase_conv_unit_id,
                        purchase_conv_factor: p.purchase_conv_factor || 1,
                        selected_unit_type: p.purchase_conv_unit_id ? 'bulk' : 'base',
                        factor: p.purchase_conv_unit_id ? (p.purchase_conv_factor || 1) : 1,
                        tempPOQty: 0,
                        orderQty: 0,
                        rPrice: p.retail_price || 0
                    };
                });
            setProducts(supplierProducts);
            return supplierProducts;
        } catch (err) {
            console.error("Error loading products", err);
            return [];
        } finally {
            setLoading(false);
        }
    };


    const handleMethodSelect = (method) => {
        setGenMethod(method);
        if (method === 'sale') {
            setShowSaleModal(true);
        }
    };

    const handleGenerateOrder = async () => {
        if (genMethod === 'none' || !supplier) return;

        setLoading(true);
        try {
            const params = {
                supplier_id: parseInt(supplier),
                method: genMethod,
                sale_start_date: genMethod === 'sale' ? new Date(saleStartDate).toISOString() : null,
                sale_end_date: genMethod === 'sale' ? new Date(saleEndDate).toISOString() : null
            };
            const suggestions = await procurementAPI.generateOrder(params, tenantId);

            setProducts(prev => prev.map(p => {
                const sug = suggestions.find(s => s.product_id === p.id);
                const suggestedQty = sug ? sug.suggested_qty : 0;
                return {
                    ...p,
                    orderQty: suggestedQty,
                    selected_unit_type: p.purchase_conv_unit_id ? 'bulk' : 'base',
                    factor: p.purchase_conv_unit_id ? (p.purchase_conv_factor || 1) : 1
                };
            }));
        } catch (err) {
            console.error("Error generating order", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePO = async (status) => {
        if (!supplier || products.length === 0) return;

        const orderedItems = products.filter(p => p.orderQty > 0);
        if (orderedItems.length === 0) {
            alert("Please enter order quantities for at least one item.");
            return;
        }

        setLoading(true);
        try {
            const poData = {
                supplier_id: parseInt(supplier),
                reference_no: referenceNo,
                issue_date: new Date(issueDate).toISOString(),
                delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
                sub_total: parseFloat(subTotal),
                total_tax: 0,
                total_discount: parseFloat(totalDiscount),
                total_amount: parseFloat(netTotal),
                notes: "",
                status: status, // "Pending" or "Finalized"
                items: orderedItems.map(p => {
                    const totalQty = parseInt(p.orderQty) * (p.factor || 1);
                    return {
                        product_id: p.id,
                        quantity: totalQty,
                        unit_cost: parseFloat(p.cost),
                        discount_percent: parseFloat(p.disc),
                        total_cost: parseFloat(p.cost * totalQty * (1 - p.disc / 100)),
                        purchase_conversion_unit_id: p.selected_unit_type === 'bulk' ? p.purchase_conv_unit_id : null,
                        factor: p.factor || 1
                    };
                })
            };

            if (editingPoId) {
                await procurementAPI.updatePurchaseOrder(editingPoId, poData, tenantId);
                alert(`Purchase Order ${status === 'Pending' ? 'updated as Draft' : 'finalized'} successfully!`);
            } else {
                await procurementAPI.createPurchaseOrder(poData, tenantId);
                alert(`Purchase Order ${status === 'Pending' ? 'saved as Draft' : 'finalized'} successfully!`);
            }

            // Reset and Switch
            resetForm();
            setActiveTab('Records');
        } catch (err) {
            console.error("Error saving PO", err);
            alert("Failed to save Purchase Order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setProducts([]);
        setSupplier('');
        setReferenceNo('');
        setEditingPoId(null);
        setIssueDate(new Date().toISOString().split('T')[0]);
        setDeliveryDate(new Date().toISOString().split('T')[0]);
        setGenMethod('none');
    };

    const handleEditPo = async (po) => {
        if (products.length > 0 && !editingPoId) {
            if (!window.confirm("You have an unsaved Purchase Order. Are you sure you want to load another one? Your current progress will be lost.")) return;
        }
        setLoading(true);
        try {
            // Fetch full PO details to get items
            const fullPo = await procurementAPI.getPurchaseOrderById(po.id, tenantId);

            setEditingPoId(fullPo.id);
            setSupplier(fullPo.supplier_id.toString());
            setReferenceNo(fullPo.reference_no || '');
            setIssueDate(fullPo.issue_date.split('T')[0]);
            if (fullPo.delivery_date) setDeliveryDate(fullPo.delivery_date.split('T')[0]);

            // Re-load product list for that supplier and get it back
            const supplierProducts = await handleSupplierChange(fullPo.supplier_id.toString());

            // Map the quantities from the saved items using the fresh list
            setProducts(supplierProducts.map(p => {
                const poItem = fullPo.items.find(item => item.product_id === p.id);
                if (!poItem) return p;

                const factor = poItem.factor || 1;
                return {
                    ...p,
                    orderQty: poItem.quantity / factor,
                    factor: factor,
                    selected_unit_type: poItem.purchase_conversion_unit_id ? 'bulk' : 'base'
                };
            }));

            setActiveTab('Purchase Order');
        } catch (err) {
            console.error("Error loading PO for edit", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePo = async (id) => {
        if (!window.confirm("Are you sure you want to delete this Purchase Order?")) return;

        setLoading(true);
        try {
            await procurementAPI.deletePurchaseOrder(id, tenantId);
            setRecords(prev => prev.filter(r => r.id !== id));
            alert("Purchase Order deleted successfully.");
        } catch (err) {
            console.error("Error deleting PO", err);
        } finally {
            setLoading(false);
        }
    };

    const updateQty = (code, qty) => {
        setProducts(prev => prev.map(p => p.code === code ? { ...p, orderQty: parseInt(qty) || 0 } : p));
    };

    const updateUnit = (code, type) => {
        setProducts(prev => prev.map(p => {
            if (p.code !== code) return p;
            return {
                ...p,
                selected_unit_type: type,
                factor: type === 'base' ? 1 : (p.purchase_conv_factor || 1)
            };
        }));
    };

    const totalQty = products.reduce((sum, p) => sum + p.orderQty, 0);
    const totalUnits = products.reduce((sum, p) => sum + (p.orderQty * (p.factor || 1)), 0);
    const subTotal = products.reduce((sum, p) => sum + (p.orderQty * (p.factor || 1) * p.cost), 0);
    const totalDiscount = products.reduce((sum, p) => sum + ((p.orderQty * (p.factor || 1) * p.cost) * (p.disc / 100)), 0);
    const netTotal = subTotal - totalDiscount;

    // --- RECORD FILTERING ---
    const filteredRecords = records.filter(r => {
        const matchesSupplier = !recordFilters.supplier || r.supplier_id.toString() === recordFilters.supplier;
        const matchesStatus = !recordFilters.status || r.status === recordFilters.status;
        const matchesDate = (!recordFilters.startDate || r.issue_date >= recordFilters.startDate) &&
            (!recordFilters.endDate || r.issue_date <= recordFilters.endDate);
        return matchesSupplier && matchesStatus && matchesDate;
    });

    // Group products by manufacturer
    const groupedProducts = groupOnManufacturer
        ? products.reduce((acc, p) => {
            if (!acc[p.manufacturer]) acc[p.manufacturer] = [];
            acc[p.manufacturer].push(p);
            return acc;
        }, {})
        : { 'All Products': products };

    return (
        <div className="fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
            {/* Sale Period Modal */}
            {showSaleModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass-card" style={{ width: '400px', padding: '30px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={20} color="var(--primary)" /> Select Sale Period
                        </h3>
                        <div className="input-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={saleStartDate}
                                onChange={e => setSaleStartDate(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={saleEndDate}
                                onChange={e => setSaleEndDate(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={() => setShowSaleModal(false)}>
                                Confirm Period
                            </button>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowSaleModal(false); setGenMethod('none'); }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Navigation Tabs */}
            <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                {['Purchase Order', 'Records'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 24px',
                            background: activeTab === tab ? 'var(--surface)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Purchase Order' ? (
                <>
                    {/* Header Controls */}
                    <div className="glass-card" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', flexShrink: 0 }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}><Truck size={12} style={{ marginRight: '4px' }} /> Supplier</label>
                            <select
                                className="input-field"
                                style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                value={supplier}
                                onChange={e => handleSupplierChange(e.target.value)}
                            >
                                <option value="">-Select Supplier-</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}><FileText size={12} style={{ marginRight: '4px' }} /> Reference No.</label>
                            <input
                                type="text"
                                className="input-field"
                                style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                placeholder="Ref #"
                                value={referenceNo}
                                onChange={e => setReferenceNo(e.target.value)}
                            />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}><Calendar size={12} style={{ marginRight: '4px' }} /> Issue Date</label>
                            <input
                                type="date"
                                className="input-field"
                                style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                value={issueDate}
                                onChange={e => setIssueDate(e.target.value)}
                            />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}><Calendar size={12} style={{ marginRight: '4px' }} /> Delivery Date</label>
                            <input
                                type="date"
                                className="input-field"
                                style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                value={deliveryDate}
                                onChange={e => setDeliveryDate(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            {loading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.85rem' }}>
                                <RefreshCw size={16} className="spin" /> Loading Products...
                            </div>}
                        </div>
                    </div>

                    {/* Generation Area */}
                    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'center', flexShrink: 0 }}>
                        <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Auto-Generation Method</p>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                {['Min', 'Optimal', 'Max', 'Sale', 'None'].map(m => (
                                    <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input
                                            type="radio"
                                            name="genMethod"
                                            checked={genMethod === m.toLowerCase()}
                                            onChange={() => handleMethodSelect(m.toLowerCase())}
                                        /> {m}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.9rem' }} onClick={handleGenerateOrder}>
                                <TrendingUp size={16} /> Generate Order
                            </button>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                <input
                                    type="checkbox"
                                    checked={groupOnManufacturer}
                                    onChange={e => setGroupOnManufacturer(e.target.checked)}
                                /> Group On Manufacturer
                            </label>
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            <table style={{ borderCollapse: 'collapse', minWidth: '1000px' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface)' }}>
                                    <tr>
                                        <th style={{ width: '80px', fontSize: '0.75rem' }}>Code</th>
                                        <th style={{ fontSize: '0.75rem' }}>Product Name</th>
                                        <th style={{ width: '60px', fontSize: '0.75rem' }}>Unit</th>
                                        <th style={{ width: '60px', fontSize: '0.75rem' }}>Factor</th>
                                        <th style={{ width: '90px', fontSize: '0.75rem' }}>Cost</th>
                                        <th style={{ width: '70px', fontSize: '0.75rem' }}>Disc %</th>
                                        <th style={{ width: '80px', fontSize: '0.75rem' }}>Inv Level</th>
                                        <th style={{ width: '80px', fontSize: '0.75rem' }}>Shop Inv</th>
                                        <th style={{ width: '100px', fontSize: '0.75rem', color: 'var(--accent)' }}>Temp PO Qty</th>
                                        <th style={{ width: '100px', background: 'rgba(99, 102, 241, 0.1)', fontSize: '0.75rem' }}>Order Qty</th>
                                        <th style={{ width: '100px', fontSize: '0.75rem', color: 'var(--accent)' }}>Total Units</th>
                                        <th style={{ width: '90px', fontSize: '0.75rem' }}>R Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(groupedProducts).map(([mfg, items]) => (
                                        <React.Fragment key={mfg}>
                                            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <td colSpan="11" style={{ padding: '8px 16px', fontWeight: '700', color: 'var(--primary)', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                                    <Building2 size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                    {mfg}
                                                </td>
                                            </tr>
                                            {items.map(p => (
                                                <tr key={p.code} style={{ transition: 'background 0.2s' }}>
                                                    <td style={{ fontSize: '0.8rem', padding: '10px 16px' }}>{p.code}</td>
                                                    <td style={{ fontWeight: '500', fontSize: '0.85rem', padding: '10px 16px' }}>{p.name}</td>
                                                    <td style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
                                                        <select
                                                            className="input-field"
                                                            style={{ padding: '2px 4px', fontSize: '0.8rem' }}
                                                            value={p.selected_unit_type}
                                                            onChange={(e) => updateUnit(p.code, e.target.value)}
                                                        >
                                                            <option value="base">Unit</option>
                                                            {p.purchase_conv_unit_id && (
                                                                <option value="bulk">
                                                                    {conversionUnits.find(u => u.id === p.purchase_conv_unit_id)?.name || 'Bulk'}
                                                                </option>
                                                            )}
                                                        </select>
                                                    </td>
                                                    <td style={{ fontSize: '0.8rem', padding: '10px 16px' }}>{p.factor}</td>
                                                    <td style={{ fontSize: '0.8rem', padding: '10px 16px' }}>{p.cost.toFixed(2)}</td>
                                                    <td style={{ fontSize: '0.8rem', padding: '10px 16px' }}>{p.disc.toFixed(2)}</td>
                                                    <td style={{ fontSize: '0.8rem', padding: '10px 16px' }}>{p.invLevel}</td>
                                                    <td style={{ fontSize: '0.8rem', padding: '10px 16px' }}>{p.shopInv}</td>
                                                    <td style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent)', padding: '10px 16px' }}>{p.tempPOQty || 0}</td>
                                                    <td style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '6px 16px' }}>
                                                        <input
                                                            type="number"
                                                            className="input-field"
                                                            style={{ padding: '4px 8px', textAlign: 'center', fontSize: '0.85rem' }}
                                                            value={p.orderQty}
                                                            onChange={e => updateQty(p.code, e.target.value)}
                                                        />
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent)', padding: '10px 16px' }}>
                                                        {p.orderQty * (p.factor || 1)}
                                                    </td>
                                                    <td style={{ fontSize: '0.8rem', padding: '10px 16px' }}>{p.rPrice.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    {products.length === 0 && (
                                        <tr>
                                            <td colSpan="11" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                                <AlertCircle size={40} style={{ opacity: 0.2, marginBottom: '10px' }} /><br />
                                                Select a supplier and load products to begin
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Summary */}
                    <div className="glass-card" style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary)', color: 'white', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: '30px' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Items:</span>
                                <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '1rem' }}>{products.length}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Packs:</span>
                                <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '1rem' }}>{totalQty}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Total Units:</span>
                                <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '1rem' }}>{totalUnits}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Estimate (Net):</span>
                                <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '1.1rem' }}>PKR {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-secondary" style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => window.print()}>
                                <Printer size={16} /> Print Draft
                            </button>
                            <button
                                className="btn-secondary"
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 16px', fontSize: '0.85rem' }}
                                onClick={() => handleSavePO('Pending')}
                                disabled={loading || !supplier}
                            >
                                <Save size={16} /> Save as Temp PO
                            </button>
                            <button
                                className="btn-secondary"
                                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.85rem' }}
                                onClick={() => handleSavePO('Finalized')}
                                disabled={loading || !supplier}
                            >
                                <Save size={16} /> Finalize PO
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflow: 'hidden' }}>
                    {/* Records Filters */}
                    <div className="glass-card" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', flexShrink: 0 }}>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Supplier</label>
                            <select
                                className="input-field"
                                value={recordFilters.supplier}
                                onChange={e => setRecordFilters({ ...recordFilters, supplier: e.target.value })}
                            >
                                <option value="">All Suppliers</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Status</label>
                            <select
                                className="input-field"
                                value={recordFilters.status}
                                onChange={e => setRecordFilters({ ...recordFilters, status: e.target.value })}
                            >
                                <option value="">All Status</option>
                                <option value="Pending">Draft (Pending)</option>
                                <option value="Finalized">Finalized</option>
                                <option value="Received">Received</option>
                            </select>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Start Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={recordFilters.startDate}
                                onChange={e => setRecordFilters({ ...recordFilters, startDate: e.target.value })}
                            />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>End Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={recordFilters.endDate}
                                onChange={e => setRecordFilters({ ...recordFilters, endDate: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                            <button className="btn-primary" onClick={fetchRecords} disabled={loading}>
                                <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
                            </button>
                            <button className="btn-secondary" onClick={() => { resetForm(); setActiveTab('Purchase Order'); }} style={{ background: 'var(--primary)', color: 'white' }}>
                                <Plus size={16} /> New PO
                            </button>
                        </div>
                    </div>

                    {/* Records Table */}
                    <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface)' }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem' }}>Date</th>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem' }}>PO No.</th>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem' }}>Supplier</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.75rem' }}>Amount</th>
                                        <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.75rem' }}>Status</th>
                                        <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.75rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{new Date(r.issue_date).toLocaleDateString()}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 'bold' }}>{r.po_no}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{suppliers.find(s => s.id === r.supplier_id)?.name || 'Unknown'}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right', fontWeight: '600' }}>PKR {r.total_amount.toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '700',
                                                    background: r.status === 'Finalized' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                                    color: r.status === 'Finalized' ? '#22c55e' : '#eab308',
                                                    border: r.status === 'Finalized' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(234, 179, 8, 0.2)'
                                                }}>
                                                    {r.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button className="btn-icon" onClick={() => handleEditPo(r)} title="Edit">
                                                        <FileText size={16} />
                                                    </button>
                                                    <button className="btn-icon" onClick={() => window.print()} title="Print">
                                                        <Printer size={16} />
                                                    </button>
                                                    <button className="btn-icon" onClick={() => handleDeletePo(r.id)} style={{ color: '#ef4444' }} title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRecords.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                                <AlertCircle size={40} style={{ opacity: 0.2, marginBottom: '10px' }} /><br />
                                                No records found matching filters
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrder;
