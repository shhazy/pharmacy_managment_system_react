import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, ShoppingCart, Trash2, Plus, Minus, X, Check, AlertCircle,
    User, Receipt, Banknote, Tag, Info, List as ListIcon, ShieldCheck,
    ChevronDown, CreditCard, Wallet, RotateCcw, Save, Printer, Key,
    Package, ArrowRight, Settings, PauseCircle, PlayCircle, Calendar, Filter
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { showSuccess, showError, showInfo } from '../utils/toast';

const POS = ({ tenantId }) => {
    // --- STATE ---
    const [medicines, setMedicines] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState(false);

    // Help Window (F3) & Search states
    const [showHelp, setShowHelp] = useState(false);
    const [helpSearch, setHelpSearch] = useState('');
    const [helpQty, setHelpQty] = useState(1);

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

    const [activeHeldBillId, setActiveHeldBillId] = useState(null);
    const [currentDeckIndex, setCurrentDeckIndex] = useState(-1); // -1 = New Sale, 0 = Latest Hold

    // Refs
    const searchInputRef = useRef(null);
    const helpSearchRef = useRef(null);

    // --- EFFECTS ---
    useEffect(() => {
        fetchInventory();
        fetchSettings();
        // Load config from local storage if exists
        const savedConfig = localStorage.getItem('pos_config');
        if (savedConfig) setConfig(JSON.parse(savedConfig));
        fetchHeldInvoices();
    }, [tenantId]);

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
            }
        } catch (e) { console.error("Failed to fetch inventory", e); }
    };

    const fetchHeldInvoices = async () => {
        try {
            const heldRes = await fetch(`${API_BASE_URL}/invoices?status=Hold`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (heldRes.ok) {
                const data = await heldRes.json();
                setHeldInvoices(data); // data is already ordered desc
            }
        } catch (e) { console.error("Failed to fetch held invoices"); }
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
            const loadedCart = inv.items.map(item => ({
                productId: item.medicine_id || item.product_id,
                name: item.product?.product_name || item.name || 'Unknown Item',
                batchId: item.batch_id,
                batchNo: 'Held',
                qty: item.quantity,
                unitType: 'Single',
                baseRate: item.unit_price,
                factor: 1,
                uDist: item.total_price < (item.unit_price * item.quantity) ? ((1 - (item.total_price / (item.unit_price * item.quantity))) * 100) : 0,
                // Approx discount percent reconstruction
                control_drug: false
            }));
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
            if (res.ok) {
                const data = await res.json();
                setRecentInvoices(data.filter(i => i.status !== 'Hold'));
            }

            // Fetch Held Invoices
            const heldRes = await fetch(`${API_BASE_URL}/invoices?status=Hold`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (heldRes.ok) setHeldInvoices(await heldRes.json());
        } catch (e) { console.error("Failed to fetch invoices"); }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'X-Tenant-ID': tenantId }
            });
            if (res.ok) setSettings(await res.json());
        } catch (e) { console.error("Failed to load settings"); }
    };

    // --- LOGIC ---
    const addToCart = useCallback((med, batch, requestedQty = 1, stayOpen = false) => {
        // Check for Control Drug
        if (med.control_drug) {
            showInfo("⚠️ PRESCRIBED MEDICINE: Please verify doctor's prescription before sale.");
            if (config.controlTrackMode === 'Lock') {
                // Implement locking logic if needed
            }
        }

        const batchId = batch.inventory_id || batch.id;
        const existing = cart.find(c => c.batchId === batchId && c.unitType === config.defaultSaleUnit);

        const conversionFactor = med.purchase_conv_factor || 1;
        const stockAvailable = batch.quantity || 0;

        if (existing) {
            const newQty = existing.qty + requestedQty;
            const unitsNeeded = existing.unitType === 'Pack' ? newQty * conversionFactor : newQty;

            if (unitsNeeded > stockAvailable) {
                showError(`Insufficient Stock! Only ${stockAvailable} units available.`);
                return;
            }

            setCart(cart.map(c =>
                (c.batchId === batchId && c.unitType === existing.unitType)
                    ? { ...c, qty: newQty }
                    : c
            ));
        } else {
            const unitsNeeded = config.defaultSaleUnit === 'Pack' ? requestedQty * conversionFactor : requestedQty;
            if (unitsNeeded > stockAvailable) {
                showError(`Insufficient Stock! Only ${stockAvailable} units available.`);
                return;
            }

            setCart([...cart, {
                productId: med.id,
                name: med.product_name,
                batchId: batchId,
                batchNo: batch.batch_number,
                qty: requestedQty,
                unitType: config.defaultSaleUnit, // Default from config
                baseRate: batch.selling_price || batch.sale_price, // Rate per SINGLE unit
                factor: conversionFactor,
                uDist: 0,
                control_drug: med.control_drug
            }]);
        }
        setSearchTerm('');
        if (!stayOpen) {
            setShowHelp(false);
            if (searchInputRef.current) searchInputRef.current.focus();
        }
        else if (helpSearchRef.current) helpSearchRef.current.focus();
        setHelpQty(1); // Reset qty for next product load
    }, [cart, config.defaultSaleUnit, config.controlTrackMode, setHelpQty, setShowHelp]);

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
        const returnCart = invoice.items.map(item => ({
            productId: item.medicine_id || item.product_id,
            name: item.product?.product_name || item.name || 'Unknown Item',
            batchId: item.batch_id,
            batchNo: item.batch_id, // We don't have the string easily, using ID or placeholder
            qty: -1 * Math.abs(item.quantity), // Force negative
            unitType: 'Single',
            baseRate: item.unit_price,
            factor: 1,
            uDist: 0, // Reset discount for simplicity or calculate relative
            control_drug: false,
            isReturn: true
        }));
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
        if (config.discountMode === 'Percent') {
            discount = subtotal * (item.uDist / 100);
        } else {
            discount = item.qty * item.uDist;
        }
        // Result: -100 subtotal, 10% disc = -10. Net: -100 - (-10) = -90. 
        // This means we refund 90. Correct.
        return subtotal - discount;
    };

    const grossTotal = cart.reduce((acc, item) => acc + calculateItemTotal(item), 0);
    const netTotal = grossTotal + parseFloat(adjustment || 0); // Allow negative net total
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
                    discount_percent: config.discountMode === 'Percent' ? c.uDist : 0,
                    discount_amount: config.discountMode === 'Value' ? c.uDist * c.qty : 0
                })),
                payment_method: "Hold",
                discount_amount: Math.abs(adjustment < 0 ? adjustment : 0),
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
                    discount_percent: config.discountMode === 'Percent' ? c.uDist : 0,
                    discount_amount: config.discountMode === 'Value' ? c.uDist * c.qty : 0
                })),
                payment_method: paymentMode,
                discount_amount: Math.abs(adjustment < 0 ? adjustment : 0),
                adjustment: adjustment,
                status: isReturn ? "Return" : "Paid"
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
                const inv = await res.json();
                setLastInvoice({ ...inv, items: cart, receivedCash: receivedCash, changeAmount: changeAmount }); // Store details for print
                setCart([]);
                setAdjustment(0);
                setActiveHeldBillId(null);
                setCurrentDeckIndex(-1);
                fetchHeldInvoices(); // Refresh deck
                setReceivedCash(0);
                setShowReceiptModal(true); // Show success modal instead of alert
                fetchInventory();
            } else {
                const err = await res.json();
                showError(err.detail || "Checkout failed");
            }
        } catch (e) { showError("Checkout failed"); }
        finally { setProcessing(false); }
    };

    const printReceipt = (invoice = lastInvoice) => {
        if (!invoice) return;

        const win = window.open('', '', 'width=400,height=600');
        const content = `
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; width: 72mm; margin: 0 auto; padding: 5px; font-size: 11px; color: black; }
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .bold { fontWeight: bold; }
                    .header { margin-bottom: 5px; }
                    .logo { max-width: 60%; max-height: 60px; margin-bottom: 5px; }
                    .divider { border-top: 1px dashed black; margin: 5px 0; }
                    .row { display: flex; justify-content: space-between; }
                    .table-header { font-weight: bold; border-bottom: 1px dashed black; padding-bottom: 2px; margin-bottom: 5px; }
                    .item-row { margin-bottom: 4px; }
                    .item-name { font-weight: bold; font-size: 12px; }
                    .item-details { font-size: 10px; display: flex; justify-content: space-between; padding-left: 10px; }
                    .footer { margin-top: 5px; }
                    .big-total { font-size: 16px; font-weight: bold; }
                    @media print {
                        body { width: 72mm; margin: 0 auto; }
                    }
                </style>
            </head>
            <body>
                <div class="header center">
                    ${settings.logo_url ? `<img src="${settings.logo_url}" class="logo" />` : ''}
                    <div style="font-size: 18px; font-weight: bold;">${settings.name || 'PHARMACY'}</div>
                    <div style="font-size: 10px;">${settings.tagline || ''}</div>
                    <div>${settings.address || ''}</div>
                    <div>Ph: ${settings.phone_no || ''} ${settings.license_no ? `Lic: ${settings.license_no}` : ''}</div>
                </div>

                <div class="divider"></div>
                
                <div class="row">
                    <span>Inv #: ${invoice.invoice_number || '---'}</span>
                    <span>POS No.: ${invoice.id || '---'}</span>
                </div>
                <!-- <div class="row">
                    <span>Cashier: Admin</span>
                    <span>${new Date().toLocaleString()}</span>
                </div> -->
                <div class="row">
                    <span>Date: ${new Date().toLocaleString()}</span>
                    ${invoice.status === 'Return' ? '<span style="font-weight:bold; color:black;">REFUND/RETURN</span>' : ''}
                </div>
                
                <div class="divider"></div>

                <div>
                    <div class="table-header row">
                        <span style="width: 5%">#</span>
                        <span style="flex: 1">Description</span>
                        <span style="width: 20%; text-align: right">Total</span>
                    </div>
                </div>

                ${invoice.items.map((item, i) => `
                    <div class="item-row">
                        <div class="item-name">${i + 1}. ${item.name || 'Item'}</div>
                        <div class="item-details">
                            <span>
                                ${item.baseRate || item.unit_price} x ${item.qty || item.quantity} 
                                ${item.unitType ? `(${item.unitType})` : ''}
                            </span>
                            <span>${(item.total_price || (item.baseRate * item.qty)).toFixed(2)}</span>
                        </div>
                    </div>
                `).join('')}

                <div class="divider"></div>

                <div class="footer">
                    <div class="row">
                        <span>Total Qty: ${invoice.items.reduce((s, i) => s + (i.qty || i.quantity), 0)}</span>
                        <span>Total Amount: ${invoice.sub_total || invoice.items.reduce((s, i) => s + (i.total_price || 0), 0).toFixed(2)}</span>
                    </div>
                    ${invoice.discount_amount > 0 ? `
                    <div class="row">
                        <span>Discount:</span>
                        <span>-${invoice.discount_amount}</span>
                    </div>` : ''}
                     ${invoice.tax_amount > 0 ? `
                    <div class="row">
                        <span>Sales Tax:</span>
                        <span>${invoice.tax_amount}</span>
                    </div>` : ''}
                    
                    <div class="divider"></div>
                    <div class="row big-total">
                        <span>${invoice.status === 'Return' || (invoice.net_total < 0) ? 'REFUND DUE:' : 'Payable:'}</span>
                        <span>PKR ${invoice.net_total || invoice.items.reduce((s, i) => s + (i.total_price || 0), 0).toFixed(2)}</span>
                    </div>
                    ${invoice.payment_method === 'Cash' && invoice.receivedCash > 0 ? `
                    <div class="row">
                        <span>Cash Received:</span>
                        <span>PKR ${invoice.receivedCash.toFixed(2)}</span>
                    </div>
                    <div class="row">
                        <span>Balance Change:</span>
                        <span>PKR ${invoice.changeAmount ? invoice.changeAmount.toFixed(2) : '0.00'}</span>
                    </div>
                    ` : ''}
                    <div class="divider"></div>
                </div>
                
                <div class="center" style="margin-top: 20px; font-size: 10px;">
                    Thank you for your visit!<br/>
                    Computer Software developed by EIGLOU The Tech Hut!
                </div>
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

    const filteredMedicines = (medicines || []).filter(m =>
        m.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.generic_name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    const helpFiltered = (medicines || []).filter(m =>
        m.product_name.toLowerCase().includes(helpSearch.toLowerCase()) ||
        m.generic_name.toLowerCase().includes(helpSearch.toLowerCase())
    );

    // --- RENDER HELPERS ---
    const HelpWindow = () => (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div className="glass-card" style={{ width: '90%', maxWidth: '900px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ListIcon /> Product Help Search (F3)
                    </h2>
                    <button onClick={() => setShowHelp(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} size={20} />
                        <input
                            ref={helpSearchRef}
                            autoFocus
                            placeholder="Type medicine or generic name..."
                            className="input-field"
                            style={{ paddingLeft: '44px' }}
                            value={helpSearch}
                            onChange={e => setHelpSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ width: '120px' }}>
                        <input
                            type="number"
                            placeholder="Qty"
                            className="input-field"
                            value={helpQty}
                            onChange={e => setHelpQty(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Product</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Generic</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Batch</th>
                                <th style={{ textAlign: 'center', padding: '12px' }}>Stock</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>Price</th>
                                <th style={{ textAlign: 'right', padding: '12px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {helpFiltered.map(m => (m.stock_inventory || []).map(b => (
                                <tr key={b.inventory_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: 600 }}>{m.product_name}</div>
                                        {m.control_drug && <span style={{ fontSize: '0.65rem', color: '#ef4444' }}>[Controlled]</span>}
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{m.generic_name}</td>
                                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>{b.batch_number}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{ color: b.quantity < 20 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{b.quantity}</span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Rs. {b.selling_price}</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                            onClick={() => addToCart(m, b, helpQty, true)}
                                        >
                                            Load Item
                                        </button>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: '20px',
            flex: 1,
            minHeight: 0,
            color: 'var(--text-primary)',
            overflow: 'hidden' // Force the whole POS layout to stay in viewport
        }}>
            {/* --- LEFT SIDE: CART & SEARCH --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
                {/* Search Bar Area */}
                <div style={{ position: 'relative' }}>
                    <div className="glass-card" style={{ padding: '8px 12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            <Tag size={16} /> SCAN
                        </div>
                        <div style={{ width: '380px', position: 'relative' }}>
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
                                    borderRadius: '12px', marginTop: '8px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    overflow: 'hidden'
                                }}>
                                    {filteredMedicines.map(m => (m.stock_inventory || []).filter(b => b.quantity > 0).map(b => (
                                        <div
                                            key={`${m.id}-${b.inventory_id}`}
                                            style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}
                                            onClick={() => addToCart(m, b)}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{m.product_name} - {b.batch_number}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.generic_name}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Rs. {b.selling_price}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{b.quantity} in stock</div>
                                            </div>
                                        </div>
                                    )))}
                                    {filteredMedicines.length === 0 && <div style={{ padding: '20px', textAlign: 'center' }}>No matches</div>}
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }} />

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '120px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold', letterSpacing: '0.5px' }}>DISCOUNT MODE</div>
                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)' }}>
                                    <button
                                        onClick={() => {
                                            setConfig(p => {
                                                const next = { ...p, discountMode: 'Percent' };
                                                localStorage.setItem('pos_config', JSON.stringify(next));
                                                return next;
                                            });
                                        }}
                                        style={{
                                            flex: 1, padding: '6px 0', fontSize: '0.75rem', borderRadius: '6px', border: 'none',
                                            background: config.discountMode === 'Percent' ? 'var(--primary)' : 'transparent',
                                            color: 'white', cursor: 'pointer', transition: 'all 0.3s', fontWeight: config.discountMode === 'Percent' ? 'bold' : 'normal'
                                        }}
                                    >%</button>
                                    <button
                                        onClick={() => {
                                            setConfig(p => {
                                                const next = { ...p, discountMode: 'Value' };
                                                localStorage.setItem('pos_config', JSON.stringify(next));
                                                return next;
                                            });
                                        }}
                                        style={{
                                            flex: 1, padding: '6px 0', fontSize: '0.75rem', borderRadius: '6px', border: 'none',
                                            background: config.discountMode === 'Value' ? 'var(--primary)' : 'transparent',
                                            color: 'white', cursor: 'pointer', transition: 'all 0.3s', fontWeight: config.discountMode === 'Value' ? 'bold' : 'normal'
                                        }}
                                    >Fixed</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '120px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 'bold', letterSpacing: '0.5px' }}>DEFAULT UNIT</div>
                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)' }}>
                                    <button
                                        onClick={() => {
                                            setConfig(p => {
                                                const next = { ...p, defaultSaleUnit: 'Single' };
                                                localStorage.setItem('pos_config', JSON.stringify(next));
                                                return next;
                                            });
                                        }}
                                        style={{
                                            flex: 1, padding: '6px 0', fontSize: '0.75rem', borderRadius: '6px', border: 'none',
                                            background: config.defaultSaleUnit === 'Single' ? 'var(--primary)' : 'transparent',
                                            color: 'white', cursor: 'pointer', transition: 'all 0.3s', fontWeight: config.defaultSaleUnit === 'Single' ? 'bold' : 'normal'
                                        }}
                                    >Single</button>
                                    <button
                                        onClick={() => {
                                            setConfig(p => {
                                                const next = { ...p, defaultSaleUnit: 'Pack' };
                                                localStorage.setItem('pos_config', JSON.stringify(next));
                                                return next;
                                            });
                                        }}
                                        style={{
                                            flex: 1, padding: '6px 0', fontSize: '0.75rem', borderRadius: '6px', border: 'none',
                                            background: config.defaultSaleUnit === 'Pack' ? 'var(--primary)' : 'transparent',
                                            color: 'white', cursor: 'pointer', transition: 'all 0.3s', fontWeight: config.defaultSaleUnit === 'Pack' ? 'bold' : 'normal'
                                        }}
                                    >Pack</button>
                                </div>
                            </div>
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
                <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(5px)', zIndex: 10 }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', width: '40px', fontSize: '0.85rem' }}>#</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem' }}>Product Details</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '100px', fontSize: '0.85rem' }}>Unit</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '90px', fontSize: '0.85rem' }}>Rate</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '90px', fontSize: '0.85rem' }}>Qty</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '100px', fontSize: '0.85rem' }}>{config.discountMode === 'Percent' ? 'Disc %' : 'Disc Rs'}</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', width: '100px', fontSize: '0.85rem' }}>Total</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', width: '50px', fontSize: '0.85rem' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item, index) => (
                                    <tr key={`${item.batchId}-${item.unitType}`} style={{ borderBottom: '1px solid var(--border)' }} className="fade-in">
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
                                                    padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border)',
                                                    background: item.unitType === 'Pack' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    color: 'white', cursor: item.factor > 1 ? 'pointer' : 'default', fontSize: '0.75rem', fontWeight: 'bold'
                                                }}
                                            >
                                                {item.unitType} {item.factor > 1 && `(x${item.factor})`}
                                            </button>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>
                                            Rs. {(item.unitType === 'Pack' ? item.baseRate * item.factor : item.baseRate).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <button onClick={() => updateCartItem(item.batchId, item.unitType, 'qty', Math.max(1, item.qty - 1))} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'white', cursor: 'pointer' }}>-</button>
                                                <span style={{ fontWeight: 'bold', minWidth: '20px' }}>{item.qty}</span>
                                                <button onClick={() => updateCartItem(item.batchId, item.unitType, 'qty', item.qty + 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'white', cursor: 'pointer' }}>+</button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <input
                                                type="number"
                                                className="input-field"
                                                style={{ textAlign: 'center', padding: '4px', height: '32px' }}
                                                value={item.uDist}
                                                onChange={e => updateCartItem(item.batchId, item.unitType, 'uDist', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: 'var(--primary)' }}>
                                            Rs. {calculateItemTotal(item).toFixed(2)}
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
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Items: <span style={{ color: 'white', fontWeight: 'bold' }}>{cart.length}</span></div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Units: <span style={{ color: 'white', fontWeight: 'bold' }}>{cart.reduce((a, b) => a + b.qty, 0)}</span></div>
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

                            <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => setCart([])}><RotateCcw size={14} /> Clear</button>
                            <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => setShowAdjustmentModal(true)}><Settings size={14} /> Adj</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT SIDE: BILL SUMMARY --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
                <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', gap: '10px', justifyContent: 'space-between', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>RECEIPT #</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{`R-${Math.floor(Date.now() / 1000000)}`}</div>
                        </div>
                        <button
                            onClick={() => { setShowInvoiceHistory(true); setHistoryTab('Final'); fetchInvoices(); }}
                            style={{
                                padding: '8px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                textAlign: 'center',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: 'white'
                            }}>
                            <Receipt size={14} color="var(--primary)" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>History</span>
                        </button>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        padding: '12px 6px',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(15, 23, 42, 0.4))',
                        borderRadius: '12px',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}>
                        <h2 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '2px', letterSpacing: '1px' }}>GRAND TOTAL</h2>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-1px', lineHeight: '1' }}>
                            <span style={{ fontSize: '1rem', verticalAlign: 'top', marginRight: '4px' }}>Rs.</span>
                            {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button
                                onClick={() => setPaymentMode('Cash')}
                                className={paymentMode === 'Cash' ? 'btn-primary' : 'btn-secondary'}
                                style={{ height: '36px', fontSize: '0.8rem', gap: '6px' }}
                            ><Wallet size={12} /> Cash</button>
                            <button
                                onClick={() => setPaymentMode('Card')}
                                className={paymentMode === 'Card' ? 'btn-primary' : 'btn-secondary'}
                                style={{ height: '36px', fontSize: '0.8rem', gap: '6px' }}
                            ><CreditCard size={12} /> Card</button>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px', display: 'block' }}>Received Cash</label>
                            <span style={{ position: 'absolute', left: '10px', top: '22px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem' }}>Rs</span>
                            <input
                                type="number"
                                className="input-field"
                                style={{ paddingLeft: '32px', fontSize: '1.2rem', fontWeight: 'bold', height: '40px' }}
                                value={receivedCash}
                                onChange={e => setReceivedCash(parseFloat(e.target.value) || 0)}
                            />
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Adj</span>
                                <span style={{ color: adjustment < 0 ? '#f87171' : '#34d399' }}>{adjustment < 0 ? '-' : '+'}Rs. {Math.abs(adjustment).toFixed(2)}</span>
                            </div>
                            <div style={{ height: '1px', background: 'var(--border)', margin: '6px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Balance/Change</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399' }}>Rs. {changeAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <button
                            className="btn-secondary"
                            style={{ flex: 1, height: '36px', fontSize: '0.75rem', gap: '6px' }}
                            onClick={() => handleHoldBill()}
                            disabled={cart.length === 0}
                        >
                            <PauseCircle size={12} /> {activeHeldBillId ? 'Update' : 'Hold'}
                        </button>
                        <button
                            className="btn-secondary"
                            style={{ flex: 1, height: '36px', fontSize: '0.75rem', gap: '6px' }}
                            onClick={() => setShowAdjustmentModal(true)}
                        >
                            <Settings size={12} /> Adjustment
                        </button>
                    </div>

                    <button
                        className="btn-primary"
                        style={{
                            width: '100%',
                            height: '56px',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                        }}
                        disabled={cart.length === 0 || (paymentMode === 'Cash' && receivedCash < netTotal - 0.01)}
                        onClick={handleCheckout}
                    >
                        {processing ? 'Processing...' : (
                            <>
                                <Check size={24} /> FINALIZE BILL
                            </>
                        )}
                    </button>
                </div>

            </div>

            {/* --- MODALS --- */}
            {showHelp && <HelpWindow />}

            {showAdjustmentModal && (
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
                                value={adjPercent}
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
                                value={adjustment}
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
            )}

            {showInvoiceHistory && (
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
            )}

            {/* Success / Receipt Modal */}
            {showReceiptModal && (
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
            )}
        </div>
    );
};

export default POS;
