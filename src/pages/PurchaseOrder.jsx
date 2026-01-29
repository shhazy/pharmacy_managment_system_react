import React, { useState, useEffect, useMemo } from 'react';
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
    ChevronUp,
    Calendar,
    Truck,
    Building2,
    FileText,
    TrendingUp,
    AlertCircle,
    X,
    Package
} from 'lucide-react';
import { procurementAPI, inventoryAPI, inventoryCRUDAPI, appSettingsAPI } from '../services/api';
import PaginationControls from '../components/PaginationControls';
import { showSuccess, showError, showInfo } from '../utils/toast';
import ConfirmDialog from '../components/ConfirmDialog';

const PurchaseOrder = ({ tenantId }) => {
    // --- STATE ---
    const [selectedSuppliers, setSelectedSuppliers] = useState([]); // Array of IDs
    const [referenceNo, setReferenceNo] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [genMethod, setGenMethod] = useState('none'); // min, optimal, max, sale, none
    const [groupBy, setGroupBy] = useState('both'); // none, mfg, sup, both
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [manufacturers, setManufacturers] = useState({});
    const [loading, setLoading] = useState(false);
    const [conversionUnits, setConversionUnits] = useState([]);
    const [activeTab, setActiveTab] = useState('Purchase Order'); // Purchase Order, Records
    const [editingPoId, setEditingPoId] = useState(null);
    const [batchPoIds, setBatchPoIds] = useState({}); // { supplier_id: po_id }

    // Custom Confirmation State
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Confirm',
        type: 'danger'
    });

    const openConfirm = (config) => {
        setConfirmDialog({
            isOpen: true,
            title: config.title || 'Confirm Action',
            message: config.message || 'Are you sure?',
            onConfirm: config.onConfirm,
            confirmText: config.confirmText || 'Confirm',
            type: config.type || 'danger'
        });
    };

    const closeConfirm = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    // --- RECORDS STATE ---
    const [records, setRecords] = useState([]);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [recordFilters, setRecordFilters] = useState({
        supplier: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    // Pagination for Records
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // --- SALE PERIOD POPUP STATE ---
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [saleStartDate, setSaleStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 30 days ago
    const [saleEndDate, setSaleEndDate] = useState(new Date().toISOString().split('T')[0]);

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
                const units = await inventoryCRUDAPI.listAll('purchase-conversion-units', tenantId);
                setConversionUnits(Array.isArray(units) ? units : []);
            } catch (err) {
                console.error("Error fetching conversion units", err);
            }
        };
        fetchInitialData();
    }, [tenantId]);

    const fetchRecords = async () => {
        setRecordsLoading(true);
        try {
            const rawParams = {
                page: currentPage,
                page_size: pageSize,
                search: debouncedSearchTerm,
                sort_by: sortConfig.key,
                order: sortConfig.direction,
                supplier_id: recordFilters.supplier || undefined,
                status: recordFilters.status || undefined,
                start_date: recordFilters.startDate ? new Date(recordFilters.startDate).toISOString() : undefined,
                end_date: recordFilters.endDate ? new Date(recordFilters.endDate).toISOString() : undefined
            };

            // Filter out undefined/null values so they aren't sent as "null" strings
            const params = Object.fromEntries(
                Object.entries(rawParams).filter(([_, v]) => v != null && v !== '')
            );

            const response = await procurementAPI.getPurchaseOrders(tenantId, params);
            setRecords(response.items);
            setTotalItems(response.total);
            setTotalPages(response.total_pages);
        } catch (err) {
            console.error("Error fetching records", err);
            showError("Failed to load records");
        } finally {
            setRecordsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'Records') {
            fetchRecords();
        }
    }, [activeTab, currentPage, pageSize, debouncedSearchTerm, sortConfig, recordFilters]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ChevronDown size={14} style={{ opacity: 0.1, marginLeft: '4px' }} />;
        return sortConfig.direction === 'asc' ?
            <ChevronUp size={14} style={{ color: 'var(--primary)', marginLeft: '4px' }} /> :
            <ChevronDown size={14} style={{ color: 'var(--primary)', marginLeft: '4px' }} />;
    };

    const handleSuppliersToggle = (supId) => {
        supId = parseInt(supId);
        setSelectedSuppliers(prev =>
            prev.includes(supId) ? prev.filter(id => id !== supId) : [...prev, supId]
        );
    };

    const loadProductsForSuppliers = async (supIds) => {
        if (!supIds || supIds.length === 0) {
            setProducts([]);
            return [];
        }

        setLoading(true);
        try {
            const inventory = await inventoryAPI.getInventory(tenantId);
            const allProductRows = [];

            supIds.forEach(supId => {
                const vendorProducts = inventory.filter(p => {
                    const productSupplierIds = (p.product_suppliers || []).map(ps => parseInt(ps.supplier_id));
                    const primarySupplierId = parseInt(p.supplier_id);
                    return primarySupplierId === supId || productSupplierIds.includes(supId);
                });

                vendorProducts.forEach(p => {
                    const shopInv = (p.stock_inventory || p.batches || []).reduce((sum, b) => sum + (b.quantity || b.current_stock || 0), 0) || 0;
                    allProductRows.push({
                        id: p.id,
                        rowKey: `${p.id}-${supId}`, // Unique key for the row
                        supplier_id: supId,
                        code: p.product_code || `P-${p.id}`,
                        name: p.product_name || p.name,
                        manufacturer: manufacturers[p.manufacturer_id] || (p.manufacturer?.name) || 'N/A',
                        manufacturer_id: p.manufacturer_id,
                        unit: p.unit || p.uom || 'Unit',
                        factor: (p.preferred_purchase_unit_id && p.preferred_purchase_unit_id == p.purchase_conv_unit_id) ? (p.purchase_conv_factor || 1) : 1,
                        cost: p.average_cost || 0,
                        disc: p.max_discount || 0,
                        invLevel: p.min_inventory_level || p.reorder_level || 0,
                        shopInv: shopInv,
                        purchase_conv_unit_id: p.purchase_conv_unit_id,
                        purchase_conv_factor: p.purchase_conv_factor || 1,
                        preferred_purchase_unit_id: p.preferred_purchase_unit_id,
                        preferred_pos_unit_id: p.preferred_pos_unit_id,
                        selected_unit_type: (p.preferred_purchase_unit_id && p.preferred_purchase_unit_id == p.purchase_conv_unit_id) ? 'bulk' : 'base',
                        tempPOQty: 0,
                        orderQty: 0,
                        rPrice: p.retail_price || 0
                    });
                });
            });

            setProducts(allProductRows);
            return allProductRows;
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
        if (genMethod === 'none' || selectedSuppliers.length === 0) return;

        setLoading(true);
        try {
            const params = {
                supplier_ids: selectedSuppliers,
                method: genMethod,
                sale_start_date: genMethod === 'sale' ? new Date(saleStartDate).toISOString() : null,
                sale_end_date: genMethod === 'sale' ? new Date(saleEndDate).toISOString() : null
            };
            console.log('Sending params to API:', params);

            const suggestions = await procurementAPI.generateOrder(params, tenantId);
            console.log('API Suggestions Response:', suggestions);
            console.log('Suggestions length:', suggestions?.length);
            console.log('First suggestion detail:', suggestions[0]);
            console.log('Current Products:', products);
            console.log('First product detail:', products[0]);

            setProducts(prev => prev.map(p => {
                // Match by BOTH product_id AND supplier_id
                const sug = suggestions.find(s => s.product_id == p.id && s.supplier_id == p.supplier_id);
                console.log(`Product ${p.id} (Supplier ${p.supplier_id}):`, sug ? `Found suggestion: ${sug.suggested_qty}` : 'No match');
                if (!sug) return p;

                return {
                    ...p,
                    orderQty: sug.suggested_qty,
                    selected_unit_type: (p.preferred_purchase_unit_id && p.preferred_purchase_unit_id == p.purchase_conv_unit_id) ? 'bulk' : 'base',
                    factor: (p.preferred_purchase_unit_id && p.preferred_purchase_unit_id == p.purchase_conv_unit_id) ? (p.purchase_conv_factor || 1) : 1
                };
            }));
        } catch (err) {
            console.error("Error generating order:", err);
            console.error("Error details:", err.response?.data || err.message);
            showError(`Failed to generate order: ${err.response?.data?.detail || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePO = async (status) => {
        if (selectedSuppliers.length === 0 || products.length === 0) return;

        const orderedItems = products.filter(p => p.orderQty > 0);
        if (orderedItems.length === 0) {
            showError("Please enter order quantities for at least one item.");
            return;
        }

        // Group items by supplier for multiple PO submission
        const suppliersWithOrders = [...new Set(orderedItems.map(p => p.supplier_id))];

        setLoading(true);
        try {
            for (const supId of suppliersWithOrders) {
                const supplierItems = orderedItems.filter(p => p.supplier_id === supId);
                const supSubTotal = supplierItems.reduce((sum, p) => sum + (p.orderQty * (p.factor || 1) * p.cost), 0);
                const supTotalDiscount = supplierItems.reduce((sum, p) => sum + ((p.orderQty * (p.factor || 1) * p.cost) * (p.disc / 100)), 0);
                const supNetTotal = supSubTotal - supTotalDiscount;

                const poData = {
                    supplier_id: supId,
                    reference_no: referenceNo,
                    issue_date: new Date(issueDate).toISOString(),
                    delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
                    sub_total: supSubTotal,
                    total_tax: 0,
                    total_discount: supTotalDiscount,
                    total_amount: supNetTotal,
                    notes: `Bulked planned via multi-supplier tool. ${referenceNo}`,
                    status: status,
                    items: supplierItems.map(p => {
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

                let targetPoId = null;
                if (editingPoId) {
                    if (typeof editingPoId === 'string' && editingPoId.startsWith('batch_')) {
                        // Batch mode: use mapped ID for this supplier if it exists
                        targetPoId = batchPoIds[supId];
                    } else if (supplierItems.length === orderedItems.length) {
                        // Single PO mode: use editingPoId
                        targetPoId = editingPoId;
                    }
                }

                if (targetPoId) {
                    await procurementAPI.updatePurchaseOrder(targetPoId, poData, tenantId);
                } else {
                    await procurementAPI.createPurchaseOrder(poData, tenantId);
                }
            }

            showSuccess(`Purchase Orders (${suppliersWithOrders.length}) ${status === 'Pending' ? 'saved as Drafts' : 'finalized'} successfully!`);
            resetForm();
            setActiveTab('Records');
        } catch (err) {
            console.error("Error saving PO", err);
            showError("Failed to save Purchase Order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setProducts([]);
        setSelectedSuppliers([]);
        setReferenceNo('');
        setEditingPoId(null);
        setBatchPoIds({});
        setIssueDate(new Date().toISOString().split('T')[0]);
        setDeliveryDate(new Date().toISOString().split('T')[0]);
        setGenMethod('none');
    };

    const handleEditPo = async (po) => {
        const proceedWithEdit = async () => {
            setLoading(true);
            try {
                // Fetch full PO details to get items
                const fullPo = await procurementAPI.getPurchaseOrderById(po.id, tenantId);

                setEditingPoId(fullPo.id);
                setBatchPoIds({}); // Clear batch IDs when editing single
                setSelectedSuppliers([fullPo.supplier_id]);
                setReferenceNo(fullPo.reference_no || '');
                setIssueDate(fullPo.issue_date.split('T')[0]);
                if (fullPo.delivery_date) setDeliveryDate(fullPo.delivery_date.split('T')[0]);

                // Re-load product list for that supplier and get it back
                const supplierProducts = await loadProductsForSuppliers([fullPo.supplier_id]);

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

        if (products.length > 0 && !editingPoId) {
            openConfirm({
                title: 'Discard Changes?',
                message: 'You have unsaved changes in the current Purchase Order. Loading another one will lose these changes.',
                onConfirm: proceedWithEdit,
                confirmText: 'Discard & Edit',
                type: 'warning'
            });
            return;
        }
        proceedWithEdit();
    };

    const handleDeletePo = async (id) => {
        openConfirm({
            title: 'Delete Purchase Order',
            message: 'Are you sure you want to delete this Purchase Order? This action cannot be undone.',
            onConfirm: async () => {
                setLoading(true);
                try {
                    await procurementAPI.deletePurchaseOrder(id, tenantId);
                    setRecords(prev => prev.filter(r => r.id !== id));
                    showSuccess("Purchase Order deleted successfully.");
                } catch (err) {
                    console.error("Error deleting PO", err);
                    showError("Failed to delete Purchase Order.");
                } finally {
                    setLoading(false);
                }
            },
            confirmText: 'Delete PO',
            type: 'danger'
        });
    };

    const toggleGroup = (key) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const handleEditBatch = async (group) => {
        // Load all POs in the batch
        setLoading(true);
        try {
            const allSuppliers = [...new Set(group.pos.map(po => po.supplier_id))];
            setSelectedSuppliers(allSuppliers);
            setReferenceNo(group.reference_no);
            setIssueDate(new Date(group.issue_date).toISOString().split('T')[0]);

            // Track individual PO IDs by supplier
            const idMap = {};
            group.pos.forEach(po => {
                idMap[po.supplier_id] = po.id;
            });
            setBatchPoIds(idMap);

            // Load products for all suppliers
            await loadProductsForSuppliers(allSuppliers);

            // Merge quantities from all POs - convert from base units to order qty
            // IMPORTANT: Match by BOTH product_id AND supplier_id to avoid summing across suppliers
            const allItems = group.pos.flatMap(po => po.items || []);
            setProducts(prev => prev.map(p => {
                // Match items by product_id AND the supplier_id from the product row
                const matchingItems = allItems.filter(item => {
                    // Find which PO this item belongs to
                    const itemPo = group.pos.find(po => po.items?.some(i => i === item));
                    return item.product_id === p.id && itemPo?.supplier_id === p.supplier_id;
                });

                if (matchingItems.length > 0) {
                    // Get the first item to determine unit type
                    const firstItem = matchingItems[0];
                    const factor = firstItem.purchase_conversion_unit_id ? (p.purchase_conv_factor || 1) : 1;

                    // Sum base units and convert to order qty
                    const totalBaseUnits = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
                    const orderQty = totalBaseUnits / factor;

                    return {
                        ...p,
                        orderQty: orderQty,
                        selected_unit_type: firstItem.purchase_conversion_unit_id ? 'bulk' : 'base',
                        factor: factor
                    };
                }
                return p;
            }));

            setEditingPoId('batch_' + group.reference_no);
            setActiveTab('Purchase Order');
        } catch (err) {
            console.error("Error loading batch for edit", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBatch = async (group) => {
        openConfirm({
            title: 'Delete Batch',
            message: `Are you sure you want to delete all ${group.pos.length} Purchase Orders in this batch? This action cannot be undone.`,
            onConfirm: async () => {
                setLoading(true);
                try {
                    await Promise.all(group.pos.map(po => procurementAPI.deletePurchaseOrder(po.id, tenantId)));
                    setRecords(prev => prev.filter(r => !group.pos.find(po => po.id === r.id)));
                    showSuccess(`Successfully deleted ${group.pos.length} Purchase Orders.`);
                } catch (err) {
                    console.error("Error deleting batch", err);
                    showError("Error deleting some Purchase Orders. Please try again.");
                } finally {
                    setLoading(false);
                }
            },
            confirmText: 'Delete All',
            type: 'danger'
        });
    };

    const updateQty = (rowKey, qty) => {
        setProducts(prev => prev.map(p => p.rowKey === rowKey ? { ...p, orderQty: parseInt(qty) || 0 } : p));
    };

    const updateUnit = (rowKey, type) => {
        setProducts(prev => prev.map(p => {
            if (p.rowKey !== rowKey) return p;
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

    // --- GROUP RECORDS BY REFERENCE NUMBER ---
    const groupedRecords = useMemo(() => {
        const groups = {};
        filteredRecords.forEach(po => {
            const key = po.reference_no || `single_${po.id}`;
            if (!groups[key]) {
                groups[key] = {
                    reference_no: po.reference_no || '',
                    pos: [],
                    total_amount: 0,
                    issue_date: po.issue_date,
                    isSingle: !po.reference_no
                };
            }
            groups[key].pos.push(po);
            groups[key].total_amount += po.total_amount;
        });
        return Object.values(groups);
    }, [filteredRecords]);

    // --- GROUPING LOGIC ---
    const getGroupedData = () => {
        if (groupBy === 'none') return { 'All Products': products };

        const groups = {};

        products.forEach(p => {
            const supplierName = suppliers.find(s => s.id === p.supplier_id)?.name || 'Unknown Supplier';
            const mfgName = p.manufacturer || 'Unknown Manufacturer';

            if (groupBy === 'sup') {
                if (!groups[supplierName]) groups[supplierName] = [];
                groups[supplierName].push(p);
            } else if (groupBy === 'mfg') {
                if (!groups[mfgName]) groups[mfgName] = [];
                groups[mfgName].push(p);
            } else if (groupBy === 'both') {
                // Nested: Supplier -> Manufacturer
                if (!groups[supplierName]) groups[supplierName] = {};
                if (!groups[supplierName][mfgName]) groups[supplierName][mfgName] = [];
                groups[supplierName][mfgName].push(p);
            }
        });

        return groups;
    };

    const groupedData = getGroupedData();

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
                    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0 }}>
                        {/* Row 1: Supplier & Reference */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '20px', flex: 1, alignItems: 'flex-end' }}>
                                <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '350px' }}>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
                                        <span><Truck size={12} style={{ marginRight: '6px' }} /> Selected Suppliers ({selectedSuppliers.length})</span>
                                        <span onClick={() => setSelectedSuppliers([])} style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                            Clear All
                                        </span>
                                    </label>
                                    <div className="input-field" style={{
                                        minHeight: '42px',
                                        height: 'auto',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        background: 'rgba(0,0,0,0.25)',
                                        alignItems: 'center',
                                        borderRadius: '8px'
                                    }}>
                                        {selectedSuppliers.length === 0 && (
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                No suppliers selected...
                                            </span>
                                        )}
                                        {selectedSuppliers.map(id => {
                                            const sup = suppliers.find(s => s.id === id);
                                            return (
                                                <div key={id} style={{
                                                    background: 'var(--primary)',
                                                    padding: '4px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    color: 'white'
                                                }}>
                                                    {sup?.name || id}
                                                    <X size={14} onClick={() => handleSuppliersToggle(id)} style={{ cursor: 'pointer', opacity: 0.8 }} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="input-group" style={{ margin: 0, width: '220px' }}>
                                    <label style={{ fontSize: '0.75rem', marginBottom: '8px' }}>Add Supplier</label>
                                    <select
                                        className="input-field"
                                        style={{ height: '42px', padding: '0 12px', fontSize: '0.9rem' }}
                                        value=""
                                        onChange={e => handleSuppliersToggle(e.target.value)}
                                    >
                                        <option value="">-Select to Add-</option>
                                        {suppliers
                                            .filter(s => !selectedSuppliers.includes(s.id))
                                            .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                <button
                                    className="btn-secondary"
                                    style={{ height: '42px', padding: '0 20px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                                    onClick={() => loadProductsForSuppliers(selectedSuppliers)}
                                    disabled={loading || selectedSuppliers.length === 0}
                                >
                                    <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ marginRight: '8px' }} /> Load Products
                                </button>
                            </div>

                            <div className="input-group" style={{ margin: 0, width: '160px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '8px' }}><FileText size={12} style={{ marginRight: '6px' }} /> Reference No.</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ height: '42px', padding: '0 12px', fontSize: '0.9rem' }}
                                    placeholder="Ref #"
                                    value={referenceNo}
                                    onChange={e => setReferenceNo(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Row 2: Date & Generation Method */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'flex-end', paddingTop: '4px' }}>
                            <div className="input-group" style={{ margin: 0, width: '200px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '8px' }}><Calendar size={12} style={{ marginRight: '6px' }} /> Issue Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    style={{ height: '42px', padding: '0 12px', fontSize: '0.9rem' }}
                                    value={issueDate}
                                    onChange={e => setIssueDate(e.target.value)}
                                />
                            </div>

                            <div className="input-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '8px' }}>Auto-Generation Method</label>
                                <div style={{
                                    display: 'flex',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '0 20px',
                                    borderRadius: '8px',
                                    gap: '24px',
                                    height: '42px',
                                    alignItems: 'center',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {['Min', 'Optimal', 'Max', 'Sale', 'None'].map(m => (
                                        <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <input
                                                type="radio"
                                                name="genMethod"
                                                checked={genMethod === m.toLowerCase()}
                                                onChange={() => handleMethodSelect(m.toLowerCase())}
                                                style={{ cursor: 'pointer' }}
                                            /> {m}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="btn-primary"
                                style={{
                                    height: '42px',
                                    padding: '0 30px',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    marginLeft: '-10px'
                                }}
                                onClick={handleGenerateOrder}
                            >
                                <TrendingUp size={18} /> Generate Order
                            </button>

                            {loading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontSize: '0.85rem', marginLeft: 'auto', background: 'rgba(99, 102, 241, 0.1)', padding: '8px 16px', borderRadius: '8px' }}>
                                    <RefreshCw size={18} className="spin" />
                                    <span style={{ fontWeight: '600' }}>Processing Request...</span>
                                </div>
                            )}
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
                                        <th style={{ width: '120px', fontSize: '0.75rem' }}>Unit</th>
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
                                    {Object.entries(groupedData).map(([primaryKey, primaryValue]) => {
                                        if (groupBy === 'none' || groupBy === 'mfg' || groupBy === 'sup') {
                                            // Flat group (only primaryKey exists)
                                            const items = primaryValue;
                                            return (
                                                <React.Fragment key={primaryKey}>
                                                    <tr style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                        <td colSpan="12" style={{ padding: '10px 16px', fontWeight: '800', color: 'var(--primary)', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                                                            {groupBy === 'mfg' ? <Package size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> : <Truck size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />}
                                                            {primaryKey} ({items.length})
                                                        </td>
                                                    </tr>
                                                    {items.map(p => (
                                                        <tr key={p.rowKey} style={{ transition: 'background 0.2s' }}>
                                                            <td style={{ fontSize: '0.8rem', padding: '10px 16px', paddingLeft: '32px' }}>{p.code}</td>
                                                            <td style={{ fontWeight: '500', fontSize: '0.85rem', padding: '10px 16px' }}>{p.name}</td>
                                                            <td style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
                                                                <select
                                                                    className="input-field"
                                                                    style={{ padding: '2px 4px', fontSize: '0.8rem' }}
                                                                    value={p.selected_unit_type}
                                                                    onChange={(e) => updateUnit(p.rowKey, e.target.value)}
                                                                >
                                                                    <option value="base">{p.unit}</option>
                                                                    {p.purchase_conv_unit_id && (
                                                                        <option value="bulk">
                                                                            {conversionUnits.find(u => u.id == p.purchase_conv_unit_id)?.name || 'Bulk'} (x{p.purchase_conv_factor})
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
                                                                    onChange={e => updateQty(p.rowKey, e.target.value)}
                                                                />
                                                            </td>
                                                            <td style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent)', padding: '10px 16px' }}>
                                                                {p.orderQty * (p.factor || 1)}
                                                            </td>
                                                            <td style={{ fontSize: '0.8rem', padding: '10px 16px' }}>{p.rPrice.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        } else {
                                            // Nested both
                                            return (
                                                <React.Fragment key={primaryKey}>
                                                    <tr style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                        <td colSpan="12" style={{ padding: '10px 16px', fontWeight: '800', color: 'var(--primary)', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                                                            <Truck size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                                            {primaryKey}
                                                        </td>
                                                    </tr>
                                                    {Object.entries(primaryValue).map(([mfg, items]) => (
                                                        <React.Fragment key={mfg}>
                                                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                                <td colSpan="12" style={{ padding: '6px 16px', paddingLeft: '32px', fontWeight: '700', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                    <Package size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                                    {mfg} ({items.length})
                                                                </td>
                                                            </tr>
                                                            {items.map(p => (
                                                                <tr key={p.rowKey} style={{ transition: 'background 0.2s' }}>
                                                                    <td style={{ fontSize: '0.8rem', padding: '10px 16px', paddingLeft: '32px' }}>{p.code}</td>
                                                                    <td style={{ fontWeight: '500', fontSize: '0.85rem', padding: '10px 16px' }}>{p.name}</td>
                                                                    <td style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
                                                                        <select
                                                                            className="input-field"
                                                                            style={{ padding: '2px 4px', fontSize: '0.8rem' }}
                                                                            value={p.selected_unit_type}
                                                                            onChange={(e) => updateUnit(p.rowKey, e.target.value)}
                                                                        >
                                                                            <option value="base">{p.unit}</option>
                                                                            {p.purchase_conv_unit_id && (
                                                                                <option value="bulk">
                                                                                    {conversionUnits.find(u => u.id == p.purchase_conv_unit_id)?.name || 'Bulk'} (x{p.purchase_conv_factor})
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
                                                                            onChange={e => updateQty(p.rowKey, e.target.value)}
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
                                                </React.Fragment>
                                            );
                                        }
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {!loading && products.length === 0 && (
                            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <AlertCircle size={40} style={{ opacity: 0.2, marginBottom: '10px' }} /><br />
                                Select a supplier and load products to begin
                            </div>
                        )}
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
                                disabled={loading || selectedSuppliers.length === 0}
                            >
                                <Save size={16} /> Save Drafts
                            </button>
                            <button
                                className="btn-secondary"
                                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.85rem' }}
                                onClick={() => handleSavePO('Finalized')}
                                disabled={loading || selectedSuppliers.length === 0}
                            >
                                <Save size={16} /> Finalize POs
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflow: 'hidden' }}>
                    {/* Records Filters & Search */}
                    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', flexShrink: 0 }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <div className="input-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '8px' }}>Search Records</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        className="input-field"
                                        style={{ paddingLeft: '38px', height: '42px' }}
                                        placeholder="Search PO # or Reference..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', flex: 2 }}>
                            <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '8px' }}>Supplier</label>
                                <select
                                    className="input-field"
                                    style={{ height: '42px' }}
                                    value={recordFilters.supplier}
                                    onChange={e => {
                                        setRecordFilters({ ...recordFilters, supplier: e.target.value });
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="">All Suppliers</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '8px' }}>Status</label>
                                <select
                                    className="input-field"
                                    style={{ height: '42px' }}
                                    value={recordFilters.status}
                                    onChange={e => {
                                        setRecordFilters({ ...recordFilters, status: e.target.value });
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="">All Status</option>
                                    <option value="Pending">Draft (Pending)</option>
                                    <option value="Finalized">Finalized</option>
                                    <option value="Received">Received</option>
                                </select>
                            </div>
                            <div className="input-group" style={{ margin: 0, width: '150px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '8px' }}>Start Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    style={{ height: '42px' }}
                                    value={recordFilters.startDate}
                                    onChange={e => {
                                        setRecordFilters({ ...recordFilters, startDate: e.target.value });
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <div className="input-group" style={{ margin: 0, width: '150px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '8px' }}>End Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    style={{ height: '42px' }}
                                    value={recordFilters.endDate}
                                    onChange={e => {
                                        setRecordFilters({ ...recordFilters, endDate: e.target.value });
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-primary" style={{ height: '42px', padding: '0 20px' }} onClick={fetchRecords} disabled={recordsLoading}>
                                <RefreshCw size={16} className={recordsLoading ? "spin" : ""} />
                            </button>
                            <button className="btn-secondary" onClick={() => { resetForm(); setActiveTab('Purchase Order'); }} style={{ background: 'var(--primary)', color: 'white', height: '42px', padding: '0 20px' }}>
                                <Plus size={16} /> New PO
                            </button>
                        </div>
                    </div>

                    {/* Records Table */}
                    <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', position: 'relative' }}>
                        {/* Refreshing Overlay */}
                        {recordsLoading && records.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '50px',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(15, 23, 42, 0.4)',
                                backdropFilter: 'blur(1px)',
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div style={{ background: 'var(--surface)', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <div className="spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                                    Updating...
                                </div>
                            </div>
                        )}

                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--surface)' }}>
                                    <tr>
                                        <th onClick={() => requestSort('issue_date')} style={{ textAlign: 'left', padding: '16px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                            ISSUE DATE <SortIcon column="issue_date" />
                                        </th>
                                        <th onClick={() => requestSort('po_no')} style={{ textAlign: 'left', padding: '16px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                            PO NUMBER <SortIcon column="po_no" />
                                        </th>
                                        <th style={{ textAlign: 'left', padding: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SUPPLIER</th>
                                        <th onClick={() => requestSort('total_amount')} style={{ textAlign: 'right', padding: '16px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                            TOTAL AMOUNT <SortIcon column="total_amount" />
                                        </th>
                                        <th onClick={() => requestSort('status')} style={{ textAlign: 'center', padding: '16px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                            STATUS <SortIcon column="status" />
                                        </th>
                                        <th style={{ textAlign: 'center', padding: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recordsLoading && records.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '60px' }}>
                                                <div className="spin" style={{ width: '30px', height: '30px', border: '3px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 10px' }} />
                                                Loading records...
                                            </td>
                                        </tr>
                                    ) : (
                                        groupedRecords.map(group => {
                                            const groupKey = group.reference_no || `single_${group.pos[0].id}`;
                                            const isExpanded = expandedGroups.has(groupKey);
                                            const isSingle = group.isSingle;

                                            return (
                                                <React.Fragment key={groupKey}>
                                                    {/* Main Group Row */}
                                                    <tr style={{ borderBottom: '1px solid var(--border)', background: isSingle ? 'transparent' : 'rgba(99, 102, 241, 0.03)', transition: 'background 0.2s' }}>
                                                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                                                            {!isSingle && (
                                                                <button onClick={() => toggleGroup(groupKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px', color: 'var(--primary)' }}>
                                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                                </button>
                                                            )}
                                                            {new Date(group.issue_date).toLocaleDateString()}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                            {isSingle ? group.pos[0].po_no : (group.reference_no || 'No Ref')}
                                                            {!isSingle && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>({group.pos.length} POs)</span>}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                                                            {isSingle
                                                                ? (suppliers.find(s => s.id === group.pos[0].supplier_id)?.name || 'Unknown')
                                                                : `${group.pos.length} Suppliers`
                                                            }
                                                        </td>
                                                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right', fontWeight: '600' }}>
                                                            PKR {group.total_amount.toLocaleString()}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                            {isSingle ? (
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: '700',
                                                                    background: group.pos[0].status === 'Finalized' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                                                    color: group.pos[0].status === 'Finalized' ? '#22c55e' : '#eab308',
                                                                    border: group.pos[0].status === 'Finalized' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(234, 179, 8, 0.2)'
                                                                }}>
                                                                    {group.pos[0].status.toUpperCase()}
                                                                </span>
                                                            ) : (
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mixed</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                {isSingle ? (
                                                                    <>
                                                                        <button className="btn-icon" onClick={() => handleEditPo(group.pos[0])} title="Edit">
                                                                            <FileText size={16} />
                                                                        </button>
                                                                        <button className="btn-icon" onClick={() => window.print()} title="Print">
                                                                            <Printer size={16} />
                                                                        </button>
                                                                        <button className="btn-icon" onClick={() => handleDeletePo(group.pos[0].id)} style={{ color: '#ef4444' }} title="Delete">
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button className="btn-icon" onClick={() => handleEditBatch(group)} title="Edit All">
                                                                            <FileText size={16} />
                                                                        </button>
                                                                        <button className="btn-icon" onClick={() => handleDeleteBatch(group)} style={{ color: '#ef4444' }} title="Delete All">
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Individual POs */}
                                                    {!isSingle && isExpanded && group.pos.map(po => (
                                                        <tr key={po.id} style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                                                            <td style={{ padding: '12px 16px 12px 48px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                                {new Date(po.issue_date).toLocaleDateString()}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>{po.po_no}</td>
                                                            <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                                                                {suppliers.find(s => s.id === po.supplier_id)?.name || 'Unknown'}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', fontSize: '0.8rem', textAlign: 'right' }}>
                                                                PKR {po.total_amount.toLocaleString()}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: '700',
                                                                    background: po.status === 'Finalized' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                                                    color: po.status === 'Finalized' ? '#22c55e' : '#eab308',
                                                                    border: po.status === 'Finalized' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(234, 179, 8, 0.2)'
                                                                }}>
                                                                    {po.status.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                    <button className="btn-icon" onClick={() => handleEditPo(po)} title="Edit">
                                                                        <FileText size={16} />
                                                                    </button>
                                                                    <button className="btn-icon" onClick={() => handleDeletePo(po.id)} style={{ color: '#ef4444' }} title="Delete">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                    {!recordsLoading && groupedRecords.length === 0 && (
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

                        {/* Pagination for Records */}
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
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
            />
        </div >
    );
};

export default PurchaseOrder;
