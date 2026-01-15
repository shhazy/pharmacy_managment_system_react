import React, { useState, useEffect } from 'react';
import { Save, Printer, Plus, Trash2, Search, ArrowLeft, Download, Upload } from 'lucide-react';
import { procurementAPI, inventoryAPI, medicineAPI, inventoryCRUDAPI } from '../services/api';

const GRN = ({ tenantId }) => {
    const [activeTab, setActiveTab] = useState('GRN'); // GRN or Records
    const [loading, setLoading] = useState(false);

    // --- State Management ---
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // PO Loading State
    const [pendingPOs, setPendingPOs] = useState([]);
    const [selectedPO, setSelectedPO] = useState('');

    const [header, setHeader] = useState({
        invoiceNo: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        batchNo: '',
        dueDate: new Date().toISOString().split('T')[0],
        billNo: '',
        billDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash',
        comments: ''
    });

    const [items, setItems] = useState([]);
    const [conversionUnits, setConversionUnits] = useState([]);

    const [financials, setFinancials] = useState({
        invoiceAmount: 0,
        loadingExp: 0,
        freightExp: 0,
        otherExp: 0,
        adjAmount: 0,
        purchaseTax: 0,
        advanceTax: 0,
        discount: 0,
        netTotal: 0
    });

    // --- Handlers ---
    const handleSearchInput = async (val) => {
        setSearchQuery(val);
        if (val.length > 2) {
            try {
                const results = await medicineAPI.search(val, tenantId);
                setSearchResults(results);
            } catch (error) {
                console.error("Search failed", error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const addProduct = (prod) => {
        // Check if already added
        if (items.find(i => i.productId === prod.id)) {
            alert("Product already in list");
            return;
        }

        const factor = 1;
        const newItem = {
            id: Date.now(),
            productId: prod.id,
            code: prod.product_code || 'N/A',
            name: prod.product_name,
            unit: prod.uom || 'Unit',
            selected_unit_type: 'base',
            purchase_conv_unit_id: prod.purchase_conv_unit_id,
            purchase_conv_factor: prod.purchase_conv_factor || 1,
            factor: 1,
            retailPrice: prod.retail_price || 0,
            unitCost: prod.average_cost || 0,
            totalAmount: 0,
            quantity: 1,
            batchNo: '',
            expiryDate: ''
        };

        // Recalc total
        newItem.totalAmount = newItem.unitCost * newItem.quantity;

        setItems(prev => [...prev, newItem]);
    };

    // --- Initial Load ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [supData, unitData] = await Promise.all([
                    procurementAPI.getSuppliers(tenantId),
                    inventoryCRUDAPI.list('purchase-conversion-units', tenantId)
                ]);
                setSuppliers(supData);
                setConversionUnits(unitData);
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        loadInitialData();
    }, [tenantId]);

    const updateUnit = (id, type) => {
        setItems(prev => prev.map(p => {
            if (p.id === id) {
                const newFactor = type === 'bulk' ? (p.purchase_conv_factor || 1) : 1;
                return {
                    ...p,
                    selected_unit_type: type,
                    factor: newFactor,
                    totalAmount: parseFloat(p.unitCost || 0) * (parseFloat(p.quantity || 0) * newFactor)
                };
            }
            return p;
        }));
    };

    // --- Handlers ---
    const handleSupplierChange = async (supplierId) => {
        setSelectedSupplier(supplierId);
        setPendingPOs([]);
        setSelectedPO('');
        setItems([]); // Clear items if supplier changes? Maybe optional.

        if (!supplierId) return;

        try {
            setLoading(true);
            setLoading(true);
            // Use backend filtering
            const relevantPOs = await procurementAPI.getPurchaseOrders(tenantId, {
                supplier_id: supplierId,
                status: 'Finalized'
            });
            setPendingPOs(relevantPOs);
        } catch (err) {
            console.error("Failed to load POs", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePOLoad = async (poId) => {
        if (!poId) return;
        try {
            setLoading(true);
            const po = await procurementAPI.getPurchaseOrderById(poId, tenantId);
            if (po) {
                // Map PO Items to GRN Items
                const loadedItems = po.items.map((pi, index) => {
                    const factor = pi.factor || 1;
                    const selectedType = pi.purchase_conversion_unit_id ? 'bulk' : 'base';
                    const displayQty = pi.quantity / factor;

                    return {
                        id: Date.now() + index,
                        productId: pi.product_id,
                        code: pi.product?.product_code || 'N/A',
                        name: pi.product?.product_name || `Product ${pi.product_id}`,
                        unit: pi.product?.uom || 'N/A',
                        selected_unit_type: selectedType,
                        purchase_conv_unit_id: pi.product?.purchase_conv_unit_id,
                        purchase_conv_factor: pi.product?.purchase_conv_factor || 1,
                        factor: factor,
                        retailPrice: pi.product?.retail_price || 0,
                        unitCost: pi.unit_cost,
                        totalAmount: pi.total_cost,
                        quantity: displayQty,
                        batchNo: '',
                        expiryDate: ''
                    };
                });

                setItems(loadedItems);
                setHeader(prev => ({ ...prev, comments: `Loaded from PO #${po.po_no}` }));
                setSelectedPO(poId);
            }
        } catch (err) {
            console.error("Failed to load PO details", err);
        } finally {
            setLoading(false);
        }
    };

    // --- Records State ---
    const [records, setRecords] = useState([]);
    const [recordFilters, setRecordFilters] = useState({
        supplier: '',
        startDate: '',
        endDate: ''
    });

    // --- Handlers ---
    const handleCancel = () => {
        if (items.length > 0 && !window.confirm("Are you sure you want to clear the form?")) return;
        setItems([]);
        setHeader({
            invoiceNo: '',
            invoiceDate: new Date().toISOString().split('T')[0],
            batchNo: '',
            dueDate: new Date().toISOString().split('T')[0],
            billNo: '',
            billDate: new Date().toISOString().split('T')[0],
            paymentMode: 'Cash',
            comments: ''
        });
        setSelectedSupplier('');
        setSelectedPO('');
        setPendingPOs([]);
    };

    const handlePrint = () => {
        window.print();
    };

    // --- Effects & Calculations ---
    useEffect(() => {
        if (activeTab === 'Records') {
            const fetchRecords = async () => {
                setLoading(true);
                try {
                    const params = {};
                    if (recordFilters.supplier) params.supplier_id = recordFilters.supplier;
                    if (recordFilters.startDate) params.start_date = new Date(recordFilters.startDate).toISOString();
                    if (recordFilters.endDate) params.end_date = new Date(recordFilters.endDate).toISOString();

                    const data = await procurementAPI.getGRNs(tenantId, params);
                    setRecords(data);
                } catch (err) {
                    console.error("Error fetching GRNs", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchRecords();
        }
    }, [activeTab, recordFilters, tenantId]);

    useEffect(() => {
        calculateFinancials();
    }, [items, header, financials.loadingExp, financials.freightExp, financials.otherExp, financials.purchaseTax, financials.advanceTax, financials.discount]);

    const calculateFinancials = () => {
        const itemTotal = items.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
        const net = itemTotal +
            parseFloat(financials.loadingExp || 0) +
            parseFloat(financials.freightExp || 0) +
            parseFloat(financials.otherExp || 0) +
            parseFloat(financials.purchaseTax || 0) +
            parseFloat(financials.advanceTax || 0) -
            parseFloat(financials.discount || 0);

        setFinancials(prev => ({
            ...prev,
            invoiceAmount: itemTotal,
            netTotal: net
        }));
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitCost' || field === 'factor') {
                    // Total Amount = Cost (per base unit) * Selection Qty * Factor
                    updated.totalAmount = parseFloat(updated.unitCost || 0) * (parseFloat(updated.quantity || 0) * (updated.factor || 1));
                }
                return updated;
            }
            return item;
        }));
    };

    const handleSave = async () => {
        if (!items.length) {
            alert("No items to receive.");
            return;
        }

        try {
            setLoading(true);

            const grnData = {
                supplier_id: parseInt(selectedSupplier),
                po_id: selectedPO ? parseInt(selectedPO) : null,
                invoice_no: header.invoiceNo,
                invoice_date: new Date(header.invoiceDate).toISOString(),
                bill_no: header.billNo,
                bill_date: new Date(header.billDate).toISOString(),
                due_date: new Date(header.dueDate).toISOString(),
                payment_mode: header.paymentMode,
                comments: header.comments,
                loading_exp: parseFloat(financials.loadingExp) || 0,
                freight_exp: parseFloat(financials.freightExp) || 0,
                other_exp: parseFloat(financials.otherExp) || 0,
                purchase_tax: parseFloat(financials.purchaseTax) || 0,
                advance_tax: parseFloat(financials.advanceTax) || 0,
                discount: parseFloat(financials.discount) || 0,
                items: items.map(item => ({
                    product_id: item.productId,
                    batch_no: item.batchNo || 'DEFAULT',
                    expiry_date: item.expiryDate ? new Date(item.expiryDate).toISOString() : new Date().toISOString(),
                    pack_size: 1, // Defaulting to 1 as we use factor now
                    quantity: parseInt(item.quantity * item.factor) || 0,
                    unit_cost: parseFloat(item.unitCost) || 0,
                    total_cost: parseFloat(item.totalAmount) || 0,
                    retail_price: parseFloat(item.retailPrice) || 0,
                    purchase_conversion_unit_id: item.selected_unit_type === 'bulk' ? item.purchase_conv_unit_id : null,
                    factor: item.factor
                }))
            };

            await procurementAPI.createGRN(grnData, tenantId);

            // PO Status update is handled by backend if po_id is sent

            alert("GRN Saved successfully!");

            // Reset
            setItems([]);
            setHeader(prev => ({
                ...prev,
                invoiceNo: '',
                comments: '',
                batchNo: '',
                billNo: ''
            }));
            setSelectedPO('');
            setPendingPOs(prev => prev.filter(p => p.id !== parseInt(selectedPO)));

            // Switch to records
            setActiveTab('Records');

        } catch (err) {
            console.error("Error saving GRN", err);
            alert("Failed to save GRN. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    // --- Render Helpers ---
    const InputParams = { style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', width: '100%', fontSize: '0.9rem' } };
    const LabelStyle = { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' };

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2px' }}>
                <button
                    onClick={() => setActiveTab('GRN')}
                    style={{
                        padding: '8px 24px',
                        background: activeTab === 'GRN' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: activeTab === 'GRN' ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '4px 4px 0 0',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    GRN
                </button>
                <button
                    onClick={() => setActiveTab('Records')}
                    style={{
                        padding: '8px 24px',
                        background: activeTab === 'Records' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: activeTab === 'Records' ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '4px 4px 0 0',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Records
                </button>
            </div>

            {activeTab === 'GRN' ? (
                <>
                    {/* Header controls */}
                    <div className="glass-card" style={{ padding: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>

                            {/* Column 1: Supplier & Batch */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <span style={LabelStyle}>Supplier</span>
                                    <select
                                        style={InputParams.style}
                                        value={selectedSupplier}
                                        onChange={e => handleSupplierChange(e.target.value)}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <span style={LabelStyle}>Internal Batch No</span>
                                    <input type="text" style={InputParams.style} value={header.batchNo} readOnly />
                                </div>
                                <div>
                                    <span style={LabelStyle}>GRN Date</span>
                                    <input type="date" style={InputParams.style} value={header.invoiceDate} onChange={e => setHeader({ ...header, invoiceDate: e.target.value })} />
                                </div>
                            </div>

                            {/* Column 2: Invoice Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <span style={LabelStyle}>Invoice No</span>
                                    <input
                                        type="text"
                                        style={{ ...InputParams.style, background: '#fffbeb', color: '#000' }} // Yellow bg from screenshot
                                        value={header.invoiceNo}
                                        onChange={e => setHeader({ ...header, invoiceNo: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <span style={LabelStyle}>Due Date</span>
                                    <input type="date" style={InputParams.style} value={header.dueDate} onChange={e => setHeader({ ...header, dueDate: e.target.value })} />
                                </div>
                                <div>
                                    <span style={LabelStyle}>Payment Mode</span>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', height: '30px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                            <input type="radio" name="paymode" checked={header.paymentMode === 'Cash'} onChange={() => setHeader({ ...header, paymentMode: 'Cash' })} /> Cash
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                            <input type="radio" name="paymode" checked={header.paymentMode === 'Credit'} onChange={() => setHeader({ ...header, paymentMode: 'Credit' })} /> Credit
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Column 3: Bill Info & Comments */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <span style={LabelStyle}>Bill No</span>
                                    <input type="text" style={InputParams.style} value={header.billNo} onChange={e => setHeader({ ...header, billNo: e.target.value })} />
                                </div>
                                <div>
                                    <span style={LabelStyle}>Bill Date</span>
                                    <input type="date" style={InputParams.style} value={header.billDate} onChange={e => setHeader({ ...header, billDate: e.target.value })} />
                                </div>
                                <div>
                                    <span style={LabelStyle}>Comments</span>
                                    <textarea
                                        style={{ ...InputParams.style, resize: 'none', height: '32px' }}
                                        value={header.comments}
                                        onChange={e => setHeader({ ...header, comments: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Column 4: Financial Summary */}
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Inv Amount:</span>
                                    <input type="number" readOnly style={{ ...InputParams.style, textAlign: 'right', background: 'var(--surface)' }} value={financials.invoiceAmount.toFixed(2)} />

                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Load/Freight:</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <input type="number" placeholder="Load" style={{ ...InputParams.style, width: '50%' }} value={financials.loadingExp} onChange={e => setFinancials({ ...financials, loadingExp: e.target.value })} />
                                        <input type="number" placeholder="Frgt" style={{ ...InputParams.style, width: '50%' }} value={financials.freightExp} onChange={e => setFinancials({ ...financials, freightExp: e.target.value })} />
                                    </div>

                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tax/Disc:</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <input type="number" placeholder="Tax" style={{ ...InputParams.style, width: '50%' }} value={financials.purchaseTax} onChange={e => setFinancials({ ...financials, purchaseTax: e.target.value })} />
                                        <input type="number" placeholder="Disc" style={{ ...InputParams.style, width: '50%' }} value={financials.discount} onChange={e => setFinancials({ ...financials, discount: e.target.value })} />
                                    </div>

                                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Net Pay:</span>
                                    <input type="number" readOnly style={{ ...InputParams.style, textAlign: 'right', fontWeight: 'bold', color: 'white', background: 'var(--primary)' }} value={financials.netTotal.toFixed(2)} />
                                </div>
                            </div>

                        </div>

                        {/* Sub-Header: Product Search & PO Load */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        placeholder="Scan Barcode or Search Product Code..."
                                        style={{ ...InputParams.style, paddingLeft: '32px' }}
                                        value={searchQuery}
                                        onChange={e => handleSearchInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && searchResults.length > 0) {
                                                addProduct(searchResults[0]);
                                                setSearchQuery('');
                                                setSearchResults([]);
                                            }
                                        }}
                                    />
                                    {searchResults.length > 0 && (
                                        <div className="glass-card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
                                            {searchResults.map(prod => (
                                                <div
                                                    key={prod.id}
                                                    style={{ padding: '8px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
                                                    onClick={() => {
                                                        addProduct(prod);
                                                        setSearchQuery('');
                                                        setSearchResults([]);
                                                    }}
                                                    className="hover-bg"
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>{prod.product_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Code: {prod.product_code || 'N/A'} | Barcode: {prod.barcode || 'N/A'}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ color: 'var(--primary)' }}>Stock: {prod.current_stock || 0}</div>
                                                        <button className="btn-xs" style={{ marginTop: '4px' }}>Add</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button className="btn-secondary" style={{ padding: '0 12px' }} onClick={() => { }}><Plus size={16} /></button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={LabelStyle}>Load from Purchase Order:</span>
                                <select
                                    style={{ ...InputParams.style, width: '200px' }}
                                    value={selectedPO}
                                    onChange={e => {
                                        const poId = e.target.value;
                                        setSelectedPO(poId);
                                        handlePOLoad(poId);
                                    }}
                                >
                                    <option value="">Select PO...</option>
                                    {pendingPOs.map(po => (
                                        <option key={po.id} value={po.id}>
                                            {po.po_no} ({new Date(po.issue_date).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                                <button className="btn-secondary" title="Load PO"><Download size={16} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Main Data Grid */}
                    <div className="glass-card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                                    <tr>
                                        <th style={{ padding: '10px', textAlign: 'left', minWidth: '40px' }}>#</th>
                                        <th style={{ padding: '10px', textAlign: 'left', minWidth: '100px' }}>Code</th>
                                        <th style={{ padding: '10px', textAlign: 'left', minWidth: '200px' }}>Product Name</th>
                                        <th style={{ padding: '10px', textAlign: 'left', minWidth: '100px' }}>Unit Selection</th>
                                        <th style={{ padding: '10px', textAlign: 'right', minWidth: '80px' }}>R.Price</th>
                                        <th style={{ padding: '10px', textAlign: 'right', minWidth: '80px' }}>Cost</th>
                                        <th style={{ padding: '10px', textAlign: 'center', minWidth: '60px' }}>Factor</th>
                                        <th style={{ padding: '10px', textAlign: 'right', minWidth: '100px' }}>Total Amt</th>
                                        <th style={{ padding: '10px', textAlign: 'center', minWidth: '80px', background: '#fffbeb', color: '#000', fontWeight: 'bold' }}>Order Qty</th>
                                        <th style={{ padding: '10px', textAlign: 'center', minWidth: '80px' }}>Total Units</th>
                                        <th style={{ padding: '10px', textAlign: 'left', minWidth: '120px' }}>Batch No</th>
                                        <th style={{ padding: '10px', textAlign: 'left', minWidth: '120px' }}>Expiry</th>
                                        <th style={{ padding: '10px', textAlign: 'center', minWidth: '50px' }}>Act</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '8px' }}>{item.code}</td>
                                            <td style={{ padding: '8px' }}>{item.name}</td>
                                            <td style={{ padding: '8px' }}>
                                                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                                    <button
                                                        onClick={() => updateUnit(item.id, 'base')}
                                                        style={{ flex: 1, padding: '4px', border: 'none', background: item.selected_unit_type === 'base' ? 'var(--primary)' : 'transparent', color: 'white', fontSize: '0.75rem', cursor: 'pointer' }}
                                                    >
                                                        {item.unit}
                                                    </button>
                                                    {item.purchase_conv_unit_id && (
                                                        <button
                                                            onClick={() => updateUnit(item.id, 'bulk')}
                                                            style={{ flex: 1, padding: '4px', border: 'none', background: item.selected_unit_type === 'bulk' ? 'var(--primary)' : 'transparent', color: 'white', fontSize: '0.75rem', cursor: 'pointer' }}
                                                        >
                                                            {conversionUnits.find(u => u.id === item.purchase_conv_unit_id)?.name || 'Bulk'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'right' }}>
                                                <input
                                                    type="number"
                                                    style={{ ...InputParams.style, textAlign: 'right', padding: '2px 4px' }}
                                                    value={item.retailPrice}
                                                    onChange={(e) => handleItemChange(item.id, 'retailPrice', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                <input
                                                    type="number"
                                                    style={{ ...InputParams.style, textAlign: 'right', padding: '2px 4px' }}
                                                    value={item.unitCost}
                                                    onChange={(e) => handleItemChange(item.id, 'unitCost', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>{item.factor}</td>
                                            <td style={{ padding: '8px', textAlign: 'right' }}>{item.totalAmount.toFixed(2)}</td>
                                            <td style={{ padding: '8px', background: '#fffbeb' }}>
                                                <input
                                                    type="number"
                                                    style={{ ...InputParams.style, textAlign: 'center', padding: '2px 4px', background: 'transparent', color: '#000', fontWeight: 'bold', border: 'none' }}
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>
                                                {item.quantity * item.factor}
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                <input
                                                    type="text"
                                                    style={{ ...InputParams.style, padding: '2px 4px' }}
                                                    value={item.batchNo}
                                                    onChange={(e) => handleItemChange(item.id, 'batchNo', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                <input
                                                    type="date"
                                                    style={{ ...InputParams.style, padding: '2px 4px' }}
                                                    value={item.expiryDate}
                                                    onChange={(e) => handleItemChange(item.id, 'expiryDate', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <button className="btn-icon-danger" onClick={() => setItems(items.filter(i => i.id !== item.id))}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="12" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                No items. Begin by searching product or loading PO.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Grid Footer - Totals matching screenshot */}
                        <div style={{ borderTop: '1px solid var(--border)', padding: '12px', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <span style={{ fontSize: '0.9rem' }}>Count: <b>{items.length}</b></span>
                            </div>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <span style={{ fontSize: '0.9rem' }}>Total Qty: <b style={{ color: '#fffbeb', background: '#d97706', padding: '2px 8px', borderRadius: '4px' }}>{items.reduce((s, i) => s + parseFloat(i.quantity || 0), 0)}</b></span>
                                <span style={{ fontSize: '0.9rem' }}>Gross Total: <b style={{ color: '#fffbeb', background: '#d97706', padding: '2px 8px', borderRadius: '4px' }}>{items.reduce((s, i) => s + i.totalAmount, 0).toFixed(2)}</b></span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button className="btn-secondary" style={{ background: '#f43f5e', color: 'white', border: 'none' }} onClick={handleCancel}>
                            Cancel / Clear
                        </button>
                        <div style={{ flex: 1 }}></div>
                        <button className="btn-secondary" onClick={handlePrint}>
                            <Printer size={16} /> Print Preview
                        </button>
                        <button
                            className="btn-primary"
                            style={{ minWidth: '120px' }}
                            onClick={handleSave}
                            disabled={loading}
                        >
                            <Save size={16} /> {loading ? 'Saving...' : 'Save GRN'}
                        </button>
                    </div>
                </>
            ) : (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflow: 'hidden' }}>

                    {/* Filters */}
                    <div className="glass-card" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                            <span style={LabelStyle}>Supplier</span>
                            <select
                                style={InputParams.style}
                                value={recordFilters.supplier}
                                onChange={e => setRecordFilters(prev => ({ ...prev, supplier: e.target.value }))}
                            >
                                <option value="">All Suppliers</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <span style={LabelStyle}>Start Date</span>
                            <input
                                type="date"
                                style={InputParams.style}
                                value={recordFilters.startDate}
                                onChange={e => setRecordFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <span style={LabelStyle}>End Date</span>
                            <input
                                type="date"
                                style={InputParams.style}
                                value={recordFilters.endDate}
                                onChange={e => setRecordFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Records Table */}
                    <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface)' }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem' }}>GRN #</th>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem' }}>Date</th>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem' }}>Supplier</th>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem' }}>Inv #</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.75rem' }}>Item Total</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.75rem' }}>Net Total</th>
                                        <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.75rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 'bold' }}>{r.custom_grn_no}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{suppliers.find(s => s.id === r.supplier_id)?.name || 'Unknown'}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{r.invoice_no}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right' }}>{r.sub_total.toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>{r.net_total.toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <button className="btn-icon" onClick={() => { }} title="View">
                                                    <Search size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {records.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                                No GRN records found.
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

export default GRN;
