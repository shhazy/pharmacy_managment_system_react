import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, ShoppingCart, Trash2, Plus, Minus, X, Check, AlertCircle,
    User, Receipt, Banknote, Tag, Info, List as ListIcon, ShieldCheck,
    ChevronDown, CreditCard, Wallet, RotateCcw, Save, Printer, Key, CheckCircle,
    Package, ArrowRight, Settings, PauseCircle, PlayCircle, Calendar, Filter,
    ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { showSuccess, showError, showInfo } from '../utils/toast';
import ProductLookupModal from '../components/ProductLookupModal';
import CustomerSearchBar from '../components/CustomerSearchBar';
import CustomerLookupModal from '../components/CustomerLookupModal';
import CashRegisterOpenModal from '../components/CashRegisterOpenModal';
import CashRegisterCloseModal from '../components/CashRegisterCloseModal';
import CashMovementModal from '../components/CashMovementModal';
import CashRegisterStatusModal from '../components/CashRegisterStatusModal';


const POS = ({ tenantId }) => {
    // --- STATE ---
    const [medicines, setMedicines] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState(false);
    const [isReturnMode, setIsReturnMode] = useState(false);

    // Help Window (F3) state
    const [showHelp, setShowHelp] = useState(false);
    const [conversionUnits, setConversionUnits] = useState([]);


    // Receipt Config
    const [settings, setSettings] = useState({});
    const [lastInvoice, setLastInvoice] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    // Invoice History
    const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [heldInvoices, setHeldInvoices] = useState([]);
    const [historyTab, setHistoryTab] = useState('Final'); // 'Final' or 'Held'
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

    // Config states
    const [config, setConfig] = useState({
        defaultSaleUnit: 'Single', // 'Single' or 'Pack'
        discountMode: 'Percent', // 'Percent' or 'Value'
        controlTrackMode: 'Warning' // 'Warning' or 'Lock'
    });

    // Totals & Financials
    const [adjustment, setAdjustment] = useState(0);
    const [receivedCash, setReceivedCash] = useState(0);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [adjPercent, setAdjPercent] = useState(0);
    const [invoiceDiscount, setInvoiceDiscount] = useState(0);
    const [remarks, setRemarks] = useState('');

    const [activeHeldBillId, setActiveHeldBillId] = useState(null);
    const [currentDeckIndex, setCurrentDeckIndex] = useState(-1); // -1 = New Sale, 0 = Latest Hold

    // Customer state
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState({ id: null, name: 'Walk-in Customer' });
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [showCustomerLookup, setShowCustomerLookup] = useState(false);
    const [appSettings, setAppSettings] = useState({
        invoice_template_id: 'default',
        invoice_custom_config: {}
    });

    // Cash Register Session State
    const [activeSession, setActiveSession] = useState(null);
    const [showOpenRegister, setShowOpenRegister] = useState(false);
    const [showCloseRegister, setShowCloseRegister] = useState(false);
    const [showCashMovement, setShowCashMovement] = useState(false);
    const [showRegisterStatus, setShowRegisterStatus] = useState(false);

    // Refs
    const searchInputRef = useRef(null);


    // --- EFFECTS ---
    useEffect(() => {
        fetchInventory();
        fetchSettings();
        fetchAppSettings();
        fetchCustomers();
        fetchActiveSession();
        // Load config from local storage if exists
        const savedConfig = localStorage.getItem('pos_config');
        if (savedConfig) setConfig(JSON.parse(savedConfig));
        fetchHeldInvoices();
    }, [tenantId]);

    const fetchActiveSession = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/cash-registers/sessions/active`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                }
            });
            if (res.ok) {
                const data = await res.json();
                setActiveSession(data);
            } else {
                const errorData = await res.json().catch(() => ({}));
                showError(errorData.detail || "Failed to fetch active session");
            }
        } catch (e) {
            console.error("Failed to fetch active session", e);
            showError("Network error: Could not connect to server");
        }
    };

    const fetchAppSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/app-settings`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) {
                const data = await res.json();
                setAppSettings(data);
            } else {
                showError("Failed to fetch app settings");
            }
        } catch (e) {
            console.error("Failed to fetch app settings", e);
            showError("Network error: Could not fetch app settings");
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                setShowHelp(true);
            }
            if (e.key === 'F6') {
                e.preventDefault();
                setShowInvoiceHistory(true);
            }
            if (e.key === 'F9') {
                e.preventDefault();
                setShowAdjustmentModal(true);
            }
            if (e.key === 'F2') {
                e.preventDefault();
                setShowCustomerLookup(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/inventory`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) {
                const data = await res.json();
                setMedicines(data);
            } else {
                showError("Failed to fetch inventory");
            }
        } catch (e) {
            console.error("Failed to fetch inventory", e);
            showError("Network error: Could not fetch inventory");
        }

        try {
            const res = await fetch(`${API_BASE_URL}/purchase-conversion-units`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) {
                const data = await res.json();
                setConversionUnits(data);
            }
        } catch (e) { console.error("Failed to fetch conversion units", e); }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/customers/all`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            } else {
                showError("Failed to fetch customers");
            }
        } catch (e) {
            console.error("Failed to fetch customers", e);
            showError("Network error: Could not fetch customers");
        }
    };

    const fetchHeldInvoices = async () => {
        try {
            const heldRes = await fetch(`${API_BASE_URL}/invoices?status=Hold`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (heldRes.ok) {
                const data = await heldRes.json();
                setHeldInvoices(data); // data is already ordered desc
            } else {
                showError("Failed to fetch held invoices");
            }
        } catch (e) {
            console.error("Failed to fetch held invoices", e);
            showError("Network error: Could not fetch held invoices");
        }
    };

    const loadDeckItem = (index) => {
        if (index === -1) {
            // New Sale
            setCart([]);
            setActiveHeldBillId(null);
            setAdjustment(0);
            setReceivedCash(0);
        } else {
            // Load Held Bill
            const inv = heldInvoices[index];
            if (!inv) return;
            setActiveHeldBillId(inv.id);
            setAdjustment(inv.adjustment || 0); // Assuming adjustment is stored or we calc it. 
            // Note: DB `adjustment` might be stored in `discount_amount` or custom. 
            // We use `discount_amount` as the field for total discount. 
            // If we want to restore `adjustment` state specifically, we might need a custom field or infer it.
            // For now, let's assume discount_amount maps to adjustment magnitude if raw discount was 0? 
            // Simplified: Reset adjustment to 0 or infer from net_total vs items total.

            // Reconstruct Cart
            const loadedCart = inv.items.map(item => {
                const productId = item.medicine_id || item.product_id;
                const med = medicines.find(m => m.id === productId);
                return {
                    productId: productId,
                    name: item.product?.product_name || item.name || 'Unknown Item',
                    batchId: item.batch_id,
                    batchNo: 'Held',
                    qty: item.quantity,
                    unitType: item.purchase_conversion_unit_id ? 'Pack' : 'Single',
                    baseRate: item.unit_price,
                    retail_price: item.retail_price,
                    tax_percent: item.tax_amount ? (item.tax_amount / (item.unit_price * item.quantity)) * 100 : 0,
                    factor: item.factor || 1,
                    base_unit_id: med?.base_unit_id,
                    purchase_conv_unit_id: med?.purchase_conv_unit_id,
                    uDist: item.total_price < (item.unit_price * item.quantity + (item.tax_amount || 0)) ? ((1 - (item.total_price / (item.unit_price * item.quantity + (item.tax_amount || 0)))) * 100) : 0,
                    // Approx discount percent reconstruction
                    control_drug: med?.control_drug || false
                };
            });
            setCart(loadedCart);
        }
        setCurrentDeckIndex(index);
    };

    const navigateDeck = (direction) => {
        // -1 (New) <-> 0 (Latest) <-> 1 (Older) ...
        // Forward (>): index - 1 (towards -1)
        // Back (<): index + 1 (towards length-1)

        let newIndex = currentDeckIndex;
        if (direction === 'back') {
            if (currentDeckIndex < heldInvoices.length - 1) newIndex++;
        } else {
            if (currentDeckIndex > -1) newIndex--;
        }

        if (newIndex !== currentDeckIndex) {
            // Check for unsaved changes?
            // For fast switching as requested, we just switch.
            loadDeckItem(newIndex);
        }
    };

    const fetchInvoices = async () => {
        try {
            const query = new URLSearchParams({
                limit: 100,
                start_date: dateFilter.start,
                end_date: dateFilter.end
            });
            const res = await fetch(`${API_BASE_URL}/invoices?${query}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            const heldRes = await fetch(`${API_BASE_URL}/invoices?status=Final`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (heldRes.ok) {
                setRecentInvoices(await heldRes.json());
            } else {
                showError("Failed to fetch invoices");
            }
        } catch (e) {
            console.error("Failed to fetch invoices", e);
            showError("Network error: Could not fetch invoices");
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) {
                setSettings(await res.json());
            } else {
                showError("Failed to load settings");
            }
        } catch (e) {
            console.error("Failed to load settings", e);
            showError("Network error: Could not load settings");
        }
    };

    // --- LOGIC ---
    const addToCart = useCallback((med, batch, requestedQty = 1, stayOpen = false) => {
        // Check for Control Drug
        if (med.control_drug) {
            showInfo("⚠️ PRESCRIBED MEDICINE: Please verify doctor's prescription before sale.");
        }

        const defaultUnitType = (med.preferred_pos_unit_id && med.preferred_pos_unit_id == med.purchase_conv_unit_id)
            ? 'Pack'
            : 'Single';
        const conversionFactor = med.purchase_conv_factor || 1;

        // Auto-selection logic for grouped products
        const itemsToAdd = [];
        if (!batch) {
            let remaining = requestedQty;
            const availableBatches = med.stock_inventory || [];

            for (const b of availableBatches) {
                if (remaining <= 0) break;
                if (b.quantity <= 0) continue;

                const factor = med.purchase_conv_factor || 1;
                // Since this is grouped, requestedQty is usually in the primary unit (Single or Pack)
                // but stock is always in Single units in the backend.
                // However, ProductLookupModal selectedQty is just a number.
                // If the user selected 'Pack' as default, we need to convert requestedQty to singles.

                // For simplicity, let's assume requestedQty is in 'defaultUnitType'
                const neededSingles = defaultUnitType === 'Pack' ? remaining * factor : remaining;
                const canTakeSingles = Math.min(neededSingles, b.quantity);

                if (canTakeSingles <= 0) continue;

                const takePrimary = defaultUnitType === 'Pack' ? canTakeSingles / factor : canTakeSingles;

                itemsToAdd.push({ batch: b, qty: takePrimary });
                remaining -= takePrimary;
            }

            if (remaining > 0 && requestedQty > 0) {
                showError(`Insufficient Stock! Only ${requestedQty - remaining} ${defaultUnitType}(s) added.`);
            }
        } else {
            // Manual selection or fallback
            itemsToAdd.push({ batch: batch, qty: requestedQty });
        }

        if (itemsToAdd.length === 0) return;

        setCart(prevCart => {
            let newCart = [...prevCart];

            itemsToAdd.forEach(({ batch: b, qty: rq }) => {
                const bId = b.inventory_id || b.id;
                const currentBatchStock = b.quantity || 0;
                const actualQty = isReturnMode ? -1 * Math.abs(rq) : rq;

                const existingIndex = newCart.findIndex(c => c.batchId === bId && c.unitType === defaultUnitType);

                if (existingIndex > -1) {
                    const existingItem = newCart[existingIndex];
                    const newTotalQty = existingItem.qty + actualQty;
                    const totalSinglesNeeded = defaultUnitType === 'Pack' ? newTotalQty * conversionFactor : newTotalQty;

                    if (actualQty > 0 && totalSinglesNeeded > currentBatchStock) {
                        showError(`Cannot add more of ${b.batch_number}. Limit reached.`);
                        return;
                    }
                    newCart[existingIndex] = { ...existingItem, qty: newTotalQty };
                } else {
                    const singlesNeeded = defaultUnitType === 'Pack' ? actualQty * conversionFactor : actualQty;
                    if (actualQty > 0 && singlesNeeded > currentBatchStock) {
                        showError(`Batch ${b.batch_number} has insufficient stock.`);
                        return;
                    }

                    newCart.push({
                        productId: med.id,
                        name: med.product_name,
                        batchId: bId,
                        batchNo: b.batch_number,
                        qty: actualQty,
                        unitType: defaultUnitType,
                        baseRate: b.selling_price || b.sale_price,
                        retail_price: b.retail_price || med.retail_price,
                        tax_percent: b.tax_percent || med.tax_percent || 0,
                        factor: conversionFactor,
                        base_unit_id: med.base_unit_id,
                        purchase_conv_unit_id: med.purchase_conv_unit_id,
                        uDist: 0,
                        discountMode: config.discountMode,
                        control_drug: med.control_drug,
                        isReturn: actualQty < 0
                    });
                }
            });
            return newCart;
        });

        setSearchTerm('');
        if (!stayOpen) {
            setShowHelp(false);
            if (searchInputRef.current) searchInputRef.current.focus();
        }
    }, [isReturnMode, config.controlTrackMode, setShowHelp, cart]);


    const removeFromCart = (batchId, unitType) => {
        setCart(cart.filter(c => !(c.batchId === batchId && c.unitType === unitType)));
    };

    const updateCartItem = (batchId, unitType, field, value) => {
        setCart(cart.map(c => {
            if (c.batchId === batchId && c.unitType === unitType) {
                return { ...c, [field]: value };
            }
            return c;
        }));
    };

    const toggleUnit = (item) => {
        if (item.factor <= 1) return;
        const newUnit = item.unitType === 'Single' ? 'Pack' : 'Single';
        updateCartItem(item.batchId, item.unitType, 'unitType', newUnit);
    };

    const handleReturnLoad = (invoice) => {
        // Load items with negative quantity for Return
        const returnCart = invoice.items.map(item => {
            const productId = item.medicine_id || item.product_id;
            const med = medicines.find(m => m.id === productId);
            return {
                productId: productId,
                name: item.product?.product_name || item.name || 'Unknown Item',
                batchId: item.batch_id,
                batchNo: item.batch_id, // We don't have the string easily, using ID or placeholder
                qty: -1 * Math.abs(item.quantity), // Force negative
                unitType: 'Single',
                baseRate: item.unit_price,
                retail_price: item.retail_price,
                tax_percent: item.tax_amount ? (item.tax_amount / (item.unit_price * item.quantity)) * 100 : 0,
                factor: 1,
                base_unit_id: med?.base_unit_id,
                purchase_conv_unit_id: med?.purchase_conv_unit_id,
                uDist: 0, // Reset discount for simplicity or calculate relative
                control_drug: med?.control_drug || false,
                isReturn: true
            };
        });
        setCart(returnCart);
        setActiveHeldBillId(null); // Returns are new transactions
        setCurrentDeckIndex(-1);
        setShowInvoiceHistory(false);
        setAdjustment(0);
        showInfo("Invoice loaded for RETURN. Quantities set to negative.");
    };

    // Calculations
    const calculateItemTotal = (item) => {
        const rate = item.unitType === 'Pack' ? item.baseRate * item.factor : item.baseRate;
        const subtotal = item.qty * rate; // Can be negative
        let discount = 0;
        // Discount logic should work with negative numbers (reducing the refund magnitude or keeping it proportional?)
        // Standard: Refund exactly what was paid.
        // If we simply use the same formula:
        if (item.discountMode === 'Percent') {
            discount = subtotal * (item.uDist / 100);
        } else {
            discount = item.qty * item.uDist;
        }
        // Result: -100 subtotal, 10% disc = -10. Net: -100 - (-10) = -90. 
        // This means we refund 90. Correct.

        const tax = subtotal * ((item.tax_percent || 0) / 100);
        return subtotal + tax - discount;
    };

    const grossTotal = cart.reduce((acc, item) => acc + calculateItemTotal(item), 0);
    const baseNetTotal = grossTotal + parseFloat(adjustment || 0);
    const netTotal = baseNetTotal - invoiceDiscount;
    const changeAmount = (paymentMode === 'Cash' && receivedCash > netTotal) ? receivedCash - netTotal : 0;

    const handleHoldBill = async () => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const payload = {
                items: cart.map(c => ({
                    medicine_id: c.productId,
                    batch_id: c.batchId,
                    quantity: c.unitType === 'Pack' ? c.qty * c.factor : c.qty,
                    unit_price: c.baseRate,
                    retail_price: c.retail_price,
                    tax_percent: c.tax_percent,
                    discount_percent: c.discountMode === 'Percent' ? c.uDist : 0,
                    discount_amount: c.discountMode === 'Value' ? c.uDist * c.qty : 0
                })),
                payment_method: "Hold",
                discount_amount: Math.abs(adjustment < 0 ? adjustment : 0) + invoiceDiscount,
                invoice_discount: invoiceDiscount,
                status: "Hold"
            };

            let url = `${API_BASE_URL}/invoices`;
            let method = 'POST';

            if (activeHeldBillId) {
                url = `${API_BASE_URL}/invoices/${activeHeldBillId}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Refresh held count
                await fetchHeldInvoices();

                if (activeHeldBillId) {
                    showSuccess("Held Bill Updated.");
                } else {
                    showSuccess("Bill placed on HOLD.");
                    // If we just held a new bill, it becomes index 0.
                    // We should probably stay on it or clear?
                    // Standard POS: "Hold" clears the screen for next customer.
                    setCart([]);
                    setAdjustment(0);
                    setActiveHeldBillId(null);
                    setCurrentDeckIndex(-1);
                }
                fetchInventory();
            } else {
                showError("Failed to hold bill");
            }
        } catch (e) { showError("Failed to hold bill"); }
        finally { setProcessing(false); }
    };

    useEffect(() => {
        if (showInvoiceHistory) fetchInvoices();
    }, [showInvoiceHistory, dateFilter]); // Auto-refresh on filter change

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);

        const isReturn = netTotal < 0;

        try {
            const payload = {
                items: cart.map(c => ({
                    medicine_id: c.productId,
                    batch_id: c.batchId,
                    quantity: c.unitType === 'Pack' ? c.qty * c.factor : c.qty,
                    unit_price: c.baseRate,
                    retail_price: c.retail_price,
                    tax_percent: c.tax_percent,
                    discount_percent: c.discountMode === 'Percent' ? c.uDist : 0,
                    discount_amount: c.discountMode === 'Value' ? c.uDist * c.qty : 0
                })),
                customer_id: selectedCustomer.id,
                customer_name: selectedCustomer.id ? null : (selectedCustomer.name || 'Walk-in Customer'),
                payment_method: paymentMode,
                cash_register_session_id: activeSession ? activeSession.id : null,
                discount_amount: Math.abs(adjustment < 0 ? adjustment : 0) + invoiceDiscount,
                adjustment: adjustment,
                invoice_discount: invoiceDiscount,
                status: isReturn ? "Return" : (paymentMode === "Credit" ? "Credit" : "Paid"),
                remarks: remarks
            };


            // Session check for cash sales
            if (paymentMode === 'Cash' && !activeSession) {
                showError("No active cash register session found. Please open a register first.");
                setShowOpenRegister(true);
                setProcessing(false);
                return;
            }


            // Validation for Credit sales
            if (paymentMode === "Credit") {
                if (!selectedCustomer.id) {
                    showError("Select a customer for Credit sale.");
                    setProcessing(false);
                    return;
                }
                if (!selectedCustomer.allow_credit) {
                    showError("Credit is NOT allowed for this customer.");
                    setProcessing(false);
                    return;
                }
                const isExpired = selectedCustomer.expiry_date && new Date(selectedCustomer.expiry_date) < new Date();
                if (isExpired) {
                    showError("Customer account has expired.");
                    setProcessing(false);
                    return;
                }
                const balance = selectedCustomer.current_balance || 0;
                const limit = selectedCustomer.credit_limit || 0;
                if (balance + netTotal > limit) {
                    showError(`Credit limit exceeded! (Total Owed: ${balance}, Available: ${limit - balance})`);
                    setProcessing(false);
                    return;
                }
            }

            let url = `${API_BASE_URL}/invoices`;
            let method = 'POST';

            if (activeHeldBillId) {
                url = `${API_BASE_URL}/invoices/${activeHeldBillId}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const inv = await res.json();

                // Merge cart item details with invoice for printing
                const enrichedItems = cart.map((cartItem, idx) => ({
                    product_name: cartItem.name,
                    batch_number: cartItem.batchNo,
                    quantity: cartItem.unitType === 'Pack' ? cartItem.qty * cartItem.factor : cartItem.qty,
                    unit_price: cartItem.baseRate,
                    retail_price: cartItem.retail_price,
                    tax_percent: cartItem.tax_percent,
                    discount_percent: config.discountMode === 'Percent' ? cartItem.uDist : 0,
                    discount_amount: config.discountMode === 'Value' ? cartItem.uDist * cartItem.qty : 0,
                    total_price: calculateItemTotal(cartItem)
                }));

                setLastInvoice({
                    ...inv,
                    items: enrichedItems,
                    receivedCash: receivedCash,
                    invoiceDiscount: invoiceDiscount,
                    changeAmount: changeAmount,
                    customer_name: payload.customer_name || selectedCustomer.name,
                    discount_mode: config.discountMode
                });

                setCart([]);
                setAdjustment(0);
                setInvoiceDiscount(0);
                setActiveHeldBillId(null);
                setCurrentDeckIndex(-1);
                fetchHeldInvoices(); // Refresh deck
                fetchCustomers(); // Refresh customer balances
                setSelectedCustomer({ id: null, name: 'Walk-in Customer' });
                setReceivedCash(0);
                setRemarks('');
                setShowReceiptModal(true); // Show success modal instead of alert
                fetchInventory();
                fetchActiveSession(); // Refresh cash register stats
            } else {
                const err = await res.json();
                showError(err.detail || "Checkout failed");
            }
        } catch (e) { showError("Checkout failed"); }
        finally { setProcessing(false); }
    };

    const printReceipt = (invoice = lastInvoice) => {
        if (!invoice) return;

        const isReturn = invoice.status === 'Return' || invoice.net_total < 0;
        const templateId = appSettings.invoice_template_id || 'default';
        const custom = appSettings.invoice_custom_config || {};
        // Make Clinix style the default if no specific template is chosen (or if default is chosen)
        const isClinix = templateId === 'clinix' || templateId === 'default';

        let paperWidth = '72mm';
        if (templateId === 'thermal58') paperWidth = '48mm';
        if (templateId === 'detailed') paperWidth = '210mm'; // A4

        const win = window.open('', '', 'width=800,height=900');

        // Exact Clinix Header Layout
        const clinixHeader = isClinix ? `
            <div class="center" style="margin-bottom: 2px;">
                ${(custom.showLogo !== false && settings.logo_url) ? `<img src="${settings.logo_url}" class="logo" />` : ''}
            </div>
            <div style="background: black; color: white; text-align: center; font-weight: bold; padding: 2px 0; font-size: 0.9em; margin-bottom: 8px; text-transform: uppercase;">
                ${settings.tagline || 'SUPERSTORE'}
            </div>
            <div class="center" style="font-size: 1.1em; margin-bottom: 2px;">${settings.name || 'SUPERSTORE'}</div>
            <div class="center" style="font-size: 0.85em;">
                ${settings.address || 'Amna Plaza Block#16, Near Girls Degree College, KW'}<br/>
                Phone #: ${settings.phone_no || '065-2554412, 2557912'}<br/>
                Drug Lic #: ${settings.license_no || '04-364-0045-022247P'}
            </div>
             <div class="center" style="font-size: 0.85em; margin-bottom: 8px;">(${invoice.id || '6459'})</div>
        ` : '';

        const style = `
             <style>
                @page { margin: 0; }
                body { 
                    font-family: ${isClinix ? "'Arial Narrow', 'Roboto Condensed', sans-serif" : (templateId === 'detailed' ? "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" : "'Courier New', monospace")}; 
                    width: ${paperWidth}; 
                    margin: ${templateId === 'detailed' ? '15mm' : '0 auto'}; 
                    padding: ${isClinix ? '10px 5px' : '8px'}; 
                    font-size: ${custom.fontSize || 12}px; 
                    color: black; 
                    line-height: 1.25;
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .header { margin-bottom: ${isClinix ? '5px' : '12px'}; text-align: ${custom.headerAlign || 'center'}; }
                .logo { max-width: 100%; max-height: 50px; margin-bottom: 5px; }
                .divider { border-top: 1px dashed black; margin: 8px 0; }
                
                /* Clinix Specifics */
                .clinix-divider { border-top: 1px solid #000; margin: 5px 0; }
                .row-sb { display: flex; justify-content: space-between; }
                .clinix-table-header { 
                    display: grid; 
                    grid-template-columns: 2fr 35px 50px 45px 45px 70px; 
                    border-top: 1px solid black; 
                    border-bottom: 1px solid black; 
                    padding: 3px 0; 
                    margin: 5px 0;
                    font-weight: bold;
                    font-size: 0.95em;
                }
                .clinix-row { 
                    display: grid; 
                    grid-template-columns: 2fr 35px 50px 45px 45px 70px; 
                    margin-bottom: 4px; 
                    font-size: 0.95em;
                }
                
                @media print {
                    body { width: ${paperWidth}; margin: ${templateId === 'detailed' ? '15mm' : '0 auto'}; }
                }
            </style>
        `;

        const content = `
            <html>
            <head>
                <title>${isReturn ? 'Return Receipt' : 'Invoice'} - ${invoice.invoice_number}</title>
                ${style}
            </head>
            <body>
                ${isReturn ? '<div class="center bold" style="font-size: 1.3em; margin-bottom: 8px; border: 1px solid black; padding: 2px;">SALE RETURN</div>' : ''}
                
                ${isClinix ? clinixHeader : `
                    <div class="header">
                        ${(custom.showLogo !== false && settings.logo_url) ? `<img src="${settings.logo_url}" class="logo" />` : ''}
                        <div style="font-size: 1.4em; font-weight: bold;">${settings.name || 'CITY CARE PHARMACY'}</div>
                        ${custom.showTagline !== false ? `<div style="font-size: 0.9em; font-weight: bold; font-style: italic;">${settings.tagline || 'THE MEDICINE SUPERSTORE'}</div>` : ''}
                        <div style="font-size: 0.85em; margin-top: 3px;">
                            ${settings.address || 'PHARMACY ADDRESS'}<br/>
                            Ph: ${settings.phone_no || '000-000000'} ${settings.license_no ? ` | Lic: ${settings.license_no}` : ''}
                        </div>
                    </div>
                `}

                ${isClinix ? `
                   <div style="font-size: 0.9em; margin-bottom: 8px;">
                       <div class="row-sb">
                           <span>No . ${invoice.invoice_number || '---'}</span>
                           <span>${new Date(invoice.created_at || new Date()).toLocaleString('en-GB')}</span>
                       </div>
                       <div style="margin-top: 2px;">
                           M/s: ${custom.showCustomer !== false ? (invoice.customer_name || 'WALKING CUSTOMER') : 'WALKING CUSTOMER'} A/C
                       </div>
                       <div style="margin-top: 2px;">
                           Remarks: ${(invoice.remarks || invoice.user?.name || 'ADMIN').toUpperCase()}
                       </div>
                   </div>

                    ${(() => {
                    const hasPercentDisc = invoice.items.some(it => (it.discount_percent || 0) > 0);
                    const hasAmountDisc = invoice.items.some(it => (it.discount_amount || 0) > 0);
                    let discHeader = 'Disc';
                    if (invoice.discount_mode === 'Percent' || hasPercentDisc) discHeader = 'Disc %';
                    else if (invoice.discount_mode === 'Value' || hasAmountDisc) discHeader = 'Disc Rs';

                    return `
                        <div class="clinix-table-header">
                            <span>Item Name</span>
                            <span class="center">Qty</span>
                            <span class="center">Price</span>
                            <span class="center">GST %</span>
                            <span class="center">${discHeader}</span>
                            <span class="right">Total</span>
                        </div>

                        ${invoice.items.map(item => {
                        const discPerc = item.discount_percent || 0;
                        const discAmt = item.discount_amount || 0;
                        const discDisplay = discPerc > 0 ? `${discPerc.toFixed(1)}%` : (discAmt > 0 ? `${discAmt.toFixed(2)}` : '0');

                        return `
                            <div class="clinix-row">
                                 <span style="overflow: hidden;">
                                      ${item.product_name || (item.product && item.product.product_name) || item.name || item.medicine_name || `Item ${item.medicine_id || '---'}`}
                                 </span>
                                <span class="center">${item.quantity || item.qty || 0}</span>
                                <span class="center">${(item.unit_price || 0).toFixed(2)}</span>
                                <span class="center">${(item.tax_percent || 0)}%</span>
                                <span class="center">${discDisplay}</span>
                                <span class="right">${(item.total_price || 0).toFixed(2)}</span>
                            </div>
                        `}).join('')}
                        `;
                })()}

                   <div class="clinix-divider"></div>
                   
                   <div style="font-size: 0.95em;">
                       <div>Total items: ${invoice.items.length}</div>
                       <div class="row-sb" style="margin-top: 5px;">
                            <span class="center" style="width: 100%;">Gross Total :</span>
                            <span class="right">${(invoice.sub_total || 0).toFixed(2)}</span>
                       </div>
                       ${invoice.tax_amount > 0 ? `
                           <div class="row-sb">
                               <span class="center" style="width: 100%;">GST Amount :</span>
                               <span class="right">${invoice.tax_amount.toFixed(2)}</span>
                           </div>
                       ` : ''}
                       ${invoice.discount_amount > 0 ? `
                           <div class="row-sb">
                               <span class="center" style="width: 100%;">Discount :</span>
                               <span class="right">-${invoice.discount_amount.toFixed(2)}</span>
                           </div>
                       ` : ''}
                       <div class="row-sb" style="margin-top: 15px; font-weight: bold; font-size: 1.1em;">
                            <span>${invoice.user?.name || ''}</span>
                            <span style="margin-left: auto;">Net Total.</span>
                            <span style="margin-left: 20px;">${Math.abs(invoice.net_total || 0).toFixed(2)}</span>
                       </div>
                   </div>

                   <div class="center" style="font-size: 0.7em; margin-top: 20px; border-top: 1px solid #000; padding-top: 5px;">
                        (Computer Software developed by EIGLOU<br/> Ph 042-3742xxx-xx)
                   </div>

                ` : `
                    <!-- STANDARD / DEFAULT TEMPLATE LOGIC -->
                    <div class="divider"></div>
                    <div style="margin-bottom: 8px; font-size: 0.95em;">
                        <div class="row">
                            <span><span class="bold">${isReturn ? 'Ret. No:' : 'Invoice #:'}</span> ${isReturn ? (invoice.return_number || 'REV-' + invoice.id) : (invoice.invoice_number || '---')}</span>
                            <span><span class="bold">POS No:</span> ${invoice.id || '---'}</span>
                        </div>
                        <div class="row">
                            <span><span class="bold">Cashier:</span> ${custom.showCashier !== false ? (invoice.user?.name || 'ADMIN') : '---'}</span>
                            <span>${new Date(invoice.created_at || new Date()).toLocaleString()}</span>
                        </div>
                        <div class="row">
                            <span><span class="bold">Mode:</span> ${invoice.payment_method || 'Cash'}</span>
                        </div>
                         <div class="row">
                            <span><span class="bold">Customer:</span> ${invoice.customer_name || 'Walk-in Customer'}</span>
                        </div>
                    </div>
                    
                    <div class="table-header">
                        <div class="row">
                            <span style="width: 10%">#</span><span style="flex: 1">Description</span><span style="width: 25%; text-align: right">Total</span>
                        </div>
                    </div>

                    ${invoice.items.map((item, i) => {
                    const lineTax = (item.unit_price * (item.quantity || 0)) * ((item.tax_percent || 0) / 100);
                    return `
                        <div class="item-row">
                            <div class="row">
                                <span style="width: 10%">${i + 1}</span>
                                 <span style="flex: 1">${item.product_name || (item.product && item.product.product_name) || item.name || item.medicine_name || `Item ${item.medicine_id || '---'}`}</span>
                                <span style="width: 25%; text-align: right" class="bold">${(item.total_price || 0).toFixed(2)}</span>
                            </div>
                            <div style="font-size: 0.8em; padding-left: 10%; opacity: 0.7;">
                                ${item.unit_price || 0} x ${item.quantity || item.qty || 0} 
                                ${item.tax_percent > 0 ? `| GST ${item.tax_percent}% (${lineTax.toFixed(2)})` : ''}
                            </div>
                        </div>
                    `}).join('')}

                    <div class="divider"></div>
                    <div class="footer-sections">
                         ${invoice.tax_amount > 0 ? `
                             <div class="row">
                                <span>TAX AMOUNT:</span>
                                <span>PKR ${invoice.tax_amount.toFixed(2)}</span>
                             </div>
                         ` : ''}
                         <div class="row big-total">
                            <span>NET PAYABLE:</span>
                            <span>PKR ${Math.abs(invoice.net_total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                `}
            </body>
            </html>
        `;

        win.document.write(content);
        win.document.close();
        win.setTimeout(() => {
            win.print();
            win.close();
        }, 500);
    };

    // Helper function to sort batches based on sale_module setting
    const sortBatches = (batches, method) => {
        if (!batches || batches.length === 0) return [];
        const sorted = [...batches].filter(b => b.quantity > 0);

        if (method === 'FIFO') {
            // First In, First Out - sort by created_at or id (oldest first)
            return sorted.sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                return dateA - dateB || (a.id || 0) - (b.id || 0);
            });
        } else if (method === 'FEFO') {
            // First Expired, First Out - sort by expiry_date (earliest expiry first)
            return sorted.sort((a, b) => {
                const dateA = a.expiry_date ? new Date(a.expiry_date) : new Date('9999-12-31');
                const dateB = b.expiry_date ? new Date(b.expiry_date) : new Date('9999-12-31');
                return dateA - dateB;
            });
        }
        // Default - show all batches as-is
        return sorted;
    };

    const saleModule = appSettings.sale_module || 'FIFO';
    const isGroupedMode = saleModule !== 'Default';

    const filteredMedicines = (medicines || []).filter(m =>
        m.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.generic_name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10).map(m => {
        // Sort batches according to the sale module setting
        const sortedBatches = sortBatches(m.stock_inventory || [], saleModule);
        return { ...m, stock_inventory: sortedBatches };
    });



    return (
        <>
            <style>{`
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
            <div style={{
                height: 'calc(100vh - 180px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '0 24px 10px 24px',
                overflow: 'hidden',
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 310px',
                    gridTemplateRows: '1fr',
                    gap: '12px',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden'
                }}>
                    {/* --- LEFT SIDE: CART & SEARCH --- */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', minHeight: 0, overflow: 'hidden', minWidth: 0 }}>
                        {/* Search Bar Area */}
                        <div style={{ position: 'relative', zIndex: 100 }}>
                            <div className="glass-card" style={{ padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0',
                                        padding: '4px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        position: 'relative',
                                        minWidth: '180px'
                                    }}
                                >
                                    <div
                                        onClick={() => setIsReturnMode(false)}
                                        style={{
                                            flex: 1,
                                            padding: '6px 12px',
                                            textAlign: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            zIndex: 2,
                                            color: !isReturnMode ? 'white' : 'var(--text-secondary)',
                                            position: 'relative'
                                        }}
                                    >
                                        <Tag size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                        SALE
                                    </div>
                                    <div
                                        onClick={() => setIsReturnMode(true)}
                                        style={{
                                            flex: 1,
                                            padding: '6px 12px',
                                            textAlign: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            zIndex: 2,
                                            color: isReturnMode ? 'white' : 'var(--text-secondary)',
                                            position: 'relative'
                                        }}
                                    >
                                        <RotateCcw size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                        RETURN
                                    </div>
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            left: isReturnMode ? 'calc(50% - 2px)' : '4px',
                                            width: 'calc(50% - 2px)',
                                            height: 'calc(100% - 8px)',
                                            background: isReturnMode ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
                                            borderRadius: '8px',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            zIndex: 1,
                                            boxShadow: isReturnMode ? '0 2px 8px rgba(239, 68, 68, 0.4)' : '0 2px 8px rgba(16, 185, 129, 0.4)'
                                        }}
                                    />
                                </div>

                                {/* Cash Register Session Indicator */}
                                <div
                                    onClick={() => activeSession ? setShowCloseRegister(true) : setShowOpenRegister(true)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 12px',
                                        color: activeSession ? '#3b82f6' : '#f59e0b',
                                        background: activeSession ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        borderRadius: '8px',
                                        border: `1px solid ${activeSession ? '#3b82f6' : '#f59e0b'}`,
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        minWidth: '160px',
                                        justifyContent: 'center'
                                    }}
                                    title={activeSession ? `Shift: ${activeSession.session_number}` : 'Open Cash Register'}
                                >
                                    <Banknote size={16} />
                                    {activeSession ? `Session: ${activeSession.session_number.split('-').pop()}` : 'OPEN REGISTER'}
                                    {activeSession && (
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#3b82f6',
                                            marginLeft: '4px',
                                            boxShadow: '0 0 8px #3b82f6'
                                        }} />
                                    )}
                                </div>

                                {activeSession && (
                                    <div
                                        onClick={() => setShowCashMovement(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            color: '#ec4899',
                                            background: 'rgba(236, 72, 153, 0.1)',
                                            borderRadius: '8px',
                                            border: '1px solid #ec4899',
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                        title="Cash Movement (Petty Cash/Withdrawal)"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <ArrowUpCircle size={14} />
                                            <ArrowDownCircle size={14} style={{ marginLeft: '-4px' }} />
                                        </div>
                                        <span>MOVEMENTS</span>
                                    </div>
                                )}

                                {activeSession && (
                                    <div
                                        onClick={() => setShowRegisterStatus(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            color: '#6366f1',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            borderRadius: '8px',
                                            border: '1px solid #6366f1',
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                        title="View Register Status"
                                    >
                                        <Info size={16} />
                                        <span>STATUS</span>
                                    </div>
                                )}

                                <div style={{ flex: 1.5, minWidth: '220px', position: 'relative' }}>
                                    <Search style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-secondary)' }} size={24} />
                                    <input
                                        ref={searchInputRef}
                                        className="input-field"
                                        placeholder="Medicine name or scan... (F3 list)"
                                        style={{ padding: '12px 16px 12px 48px', fontSize: '1.1rem', borderRadius: '10px' }}
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />

                                    {/* Fast Search Dropdown */}
                                    {searchTerm && (
                                        <div className="fade-in" style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                            background: 'var(--surface)', border: '1px solid var(--border)',
                                            borderRadius: '12px', marginTop: '8px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                            overflow: 'hidden', maxHeight: '400px', overflowY: 'auto'
                                        }}>
                                            {isGroupedMode ? (
                                                // Grouped Mode (FIFO/FEFO): Show product with auto-batch selection
                                                filteredMedicines.map(m => {
                                                    const batches = m.stock_inventory || [];
                                                    if (batches.length === 0) return null;
                                                    const firstBatch = batches[0]; // Auto-selected batch
                                                    const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);

                                                    return (
                                                        <div
                                                            key={m.id}
                                                            style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}
                                                            onClick={() => {
                                                                addToCart(m, null); // null batch triggers auto-selection in addToCart
                                                                setSearchTerm('');
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <div>
                                                                <div style={{ fontWeight: 600 }}>{m.product_name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                    {m.generic_name} • {batches.length} batch(es) • Auto: {saleModule}
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Rs. {firstBatch.selling_price || firstBatch.sale_price}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{totalStock} in stock</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                // Default Mode: Show all batches individually
                                                filteredMedicines.map(m => (m.stock_inventory || []).map(b => (
                                                    <div
                                                        key={`${m.id}-${b.inventory_id}`}
                                                        style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}
                                                        onClick={() => {
                                                            addToCart(m, b);
                                                            setSearchTerm('');
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{m.product_name} - {b.batch_number}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.generic_name}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Rs. {b.selling_price || b.sale_price}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{b.quantity} in stock</div>
                                                        </div>
                                                    </div>
                                                )))
                                            )}
                                            {filteredMedicines.length === 0 && <div style={{ padding: '20px', textAlign: 'center' }}>No matches</div>}
                                        </div>
                                    )}
                                </div>

                                {/* Customer Search Section */}
                                <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <CustomerSearchBar
                                            value={customerSearchTerm}
                                            onChange={e => {
                                                setCustomerSearchTerm(e.target.value);
                                            }}
                                            containerStyle={{ borderRadius: '10px', height: '44px' }}
                                        />
                                        {customerSearchTerm && (
                                            <div className="fade-in" style={{
                                                position: 'absolute', top: '100%', left: 0, right: 0,
                                                background: 'var(--surface)', border: '1px solid var(--border)',
                                                borderRadius: '12px', marginTop: '8px', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                                maxHeight: '300px', overflowY: 'auto'
                                            }}>
                                                {customers.filter(c =>
                                                    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                                                    c.mobile_phone?.includes(customerSearchTerm)
                                                ).slice(0, 5).map(c => (
                                                    <div
                                                        key={c.id}
                                                        style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                                        onClick={() => {
                                                            setSelectedCustomer(c);
                                                            setCustomerSearchTerm('');
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.mobile_phone || 'No Phone'} | Bal: Rs. {c.current_balance || 0}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="btn-secondary"
                                        style={{ height: '44px', padding: '0 12px', borderRadius: '10px', gap: '8px' }}
                                        onClick={() => setShowCustomerLookup(true)}
                                        title="Customer Lookup (F2)"
                                    >
                                        <ListIcon size={18} />
                                        <span style={{ fontSize: '0.8rem' }}>F2</span>
                                    </button>
                                </div>

                                <button
                                    className="btn-secondary"
                                    style={{ height: '44px', width: '44px', minWidth: '44px', padding: 0 }}
                                    onClick={() => setShowHelp(true)}
                                    title="Product Browser (F3)"
                                >
                                    <ListIcon size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Main Cart Grid */}
                        <div className="glass-card" style={{ flex: 1, minHeight: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ overflow: 'auto', flex: 1 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(5px)', zIndex: 10 }}>
                                        <tr>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', width: '40px', fontSize: '0.85rem' }}>#</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem' }}>Product Details</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', width: '100px', fontSize: '0.85rem' }}>Unit</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', width: '90px', fontSize: '0.85rem' }}>Rate</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', width: '90px', fontSize: '0.85rem' }}>Qty</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', width: '100px', fontSize: '0.85rem' }}>GST (% / Rs)</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', width: '130px', fontSize: '0.85rem' }}>Discount</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right', width: '100px', fontSize: '0.85rem' }}>Total</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', width: '50px', fontSize: '0.85rem' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map((item, index) => (
                                            <tr
                                                key={`${item.batchId}-${item.unitType}`}
                                                style={{
                                                    borderBottom: '1px solid var(--border)',
                                                    background: item.qty < 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                                                }}
                                                className="fade-in"
                                            >
                                                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{index + 1}</td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {item.name}
                                                        {item.control_drug && <ShieldCheck size={14} color="#ef4444" />}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Batch: {item.batchNo}</div>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => toggleUnit(item)}
                                                        disabled={item.factor <= 1}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)',
                                                            background: item.unitType === 'Pack' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                            color: 'white', cursor: item.factor > 1 ? 'pointer' : 'default', fontSize: '0.75rem', fontWeight: 'bold',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {item.unitType === 'Pack'
                                                            ? (conversionUnits.find(u => u.id == item.purchase_conv_unit_id)?.name || 'Pack')
                                                            : (conversionUnits.find(u => u.id == item.base_unit_id)?.name || 'Single')}
                                                        {item.factor > 1 && item.unitType === 'Pack' && ` x ${item.factor}`}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>
                                                    {(item.unitType === 'Pack' ? item.baseRate * item.factor : item.baseRate).toFixed(2)}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                        <button
                                                            onClick={() => {
                                                                let newQty;
                                                                if (!isReturnMode) {
                                                                    // Sale mode: Must be 1 or more
                                                                    newQty = Math.max(1, (item.qty || 0) - 1);
                                                                } else {
                                                                    // Return mode: Decrease refund magnitude (-2 -> -1)
                                                                    newQty = Math.min(-1, (item.qty || 0) + 1);
                                                                }
                                                                updateCartItem(item.batchId, item.unitType, 'qty', newQty);
                                                            }}
                                                            style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'white', cursor: 'pointer' }}
                                                        >-</button>
                                                        <input
                                                            type="number"
                                                            className="input-field"
                                                            style={{
                                                                width: '35px',
                                                                height: '24px',
                                                                textAlign: 'center',
                                                                padding: '2px',
                                                                borderRadius: '4px',
                                                                border: '1px solid var(--border)',
                                                                background: 'rgba(255,255,255,0.05)',
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.85rem',
                                                                MozAppearance: 'textfield'
                                                            }}
                                                            value={item.qty}
                                                            onFocus={e => e.target.select()}
                                                            onChange={e => {
                                                                const val = parseInt(e.target.value);
                                                                if (!isNaN(val)) {
                                                                    let correctedVal = val;
                                                                    if (!isReturnMode && val < 1) correctedVal = 1;
                                                                    if (isReturnMode && val > -1) correctedVal = -1;
                                                                    updateCartItem(item.batchId, item.unitType, 'qty', correctedVal);
                                                                } else if (e.target.value === '') {
                                                                    updateCartItem(item.batchId, item.unitType, 'qty', isReturnMode ? -1 : 1);
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                let newQty;
                                                                if (!isReturnMode) {
                                                                    // Sale mode: increase positive
                                                                    newQty = Math.max(1, (item.qty || 0) + 1);
                                                                } else {
                                                                    // Return mode: increase refund magnitude (-1 -> -2)
                                                                    newQty = (item.qty || 0) - 1;
                                                                }
                                                                updateCartItem(item.batchId, item.unitType, 'qty', newQty);
                                                            }}
                                                            style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'white', cursor: 'pointer' }}
                                                        >+</button>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <div style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '4px 8px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border)'
                                                    }}>
                                                        <input
                                                            type="number"
                                                            className="input-field"
                                                            style={{
                                                                textAlign: 'center',
                                                                padding: '2px 4px',
                                                                height: '24px',
                                                                width: '40px',
                                                                fontSize: '0.75rem',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                MozAppearance: 'textfield'
                                                            }}
                                                            value={item.tax_percent ?? 0}
                                                            onFocus={e => e.target.select()}
                                                            onChange={e => updateCartItem(item.batchId, item.unitType, 'tax_percent', parseFloat(e.target.value) || 0)}
                                                        />
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                            Rs {(item.qty * (item.unitType === 'Pack' ? item.baseRate * item.factor : item.baseRate) * (item.tax_percent / 100)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)' }}>
                                                        <input
                                                            type="number"
                                                            className="input-field"
                                                            style={{ textAlign: 'center', padding: '4px', height: '24px', width: '45px', background: 'transparent', border: 'none', fontSize: '0.85rem' }}
                                                            value={item.uDist || ''}
                                                            onFocus={e => e.target.select()}
                                                            onChange={e => updateCartItem(item.batchId, item.unitType, 'uDist', parseFloat(e.target.value) || 0)}
                                                        />
                                                        <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                                            <button
                                                                onClick={() => updateCartItem(item.batchId, item.unitType, 'discountMode', 'Percent')}
                                                                style={{ padding: '2px 4px', fontSize: '0.65rem', border: 'none', background: item.discountMode === 'Percent' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer' }}
                                                            >%</button>
                                                            <button
                                                                onClick={() => updateCartItem(item.batchId, item.unitType, 'discountMode', 'Value')}
                                                                style={{ padding: '2px 4px', fontSize: '0.65rem', border: 'none', background: item.discountMode === 'Value' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer' }}
                                                            >Rs</button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: 'var(--primary)' }}>
                                                    {calculateItemTotal(item).toFixed(2)}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => removeFromCart(item.batchId, item.unitType)}
                                                        style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cart.length === 0 && (
                                            <tr>
                                                <td colSpan="8" style={{ padding: '100px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                    <ShoppingCart size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                                                    <div>Your retail cart is empty. Scan items to begin.</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Cart Footer */}
                            <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Items: <span style={{ color: 'white', fontWeight: 'bold' }}>{cart.length}</span></div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Units: <span style={{ color: 'white', fontWeight: 'bold' }}>{cart.reduce((a, b) => a + b.qty, 0)}</span></div>

                                    <div style={{ height: '20px', width: '1px', background: 'var(--border)', margin: '0 8px' }} />

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>


                                        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>UNIT:</span>
                                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)' }}>
                                                <button
                                                    onClick={() => setConfig(p => { const next = { ...p, defaultSaleUnit: 'Single' }; localStorage.setItem('pos_config', JSON.stringify(next)); return next; })}
                                                    style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '4px', border: 'none', background: config.defaultSaleUnit === 'Single' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer' }}
                                                >S</button>
                                                <button
                                                    onClick={() => setConfig(p => { const next = { ...p, defaultSaleUnit: 'Pack' }; localStorage.setItem('pos_config', JSON.stringify(next)); return next; })}
                                                    style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '4px', border: 'none', background: config.defaultSaleUnit === 'Pack' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer' }}
                                                >P</button>
                                            </div>
                                        </div> */}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                        <button
                                            onClick={() => navigateDeck('back')}
                                            disabled={currentDeckIndex >= heldInvoices.length - 1}
                                            style={{ padding: '6px 10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: currentDeckIndex >= heldInvoices.length - 1 ? 0.3 : 1, fontSize: '0.75rem' }}
                                        >
                                            &lt; Prev
                                        </button>
                                        <div style={{ padding: '0 8px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                                            {currentDeckIndex === -1 ? 'NEW' : `HOLD ${heldInvoices.length - currentDeckIndex}`}
                                        </div>
                                        <button
                                            onClick={() => navigateDeck('forward')}
                                            disabled={currentDeckIndex === -1}
                                            style={{ padding: '6px 10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: currentDeckIndex === -1 ? 0.3 : 1, fontSize: '0.75rem' }}
                                        >
                                            Next &gt;
                                        </button>
                                    </div>

                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                        onClick={() => handleHoldBill()}
                                        disabled={cart.length === 0}
                                        title="Hold/Update Bill"
                                    >
                                        <PauseCircle size={14} /> {activeHeldBillId ? 'Update' : 'Hold'}
                                    </button>

                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                        onClick={() => setShowAdjustmentModal(true)}
                                        title="Add Discount/Adjustment (F9)"
                                    >
                                        <Settings size={14} /> Adj
                                    </button>

                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                        onClick={() => { setShowInvoiceHistory(true); setHistoryTab('Final'); fetchInvoices(); }}
                                        title="View History (F6)"
                                    >
                                        <Receipt size={14} /> Hist
                                    </button>

                                    <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => setCart([])}><RotateCcw size={14} /> Clear</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT SIDE: BILL SUMMARY --- */}
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '12px', overflow: 'hidden' }}>
                        <div className="glass-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '14px', gap: '8px', justifyContent: 'flex-start', overflow: 'auto' }}>

                            {/* FIXED HEADER: GRAND TOTAL */}
                            <div
                                onClick={() => setReceivedCash(parseFloat(Math.abs(netTotal).toFixed(2)))}
                                title="Click to auto-fill Received Cash"
                                style={{
                                    textAlign: 'center',
                                    padding: '12px 6px',
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(15, 23, 42, 0.4))',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    userSelect: 'none'
                                }}
                                onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.6)'}
                                onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.2)'}
                            >
                                <h2 style={{ fontSize: '0.8rem', color: isReturnMode || netTotal < 0 ? '#ef4444' : 'var(--text-secondary)', marginBottom: '2px', letterSpacing: '1px', fontWeight: 'bold', pointerEvents: 'none' }}>
                                    {netTotal < 0 ? 'REFUND DUE' : 'GRAND TOTAL'}
                                </h2>
                                <div style={{ fontSize: '2.2rem', fontWeight: '900', color: netTotal < 0 ? '#ef4444' : 'var(--primary)', letterSpacing: '-1px', lineHeight: '1', pointerEvents: 'none' }}>
                                    {Math.abs(netTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>

                            {/* MIDDLE SECTION - STATIC */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                    <button
                                        onClick={() => setPaymentMode('Cash')}
                                        className={paymentMode === 'Cash' ? 'btn-primary' : 'btn-secondary'}
                                        style={{ height: '36px', fontSize: '0.7rem', gap: '4px', padding: '0 4px' }}
                                    ><Wallet size={12} /> Cash</button>
                                    <button
                                        onClick={() => setPaymentMode('Card')}
                                        className={paymentMode === 'Card' ? 'btn-primary' : 'btn-secondary'}
                                        style={{ height: '36px', fontSize: '0.7rem', gap: '4px', padding: '0 4px', whiteSpace: 'nowrap' }}
                                    ><CreditCard size={12} /> Card</button>
                                    <button
                                        onClick={() => setPaymentMode('Credit')}
                                        className={paymentMode === 'Credit' ? 'btn-primary' : 'btn-secondary'}
                                        style={{ height: '36px', fontSize: '0.7rem', gap: '4px', padding: '0 4px' }}
                                    ><User size={12} /> Credit</button>
                                </div>

                                {/* Selected Customer Info Mini Card */}
                                <div style={{
                                    padding: '8px 12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {!selectedCustomer.id ? (
                                            <input
                                                type="text"
                                                value={selectedCustomer.name}
                                                onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                                                placeholder="Customer Name"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderBottom: '1px dashed rgba(255,255,255,0.2)',
                                                    color: 'white',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    width: '100%',
                                                    outline: 'none',
                                                    padding: '2px 0'
                                                }}
                                                onClick={(e) => {
                                                    if (selectedCustomer.name === 'Walk-in Customer') {
                                                        setSelectedCustomer({ ...selectedCustomer, name: '' });
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981' }}>
                                                {selectedCustomer.name}
                                            </span>
                                        )}
                                        {selectedCustomer.id && (
                                            <button
                                                onClick={() => setSelectedCustomer({ id: null, name: 'Walk-in Customer' })}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {selectedCustomer.id && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                            <span>Limit: {selectedCustomer.credit_limit || 0}</span>
                                            <span style={{ color: (selectedCustomer.current_balance + netTotal) > (selectedCustomer.credit_limit || 0) ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                                Avail: {((selectedCustomer.credit_limit || 0) - (selectedCustomer.current_balance || 0) - (paymentMode === 'Credit' ? netTotal : 0)).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {selectedCustomer.id && selectedCustomer.expiry_date && (
                                        <div style={{ fontSize: '0.65rem', color: new Date(selectedCustomer.expiry_date) < new Date() ? '#ef4444' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={10} /> Exp: {new Date(selectedCustomer.expiry_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                    <div style={{ flex: '0 0 60%', position: 'relative' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px', display: 'block' }}>Received Cash</label>
                                        <span style={{ position: 'absolute', left: '10px', top: '22px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem' }}>Rs</span>
                                        <input
                                            type="number"
                                            className="input-field"
                                            style={{ paddingLeft: '32px', fontSize: '1.1rem', fontWeight: 'bold', height: '36px' }}
                                            value={receivedCash || ''}
                                            onFocus={e => e.target.select()}
                                            onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setReceivedCash(val);
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: '1', position: 'relative' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px', display: 'block' }}>Invoice Discount</label>
                                        <span style={{ position: 'absolute', left: '10px', top: '22px', color: '#f87171', fontWeight: 'bold', fontSize: '0.8rem' }}>-Rs</span>
                                        <input
                                            type="number"
                                            className="input-field"
                                            style={{ paddingLeft: '34px', fontSize: '1.1rem', fontWeight: 'bold', height: '36px', color: '#f87171' }}
                                            value={invoiceDiscount || ''}
                                            onFocus={e => e.target.select()}
                                            onChange={e => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>

                                {/* Currency Note Shortcuts */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                                    {[10, 20, 50, 100, 500, 1000, 5000].map(note => (
                                        <button
                                            key={note}
                                            onClick={() => setReceivedCash(prev => (prev || 0) + note)}
                                            style={{
                                                padding: '4px 2px',
                                                fontSize: '0.65rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '4px',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                        >
                                            +{note}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setReceivedCash(0)}
                                        style={{ padding: '4px 2px', fontSize: '0.65rem', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '4px', color: '#f87171', cursor: 'pointer' }}
                                    >Clr</button>
                                </div>

                                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Gross</span>
                                        <span>Rs. {grossTotal.toFixed(2)}</span>
                                    </div>
                                    {invoiceDiscount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Inv. Disc</span>
                                            <span style={{ color: '#f87171' }}>-Rs. {invoiceDiscount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Adj</span>
                                        <span style={{ color: adjustment < 0 ? '#f87171' : '#34d399' }}>{adjustment < 0 ? '-' : '+'}Rs. {Math.abs(adjustment).toFixed(2)}</span>
                                    </div>
                                    <div style={{ height: '1px', background: 'var(--border)', margin: '6px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{netTotal < 0 ? 'Refund' : (changeAmount > 0 ? 'Change' : 'Net Total')}</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: netTotal < 0 ? '#ef4444' : '#34d399' }}>Rs. {(changeAmount > 0 ? changeAmount : Math.abs(netTotal)).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* FIXED FOOTER: COMPLETE SALE BUTTON */}
                            <button
                                className="btn-primary"
                                disabled={processing || cart.length === 0}
                                style={{
                                    width: '100%',
                                    height: '56px',
                                    flexShrink: 0,
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    fontWeight: '900',
                                    borderRadius: '14px',
                                    boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)',
                                    background: netTotal < 0 ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: (processing || cart.length === 0) ? 'not-allowed' : 'pointer'
                                }}
                                onClick={handleCheckout}
                            >
                                {processing ? <div className="spinner"></div> : (netTotal < 0 ? <RotateCcw size={24} /> : <CheckCircle size={24} />)}
                                {netTotal < 0 ? 'REFUND / REVERSE' : 'COMPLETE SALE'}
                            </button>
                        </div>

                    </div>
                </div>

                {/* --- MODALS --- */}
                <ProductLookupModal
                    isOpen={showHelp}
                    onClose={() => setShowHelp(false)}
                    onSelect={(m, b, q) => addToCart(m, b, q, true)}
                    products={medicines}
                    inventoryMethod={appSettings.sale_module || 'Default'}
                />

                <CustomerLookupModal
                    isOpen={showCustomerLookup}
                    onClose={() => setShowCustomerLookup(false)}
                    onSelect={(customer) => {
                        setSelectedCustomer(customer);
                        setShowCustomerLookup(false);
                    }}
                    customers={customers}
                />


                {
                    showAdjustmentModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
                        }}>
                            <div className="glass-card" style={{ width: '400px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0 }}>Adjustment (F9)</h3>
                                    <button onClick={() => setShowAdjustmentModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="input-group">
                                    <label>Discount/Adjustment Percentage</label>
                                    <input
                                        type="number" className="input-field"
                                        value={adjPercent || ''}
                                        onFocus={e => e.target.select()}
                                        onChange={e => {
                                            const p = parseFloat(e.target.value) || 0;
                                            setAdjPercent(p);
                                            setAdjustment(-(grossTotal * (p / 100)));
                                        }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Custom Value Adjustment (+/-)</label>
                                    <input
                                        type="number" className="input-field"
                                        value={adjustment || ''}
                                        onFocus={e => e.target.select()}
                                        onChange={e => setAdjustment(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <button
                                    className="btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={() => setShowAdjustmentModal(false)}
                                >Apply Adjustment</button>
                            </div>
                        </div>
                    )
                }

                {
                    showInvoiceHistory && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2500
                        }}>
                            <div className="glass-card" style={{ width: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <button
                                            onClick={() => setHistoryTab('Final')}
                                            style={{
                                                padding: '8px 16px', background: historyTab === 'Final' ? 'var(--primary)' : 'transparent',
                                                border: '1px solid var(--border)', borderRadius: '8px', color: 'white', cursor: 'pointer'
                                            }}
                                        >Final Invoices</button>
                                        <button
                                            onClick={() => setHistoryTab('Held')}
                                            style={{
                                                padding: '8px 16px', background: historyTab === 'Held' ? 'var(--primary)' : 'transparent',
                                                border: '1px solid var(--border)', borderRadius: '8px', color: 'white', cursor: 'pointer'
                                            }}
                                        >Held Bills ({heldInvoices.length})</button>
                                    </div>
                                    <button onClick={() => setShowInvoiceHistory(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                                        <X size={24} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                                    <Filter size={16} /> <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Filter:</span>
                                    <input type="date" className="input-field" style={{ width: '140px' }} value={dateFilter.start} onChange={e => setDateFilter(p => ({ ...p, start: e.target.value }))} />
                                    <span>to</span>
                                    <input type="date" className="input-field" style={{ width: '140px' }} value={dateFilter.end} onChange={e => setDateFilter(p => ({ ...p, end: e.target.value }))} />
                                    <button onClick={fetchInvoices} className="btn-secondary" style={{ padding: '4px 12px' }}>Apply</button>
                                    {(dateFilter.start || dateFilter.end) && (
                                        <button onClick={() => setDateFilter({ start: '', end: '' })} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>Clear</button>
                                    )}
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255, 0.1)' }}>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>#</th>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>Items</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(historyTab === 'Final' ? recentInvoices : heldInvoices).map(inv => (
                                                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '12px' }}>{inv.invoice_number}</td>
                                                    <td style={{ padding: '12px' }}>{new Date(inv.created_at).toLocaleString()}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{inv.items.length}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Rs. {inv.net_total.toFixed(2)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                                        {historyTab === 'Final' ? (
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                                <button onClick={() => printReceipt(inv)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}><Printer size={14} /> Print</button>
                                                                <button onClick={() => handleReturnLoad(inv)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }} title="Perform Return"><RotateCcw size={14} /> Return</button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => {
                                                                const idx = heldInvoices.findIndex(h => h.id === inv.id);
                                                                if (idx !== -1) {
                                                                    loadDeckItem(idx);
                                                                    setShowInvoiceHistory(false);
                                                                }
                                                            }} className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}><PlayCircle size={14} /> Load</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(historyTab === 'Final' ? recentInvoices : heldInvoices).length === 0 && (
                                                <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No {historyTab.toLowerCase()} invoices found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Success / Receipt Modal */}
                {
                    showReceiptModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2500
                        }}>
                            <div className="glass-card" style={{ width: '400px', textAlign: 'center', padding: '40px' }}>
                                <div style={{ width: '60px', height: '60px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <Check size={32} color="white" />
                                </div>
                                <h2 style={{ marginBottom: '10px' }}>Transaction Complete!</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                                    Invoice #{lastInvoice?.invoice_number} generated successfully.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ height: '50px', fontSize: '1.1rem' }}
                                        onClick={() => {
                                            printReceipt();
                                            setShowReceiptModal(false);
                                        }}
                                    >
                                        <Printer size={20} /> Print Receipt
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        style={{ height: '50px' }}
                                        onClick={() => setShowReceiptModal(false)}
                                    >
                                        <ArrowRight size={20} /> New Sale
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Cash Register Modals */}
                <CashRegisterOpenModal
                    isOpen={showOpenRegister}
                    onClose={() => setShowOpenRegister(false)}
                    onSuccess={(session) => {
                        setActiveSession(session);
                        setShowOpenRegister(false);
                    }}
                    tenantId={tenantId}
                />

                <CashRegisterCloseModal
                    isOpen={showCloseRegister}
                    onClose={() => setShowCloseRegister(false)}
                    onSuccess={() => {
                        setActiveSession(null);
                        setShowCloseRegister(false);
                    }}
                    session={activeSession}
                    tenantId={tenantId}
                />

                <CashMovementModal
                    isOpen={showCashMovement}
                    onClose={() => setShowCashMovement(false)}
                    onSuccess={() => {
                        setShowCashMovement(false);
                        fetchActiveSession();
                    }}
                    activeSession={activeSession}
                    tenantId={tenantId}
                />
                <CashRegisterStatusModal
                    isOpen={showRegisterStatus}
                    onClose={() => setShowRegisterStatus(false)}
                    session={activeSession}
                />
                <style>{`
                .stat-card-mini {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    padding: 4px 10px;
                    display: flex;
                    flex-direction: column;
                    min-width: 100px;
                }
                .stat-card-mini label {
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    color: #94a3b8;
                    margin-bottom: 0px;
                    font-weight: bold;
                }
                .stat-card-mini value {
                    font-size: 0.95rem;
                    font-weight: 800;
                    font-family: 'JetBrains Mono', monospace;
                }
            `}</style>
            </div>
        </>
    );
};

export default POS;

