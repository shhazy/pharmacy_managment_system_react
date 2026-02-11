import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { procurementAPI, inventoryAPI, inventoryCRUDAPI, appSettingsAPI, medicineAPI } from '../services/api';
import PaginationControls from '../components/PaginationControls';
import { showSuccess, showError, showInfo } from '../utils/toast';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductLookupModal from '../components/ProductLookupModal';
import ProductSearchBar from '../components/ProductSearchBar';

const PurchaseOrder = ({ tenantId }) => {
    // --- STATE ---
    const [selectedSupplierId, setSelectedSupplierId] = useState(null);
    const [referenceNo, setReferenceNo] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

    const [genMethod, setGenMethod] = useState('none'); // min, optimal, max, sale, none
    const [groupBy, setGroupBy] = useState('mfg'); // none, mfg, sup, both
    const [showHelp, setShowHelp] = useState(false);
    const [allInventory, setAllInventory] = useState([]);
    const [notes, setNotes] = useState('');
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [manufacturers, setManufacturers] = useState({});
    const [loading, setLoading] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [conversionUnits, setConversionUnits] = useState([]);
    const [activeTab, setActiveTab] = useState('Purchase Order'); // Purchase Order, Records
    const [editingPoId, setEditingPoId] = useState(null);
    const [appSettings, setAppSettings] = useState({});
    // { supplier_id: po_id }

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

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                setShowHelp(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

            // Fetch All Inventory for F3 Modal
            try {
                const inv = await inventoryAPI.getInventory(tenantId);
                setAllInventory(Array.isArray(inv) ? inv : []);
            } catch (err) { console.error("Error fetching inventory for F3", err); }

            // Fetch App Settings
            try {
                const res = await fetch(`${API_BASE_URL}/tenants/${tenantId}/settings`);
                if (res.ok) setAppSettings(await res.json());
            } catch (e) { console.error("Failed to load settings"); }
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

    const handleSupplierChange = (supId) => {
        const id = supId ? parseInt(supId) : null;
        setSelectedSupplierId(id);
        if (id) {
            loadProductsForSupplier(id);
        } else {
            setProducts([]);
        }
    };

    const loadProductsForSupplier = async (supId) => {
        if (!supId) {
            setProducts([]);
            return [];
        }

        setLoading(true);
        try {
            const inventory = await inventoryAPI.getInventory(tenantId);
            const allProductRows = [];

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
                    base_unit_id: p.base_unit_id,
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

            setProducts(allProductRows);
            return allProductRows;
        } catch (err) {
            console.error("Error loading products", err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Search handler for live database search
    const handleLiveSearch = async (val) => {
        setItemSearch(val);
        if (val.trim().length > 2) {
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

    const handleProductSelect = (p, batch, q) => {
        // Find if already in products
        const existingIdx = products.findIndex(item => item.id === p.id);
        if (existingIdx !== -1) {
            setProducts(prev => {
                const next = [...prev];
                next[existingIdx] = { ...next[existingIdx], orderQty: (next[existingIdx].orderQty || 0) + q };
                return next;
            });
            showInfo(`Updated existing item: ${p.product_name}`);
        } else {
            const shopInv = (p.stock_inventory || p.batches || []).reduce((sum, b) => sum + (b.quantity || b.current_stock || 0), 0) || 0;
            const newItem = {
                id: p.id,
                rowKey: `${p.id}-manual`,
                supplier_id: selectedSupplierId,
                code: p.product_code || `P-${p.id}`,
                name: p.product_name,
                manufacturer: manufacturers[p.manufacturer_id] || (p.manufacturer?.name) || 'N/A',
                manufacturer_id: p.manufacturer_id,
                unit: p.unit || p.uom || 'Unit',
                factor: (p.preferred_purchase_unit_id && p.preferred_purchase_unit_id == p.purchase_conv_unit_id) ? (p.purchase_conv_factor || 1) : 1,
                cost: p.average_cost || 0,
                disc: p.max_discount || 0,
                invLevel: p.min_inventory_level || p.reorder_level || 0,
                shopInv: shopInv,
                orderQty: q,
                base_unit_id: p.base_unit_id,
                purchase_conv_unit_id: p.purchase_conv_unit_id,
                purchase_conv_factor: p.purchase_conv_factor || 1,
                preferred_purchase_unit_id: p.preferred_purchase_unit_id,
                selected_unit_type: (p.preferred_purchase_unit_id && p.preferred_purchase_unit_id == p.purchase_conv_unit_id) ? 'bulk' : 'base',
                rPrice: p.retail_price || 0
            };
            setProducts(prev => [newItem, ...prev]);
            showSuccess(`Added ${p.product_name} to order.`);
        }
        setShowHelp(false);
    };


    const handleMethodSelect = (method) => {
        setGenMethod(method);
        if (method === 'sale') {
            setShowSaleModal(true);
        }
    };

    const handleGenerateOrder = async () => {
        if (genMethod === 'none' || !selectedSupplierId) return;

        setLoading(true);
        try {
            const params = {
                supplier_id: selectedSupplierId,
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
        if (!selectedSupplierId || products.length === 0) return;

        const orderedItems = products.filter(p => p.orderQty > 0);
        if (orderedItems.length === 0) {
            showError("Please enter order quantities for at least one item.");
            return;
        }

        setLoading(true);
        try {
            const subTotalVal = orderedItems.reduce((sum, p) => sum + (p.orderQty * (p.factor || 1) * p.cost), 0);
            const totalDiscountVal = orderedItems.reduce((sum, p) => sum + ((p.orderQty * (p.factor || 1) * p.cost) * (p.disc / 100)), 0);
            const netTotalVal = subTotalVal - totalDiscountVal;

            const poData = {
                supplier_id: selectedSupplierId,
                reference_no: referenceNo,
                issue_date: new Date(issueDate).toISOString(),

                sub_total: subTotalVal,
                total_tax: 0,
                total_discount: totalDiscountVal,
                total_amount: netTotalVal,
                notes: notes || '',
                status: status,
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
                showSuccess(`Purchase Order updated successfully!`);
            } else {
                await procurementAPI.createPurchaseOrder(poData, tenantId);
                showSuccess(`Purchase Order ${status === 'Pending' ? 'saved as Draft' : 'finalized'} successfully!`);
            }

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
        setSelectedSupplierId(null);
        setReferenceNo('');
        setEditingPoId(null);

        setIssueDate(new Date().toISOString().split('T')[0]);

        setGenMethod('none');
        setNotes('');
    };

    const handleEditPo = async (po) => {
        const proceedWithEdit = async () => {
            setLoading(true);
            try {
                // Fetch full PO details to get items
                const fullPo = await procurementAPI.getPurchaseOrderById(po.id, tenantId);
                console.log('Full PO Details:', fullPo);
                console.log('PO Items:', fullPo.items);

                setEditingPoId(fullPo.id);
                setSelectedSupplierId(fullPo.supplier_id);
                setReferenceNo(fullPo.reference_no || '');
                setNotes(fullPo.notes || '');
                setIssueDate(fullPo.issue_date.split('T')[0]);

                // Load FULL inventory (not filtered by supplier) to include manually added products
                const fullInventory = await inventoryAPI.getInventory(tenantId);
                console.log('Full Inventory:', fullInventory);

                // Create a map of ALL products by ID for quick lookup
                const productMap = {};
                fullInventory.forEach(p => {
                    const shopInv = (p.stock_inventory || p.batches || []).reduce((sum, b) => sum + (b.quantity || b.current_stock || 0), 0) || 0;
                    productMap[p.id] = {
                        id: p.id,
                        rowKey: `${p.id}-${p.supplier_id}`,
                        supplier_id: p.supplier_id,
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
                        base_unit_id: p.base_unit_id,
                        purchase_conv_unit_id: p.purchase_conv_unit_id,
                        purchase_conv_factor: p.purchase_conv_factor || 1,
                        preferred_purchase_unit_id: p.preferred_purchase_unit_id,
                        preferred_pos_unit_id: p.preferred_pos_unit_id,
                        selected_unit_type: (p.preferred_purchase_unit_id && p.preferred_purchase_unit_id == p.purchase_conv_unit_id) ? 'bulk' : 'base',
                        orderQty: 0,
                        rPrice: p.retail_price || 0
                    };
                });

                // Build the final product list
                const finalProducts = [];

                // Process each item from the saved PO
                for (const poItem of fullPo.items) {
                    const productId = poItem.product_id;
                    const factor = poItem.factor || 1;
                    console.log(`Processing product ID: ${productId}, in product map: ${!!productMap[productId]}`);

                    if (productMap[productId]) {
                        // Product is in product map - use it with updated quantity
                        const p = productMap[productId];
                        finalProducts.push({
                            ...p,
                            orderQty: poItem.quantity / factor,
                            factor: factor,
                            selected_unit_type: poItem.purchase_conversion_unit_id ? 'bulk' : 'base'
                        });
                        // Remove from map so we don't add it again
                        delete productMap[productId];
                    } else {
                        // Product was manually added from another supplier - fetch its details
                        console.log(`Fetching details for manually added product: ${productId}`);
                        try {
                            const productDetails = await inventoryCRUDAPI.get('products', productId, tenantId);
                            console.log('Fetched product details:', productDetails);
                            const shopInv = (productDetails.stock_inventory || productDetails.batches || []).reduce((sum, b) => sum + (b.quantity || b.current_stock || 0), 0) || 0;

                            finalProducts.push({
                                id: productDetails.id,
                                rowKey: `${productDetails.id}-manual`,
                                supplier_id: productDetails.supplier_id,
                                code: productDetails.product_code || `P-${productDetails.id}`,
                                name: productDetails.product_name,
                                manufacturer: manufacturers[productDetails.manufacturer_id] || (productDetails.manufacturer?.name) || 'N/A',
                                manufacturer_id: productDetails.manufacturer_id,
                                unit: productDetails.unit || productDetails.uom || 'Unit',
                                factor: factor,
                                cost: productDetails.average_cost || 0,
                                disc: productDetails.max_discount || 0,
                                invLevel: productDetails.min_inventory_level || productDetails.reorder_level || 0,
                                shopInv: shopInv,
                                purchase_conv_unit_id: productDetails.purchase_conv_unit_id,
                                purchase_conv_factor: productDetails.purchase_conv_factor || 1,
                                preferred_purchase_unit_id: productDetails.preferred_purchase_unit_id,
                                preferred_pos_unit_id: productDetails.preferred_pos_unit_id,
                                selected_unit_type: poItem.purchase_conversion_unit_id ? 'bulk' : 'base',
                                orderQty: poItem.quantity / factor,
                                rPrice: productDetails.retail_price || 0
                            });
                        } catch (err) {
                            console.error(`Failed to fetch product ${productId}:`, err);
                        }
                    }
                }


                console.log('Final Products List:', finalProducts);
                setProducts(finalProducts);
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


    // --- GROUPING LOGIC ---
    const filteredProducts = useMemo(() => {
        return products;
    }, [products]);

    const getGroupedData = () => {
        const sourceData = filteredProducts;
        if (groupBy === 'none') return { 'All Products': sourceData };

        const groups = {};

        sourceData.forEach(p => {
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
            {showSaleModal && createPortal(
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
                    zIndex: 10000,
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
                </div>,
                document.body
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
                    {/* Header Controls */}
                    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0, position: 'relative', zIndex: 100 }}>
                        {/* Row 1: Core PO Info */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1.5, minWidth: '250px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                                    <Truck size={12} style={{ marginRight: '6px' }} /> Supplier
                                </label>
                                <select
                                    className="input-field"
                                    style={{ height: '38px', padding: '0 12px', fontSize: '0.85rem' }}
                                    value={selectedSupplierId || ''}
                                    onChange={e => handleSupplierChange(e.target.value)}
                                    disabled={loading || editingPoId}
                                >
                                    <option value="">-Select Supplier-</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                                    <FileText size={12} style={{ marginRight: '6px' }} /> Reference No.
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ height: '38px', padding: '0 12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)' }}
                                    placeholder="Ref #"
                                    value={referenceNo}
                                    onChange={e => setReferenceNo(e.target.value)}
                                />
                            </div>

                            <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                                    <Calendar size={12} style={{ marginRight: '6px' }} /> Issue Date
                                </label>
                                <input
                                    type="date"
                                    className="input-field"
                                    style={{ height: '38px', padding: '0 12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)' }}
                                    value={issueDate}
                                    onChange={e => setIssueDate(e.target.value)}
                                />
                            </div>

                            <div className="input-group" style={{ margin: 0, flex: 2, minWidth: '250px' }}>
                                <label style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                                    <FileText size={12} style={{ marginRight: '6px' }} /> Notes
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{ height: '38px', padding: '0 12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)' }}
                                    placeholder="Order notes..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Row 2: Generation Controls */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Auto-Generation Method</label>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    {['Min', 'Optimal', 'Max', 'Sale', 'None'].map(m => (
                                        <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: genMethod === m.toLowerCase() ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                            <input
                                                type="radio"
                                                name="genMethod"
                                                checked={genMethod === m.toLowerCase()}
                                                onChange={() => handleMethodSelect(m.toLowerCase())}
                                                style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                                            /> {m}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />

                            <button
                                className="btn-primary"
                                style={{
                                    height: '38px',
                                    padding: '0 24px',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderRadius: '20px',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                    border: 'none'
                                }}
                                onClick={handleGenerateOrder}
                                disabled={loading || !selectedSupplierId}
                            >
                                <TrendingUp size={16} /> Generate Order
                            </button>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', marginLeft: '10px', color: 'var(--text-secondary)' }}>
                                <input
                                    type="checkbox"
                                    checked={groupBy === 'mfg'}
                                    onChange={e => setGroupBy(e.target.checked ? 'mfg' : 'none')}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                />
                                Group On Manufacturer
                            </label>

                            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }} />

                            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                                <ProductSearchBar
                                    value={itemSearch}
                                    onChange={e => handleLiveSearch(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && searchResults.length > 0) {
                                            handleProductSelect(searchResults[0], null, 1);
                                            setItemSearch('');
                                            setSearchResults([]);
                                        }
                                    }}
                                    containerStyle={{ width: '100%', height: '38px', borderRadius: '19px' }}
                                />
                                {searchResults.length > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        marginTop: '8px',
                                        left: 0,
                                        right: 0,
                                        zIndex: 9999,
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                                        maxHeight: '400px',
                                        overflowY: 'auto'
                                    }}>
                                        {searchResults.map(prod => (
                                            <div
                                                key={prod.id}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderBottom: '1px solid var(--border)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'background 0.2s'
                                                }}
                                                onClick={() => {
                                                    handleProductSelect(prod, null, 1);
                                                    setItemSearch('');
                                                    setSearchResults([]);
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem', marginBottom: '2px' }}>{prod.product_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '8px' }}>
                                                        <span>Code: <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{prod.product_code || '-'}</span></span>
                                                        <span>•</span>
                                                        <span>Stock: <span style={{ color: prod.current_stock > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{prod.current_stock || 0}</span></span>
                                                    </div>
                                                </div>
                                                <div style={{ paddingLeft: '16px' }}>
                                                    <button
                                                        style={{
                                                            background: 'var(--primary)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            width: '28px',
                                                            height: '28px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {loading && (
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.8rem' }}>
                                    <RefreshCw size={14} className="spin" />
                                    <span>Processing...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', position: 'relative' }}>
                        <div style={{ overflow: 'auto', flex: 1, position: 'relative' }}>
                            <table style={{ borderCollapse: 'collapse', minWidth: '1000px', width: '100%' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface)' }}>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ width: '80px', fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap' }}>Code</th>
                                        <th style={{ fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap', textAlign: 'left' }}>Product Name</th>
                                        <th style={{ width: '110px', fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap' }}>Unit</th>
                                        <th style={{ width: '60px', fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap' }}>Factor</th>
                                        <th style={{ width: '80px', fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap' }}>Cost</th>
                                        <th style={{ width: '70px', fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap' }}>Disc %</th>
                                        <th style={{ width: '80px', fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap' }}>Inv Level</th>
                                        <th style={{ width: '80px', fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap' }}>Shop Inv</th>
                                        <th style={{ width: '110px', fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap', color: 'var(--accent)' }}>Temp PO Qty</th>
                                        <th style={{ width: '110px', background: 'rgba(99, 102, 241, 0.1)', fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap' }}>Order Qty</th>
                                        <th style={{ width: '110px', fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap', color: 'var(--accent)' }}>Total Units</th>
                                        <th style={{ width: '80px', fontSize: '0.7rem', padding: '12px 8px', whiteSpace: 'nowrap' }}>R Price</th>
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
                                                                    <option value="base">
                                                                        {conversionUnits.find(u => u.id == p.base_unit_id)?.name || p.unit || 'Single'}
                                                                    </option>
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
                                                                            <option value="base">
                                                                                {conversionUnits.find(u => u.id == p.base_unit_id)?.name || p.unit || 'Single'}
                                                                            </option>
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

                            {!loading && products.length === 0 && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-secondary)',
                                    pointerEvents: 'none',
                                    paddingTop: '60px' // Leave space for header
                                }}>
                                    <AlertCircle size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                                    <span>Select a supplier and load products to begin</span>
                                </div>
                            )}
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
                                disabled={loading || !selectedSupplierId}
                            >
                                <Save size={16} /> Save Draft
                            </button>
                            <button
                                className="btn-secondary"
                                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.85rem' }}
                                onClick={() => handleSavePO('Finalized')}
                                disabled={loading || !selectedSupplierId}
                            >
                                <Save size={16} /> Finalize PO
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
                                        filteredRecords.map(po => (
                                            <tr key={po.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                                                    {new Date(po.issue_date).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                    {po.po_no}
                                                    {po.reference_no && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>({po.reference_no})</span>}
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                                                    {suppliers.find(s => s.id === po.supplier_id)?.name || 'Unknown'}
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right', fontWeight: '600' }}>
                                                    PKR {po.total_amount.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '700',
                                                        background: po.status === 'Finalized' ? 'rgba(34, 197, 94, 0.1)' : po.status === 'Received' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                                        color: po.status === 'Finalized' ? '#22c55e' : po.status === 'Received' ? '#3b82f6' : '#eab308',
                                                        border: po.status === 'Finalized' ? '1px solid rgba(34, 197, 94, 0.2)' : po.status === 'Received' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(234, 179, 8, 0.2)'
                                                    }}>
                                                        {po.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button className="btn-icon" onClick={() => handleEditPo(po)} title="Edit">
                                                            <FileText size={16} />
                                                        </button>
                                                        <button className="btn-icon" onClick={() => window.print()} title="Print">
                                                            <Printer size={16} />
                                                        </button>
                                                        <button className="btn-icon" onClick={() => handleDeletePo(po.id)} style={{ color: '#ef4444' }} title="Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    {!recordsLoading && filteredRecords.length === 0 && (
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
            )
            }

            <ProductLookupModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                onSelect={handleProductSelect}
                products={allInventory}
                inventoryMethod={appSettings.sale_module || 'FIFO'}
            />

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
            />
        </div>
    );
};

export default PurchaseOrder;
