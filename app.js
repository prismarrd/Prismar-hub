document.addEventListener('DOMContentLoaded', () => {
    // --- Security & Login ---
    const loginScreen = document.getElementById('login-screen');
    const formLogin = document.getElementById('form-login');
    const loginError = document.getElementById('login-error');

    if(sessionStorage.getItem('prismar_auth') === 'true') {
        if(loginScreen) loginScreen.classList.add('hidden');
    }

    if(formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const pin = document.getElementById('login-pin').value;
            if (pin === '1290') {
                sessionStorage.setItem('prismar_auth', 'true');
                loginScreen.classList.add('hidden');
                initDashboard(); // Refrescar por si acaso
            } else {
                loginError.style.display = 'block';
                document.getElementById('login-pin').value = '';
                setTimeout(() => loginError.style.display = 'none', 3000);
            }
        });
    }

    // --- UI State Management ---
    const sidebar = document.getElementById('sidebar');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');

    if(btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }

    if(btnCloseSidebar) {
        btnCloseSidebar.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // --- Simple SPA Router ---
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    function switchView(viewId) {
        // Update Nav Active State
        navItems.forEach(nav => {
            if (nav.dataset.view === viewId) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        // Toggle View Sections
        viewSections.forEach(section => {
            if (section.id === `view-${viewId}`) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Call view-specific init functions
        if (viewId === 'dashboard') {
            initDashboard();
        } else if (viewId === 'products') {
            initProductsView();
        } else if (viewId === 'purchases') {
            initPurchasesView();
        }
        
        // Close sidebar on mobile after navigating
        if(window.innerWidth <= 768 && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    }

    navItems.forEach(nav => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = nav.dataset.view;
            if(viewId) switchView(viewId);
        });
    });

    // --- Dashboard & Product Charts ---
    let dashboardChartInstance = null;
    let prodSalesChartInstance = null;
    let prodExpensesChartInstance = null;

    function initDashboard() {
        // Initialize Chart
        const ctx = document.getElementById('dashSalesChart');
        if (ctx) {
            if(dashboardChartInstance) dashboardChartInstance.destroy();
            
            // Dummy data for now
            dashboardChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                    datasets: [{
                        label: 'Ventas (RD$)',
                        data: [1200, 1900, 3000, 500, 2000, 3000, 4500],
                        backgroundColor: '#2563EB',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#374151' } },
                        x: { grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    }

    // --- Modal Tabs ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // --- Modal Management ---
    const modalProduct = document.getElementById('modal-product');
    const btnNewProduct = document.getElementById('btn-new-product');
    const btnCloseProductModal = document.getElementById('btn-close-product-modal');
    const formProduct = document.getElementById('form-product');

    function resetModalTabs() {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        tabBtns[0].classList.add('active');
        tabContents[0].classList.add('active');
    }

    // --- Dirty-form tracking ---
    let _formDirty = false;

    function markFormClean() { _formDirty = false; }
    function markFormDirty() { _formDirty = true; }

    // Listen to any input/change inside the product form,
    // but IGNORE the bundle selector (it has its own handler that manages state)
    formProduct.addEventListener('input', markFormDirty);
    formProduct.addEventListener('change', (e) => {
        if (e.target.id === 'prod-bundle') return; // handled separately
        markFormDirty();
    });

    function openProductModal() {
        formProduct.reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('modal-title').textContent = 'Registrar Producto';
        // Reset cost-structure map for a fresh product
        _costStructureMap = {};
        _lastBundle = document.getElementById('prod-bundle').value || '1';
        updateProductCalc();
        resetModalTabs();
        markFormClean();
        
        // Hide Super Header & Quick Actions for new products
        document.getElementById('super-header-container').style.display = 'none';
        document.getElementById('quick-actions-bar').style.display = 'none';
        
        // Hide Layaways, Sales, Expenses and Metrics UI for new products
        document.getElementById('metrics-container').style.display = 'none';
        document.getElementById('metrics-message').style.display = 'block';

        document.getElementById('btn-new-expense').style.display = 'block';
        document.getElementById('form-expense-container').style.display = 'none';
        document.getElementById('expenses-message').style.display = 'none';
        document.getElementById('expenses-dashboard').style.display = 'block';
        document.getElementById('expenses-table-container').style.display = 'block';

        document.getElementById('btn-new-layaway').style.display = 'block';
        document.getElementById('form-layaway-container').style.display = 'none';
        document.getElementById('layaway-message').style.display = 'none';
        document.getElementById('layaways-table-container').style.display = 'block';
        
        document.getElementById('btn-direct-sale').style.display = 'block';
        document.getElementById('sales-message').style.display = 'none';
        document.getElementById('sales-table-container').style.display = 'block';

        modalProduct.style.display = 'flex';
        void modalProduct.offsetWidth;
        modalProduct.classList.add('active');
    }

    function closeProductModal() {
        _formDirty = false;
        modalProduct.classList.remove('active');
        setTimeout(() => {
            modalProduct.style.display = 'none';
        }, 200);
    }

    async function requestCloseModal() {
        if (!_formDirty) {
            closeProductModal();
            return;
        }
        const { isConfirmed } = await Swal.fire({
            title: '¿Salir sin guardar?',
            text: 'Tienes cambios sin guardar. Si sales ahora se perderán.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Seguir editando'
        });
        if (isConfirmed) closeProductModal();
    }

    if(btnNewProduct) btnNewProduct.addEventListener('click', openProductModal);
    // X button uses requestCloseModal to ask confirmation if there are unsaved changes
    if(btnCloseProductModal) btnCloseProductModal.addEventListener('click', () => requestCloseModal());

    // Modal only closes via the X button — NO outside-click dismiss

    // --- Quick Create Dropdown ---
    const btnQuickCreate = document.getElementById('btn-quick-create');
    const quickCreateMenu = document.getElementById('quick-create-menu');
    const quickNewProduct = document.getElementById('quick-new-product');

    if(btnQuickCreate && quickCreateMenu) {
        btnQuickCreate.addEventListener('click', (e) => {
            e.stopPropagation();
            quickCreateMenu.classList.toggle('active');
        });

        // Close when clicking outside
        window.addEventListener('click', () => {
            if(quickCreateMenu.classList.contains('active')) {
                quickCreateMenu.classList.remove('active');
            }
        });
    }

    if(quickNewProduct) {
        quickNewProduct.addEventListener('click', () => {
            switchView('products');
            openProductModal();
        });
    }

    // --- Product Calculator Logic ---
    const calcInputs = document.querySelectorAll('.calc-input');
    
    function updateProductCalc() {
        const cost = parseFloat(document.getElementById('prod-cost').value) || 0;
        const price = parseFloat(document.getElementById('prod-price').value) || 0;
        const ads = parseFloat(document.getElementById('prod-ads').value) || 0;
        const pack = parseFloat(document.getElementById('prod-pack').value) || 0;
        const ship = parseFloat(document.getElementById('prod-ship').value) || 0;
        const comm = parseFloat(document.getElementById('prod-comm').value) || 0;
        const other = parseFloat(document.getElementById('prod-other').value) || 0;

        const totalCost = cost + ads + pack + ship + comm + other;
        const profit = price - totalCost;
        const margin = price > 0 ? (profit / price) * 100 : 0;
        const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        const mult = totalCost > 0 ? (price / totalCost) : 0;

        document.getElementById('res-total-cost').textContent = `RD$${Math.round(totalCost).toLocaleString()}`;
        document.getElementById('res-profit').textContent = `RD$${Math.round(profit).toLocaleString()}`;
        document.getElementById('res-profit').className = profit > 0 ? 'text-success' : 'text-danger';
        document.getElementById('res-margin').textContent = `${margin.toFixed(1)}%`;
        document.getElementById('res-roi').textContent = `${roi.toFixed(1)}% (x${mult.toFixed(2)})`;

        // Oferta Sugeridas
        const cost2x = (cost * 2) + ads + (pack * 1.2) + (ship * 2) + comm + other;
        const profit2x_target = profit > 0 ? profit * 1.5 : 500;
        const offer2x = Math.round(cost2x + profit2x_target);
        
        const cost3x = (cost * 3) + ads + (pack * 1.4) + (ship * 3) + comm + other;
        const profit3x_target = profit > 0 ? profit * 2.2 : 800;
        const offer3x = Math.round(cost3x + profit3x_target);

        document.getElementById('res-offer-2x').textContent = `RD$${offer2x.toLocaleString()}`;
        document.getElementById('res-offer-3x').textContent = `RD$${offer3x.toLocaleString()}`;
    }

    calcInputs.forEach(input => {
        input.addEventListener('input', updateProductCalc);
    });

    // --- Auto-generate SKU and Internal Code ---
    const inputName = document.getElementById('prod-name');
    const inputCategory = document.getElementById('prod-category');
    const inputBundle = document.getElementById('prod-bundle');
    const inputCode = document.getElementById('prod-code');
    const inputSku = document.getElementById('prod-sku');

    function autoGenerateCodes() {
        const nameVal = inputName.value;
        const catVal = inputCategory.value;
        const bundleVal = inputBundle.value;

        if(!nameVal) return;

        // Limpiar strings (quitar emojis, dejar letras)
        const catClean = catVal.replace(/[^a-zA-Z]/g, '');
        const catPrefix = catClean ? catClean.substring(0, 3).toUpperCase() : 'GEN';
        
        const namePrefix = nameVal.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
        
        let bundleSuffix = '';
        if (bundleVal === '2') bundleSuffix = '-2U';
        else if (bundleVal === '3') bundleSuffix = '-3U';
        else if (bundleVal === 'pack') bundleSuffix = '-PK';

        const genCode = `${catPrefix}-${namePrefix}${bundleSuffix}`;
        
        // Solo rellenar si están vacíos
        if (inputCode && inputCode.value === '') inputCode.value = genCode;
        if (inputSku && inputSku.value === '') inputSku.value = `SKU-${genCode}`;
    }

    if(inputName) inputName.addEventListener('blur', autoGenerateCodes);
    if(inputCategory) inputCategory.addEventListener('change', autoGenerateCodes);
    if(inputBundle) inputBundle.addEventListener('change', autoGenerateCodes);

    // --- Cost Structure per Presentation & Interconnected Combo Pricing ---
    let _costStructureMap = {};
    let _lastBundle = null;

    const COST_FIELD_IDS = ['prod-cost','prod-price','prod-ads','prod-pack','prod-ship','prod-comm','prod-other'];

    function getComboPriceForProduct(bundleKey, product) {
        bundleKey = String(bundleKey || '1');
        // 1. Check in-memory active _costStructureMap if present
        if (_costStructureMap && _costStructureMap[bundleKey] && typeof _costStructureMap[bundleKey].price === 'number' && _costStructureMap[bundleKey].price > 0) {
            return _costStructureMap[bundleKey].price;
        }
        // 2. Check product.costStructure if stored in DB
        if (product && product.costStructure && product.costStructure[bundleKey] && typeof product.costStructure[bundleKey].price === 'number' && product.costStructure[bundleKey].price > 0) {
            return product.costStructure[bundleKey].price;
        }
        // 3. Fallback: Base price or calculated combo offers
        const basePrice = (product ? product.price : parseFloat(document.getElementById('prod-price')?.value)) || 0;
        const baseCost = (product ? product.cost : parseFloat(document.getElementById('prod-cost')?.value)) || 0;
        const ads = (product ? product.ads : parseFloat(document.getElementById('prod-ads')?.value)) || 0;
        const pack = (product ? product.pack : parseFloat(document.getElementById('prod-pack')?.value)) || 0;
        const ship = (product ? product.ship : parseFloat(document.getElementById('prod-ship')?.value)) || 0;
        const comm = (product ? product.comm : parseFloat(document.getElementById('prod-comm')?.value)) || 0;
        const other = (product ? product.other : parseFloat(document.getElementById('prod-other')?.value)) || 0;

        if (bundleKey === '2') {
            const totalCost = baseCost + ads + pack + ship + comm + other;
            const profit = basePrice - totalCost;
            const cost2x = (baseCost * 2) + ads + (pack * 1.2) + (ship * 2) + comm + other;
            const profit2x_target = profit > 0 ? profit * 1.5 : 500;
            const offer2x = Math.round(cost2x + profit2x_target);
            return offer2x > 0 ? offer2x : (basePrice * 2);
        }
        if (bundleKey === '3') {
            const totalCost = baseCost + ads + pack + ship + comm + other;
            const profit = basePrice - totalCost;
            const cost3x = (baseCost * 3) + ads + (pack * 1.4) + (ship * 3) + comm + other;
            const profit3x_target = profit > 0 ? profit * 2.2 : 800;
            const offer3x = Math.round(cost3x + profit3x_target);
            return offer3x > 0 ? offer3x : (basePrice * 3);
        }
        return basePrice;
    }

    function syncComboPricing(selectedBundleKey, product, options = {}) {
        const { source = 'none', customPrice = null } = options;
        const bundleKey = String(selectedBundleKey || '1');
        const bundleQtyMap = { '1': 1, '2': 2, '3': 3, 'pack': 1 };
        const bundleSize = bundleQtyMap[bundleKey] || 1;

        // 1. Determine target price for this combo
        let targetPrice = customPrice;
        if (targetPrice === null || targetPrice === undefined || isNaN(targetPrice)) {
            targetPrice = getComboPriceForProduct(bundleKey, product);
        }

        // Update in-memory _costStructureMap for this bundleKey
        if (!_costStructureMap[bundleKey]) {
            _costStructureMap[bundleKey] = {
                cost: (product ? product.cost : parseFloat(document.getElementById('prod-cost')?.value)) || 0,
                price: targetPrice,
                ads: (product ? product.ads : parseFloat(document.getElementById('prod-ads')?.value)) || 0,
                pack: (product ? product.pack : parseFloat(document.getElementById('prod-pack')?.value)) || 0,
                ship: (product ? product.ship : parseFloat(document.getElementById('prod-ship')?.value)) || 0,
                comm: (product ? product.comm : parseFloat(document.getElementById('prod-comm')?.value)) || 0,
                other: (product ? product.other : parseFloat(document.getElementById('prod-other')?.value)) || 0
            };
        } else {
            _costStructureMap[bundleKey].price = targetPrice;
        }

        // 2. Sync Ajustes tab (prod-bundle and prod-price)
        const prodBundleSelect = document.getElementById('prod-bundle');
        const prodPriceInput = document.getElementById('prod-price');
        if (prodBundleSelect) {
            if (prodBundleSelect.value !== bundleKey && source !== 'ajustes') {
                prodBundleSelect.value = bundleKey;
                _lastBundle = bundleKey;
            }
            if (prodPriceInput && source !== 'ajustes-input') {
                prodPriceInput.value = targetPrice;
                if (typeof updateProductCalc === 'function') updateProductCalc();
            }
        }

        // 3. Sync Apartados tab (lay-qty and lay-total)
        const layQtySelect = document.getElementById('lay-qty');
        const layTotalInput = document.getElementById('lay-total');
        if (layQtySelect) {
            if (layQtySelect.value !== bundleKey && source !== 'apartados') {
                layQtySelect.value = bundleKey;
            }
            layQtySelect.dataset.bundleSize = bundleSize;
        }
        if (layTotalInput && source !== 'apartados-input') {
            layTotalInput.value = Math.round(targetPrice * 100) / 100;
        }

        // 4. Sync Ventas modal if open
        const swalBundleSelect = document.getElementById('swal-bundle');
        const swalPriceInput = document.getElementById('swal-price');
        if (swalBundleSelect && swalBundleSelect.value !== bundleKey && source !== 'ventas') {
            swalBundleSelect.value = bundleKey;
        }
        if (swalPriceInput && source !== 'ventas-input') {
            swalPriceInput.value = targetPrice;
        }

        return { price: targetPrice, bundleSize };
    }

    function readCostFieldsToMap(bundleKey) {
        if (!bundleKey) return;
        _costStructureMap[bundleKey] = {
            cost:  parseFloat(document.getElementById('prod-cost').value)  || 0,
            price: parseFloat(document.getElementById('prod-price').value) || 0,
            ads:   parseFloat(document.getElementById('prod-ads').value)   || 0,
            pack:  parseFloat(document.getElementById('prod-pack').value)  || 0,
            ship:  parseFloat(document.getElementById('prod-ship').value)  || 0,
            comm:  parseFloat(document.getElementById('prod-comm').value)  || 0,
            other: parseFloat(document.getElementById('prod-other').value) || 0,
        };
    }

    function writeCostFieldsFromMap(bundleKey) {
        let d = _costStructureMap[bundleKey];
        if (!d) {
            const defaultPrice = getComboPriceForProduct(bundleKey, null);
            d = {
                cost:  parseFloat(document.getElementById('prod-cost').value)  || 0,
                price: defaultPrice,
                ads:   parseFloat(document.getElementById('prod-ads').value)   || 0,
                pack:  parseFloat(document.getElementById('prod-pack').value)  || 0,
                ship:  parseFloat(document.getElementById('prod-ship').value)  || 0,
                comm:  parseFloat(document.getElementById('prod-comm').value)  || 0,
                other: parseFloat(document.getElementById('prod-other').value) || 0,
            };
            _costStructureMap[bundleKey] = d;
        }
        document.getElementById('prod-cost').value  = d.cost  || '';
        document.getElementById('prod-price').value = d.price || '';
        document.getElementById('prod-ads').value   = d.ads   || '';
        document.getElementById('prod-pack').value  = d.pack  || '';
        document.getElementById('prod-ship').value  = d.ship  || '';
        document.getElementById('prod-comm').value  = d.comm  || '';
        document.getElementById('prod-other').value = d.other || '';
        updateProductCalc();
    }

    COST_FIELD_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                if (_lastBundle !== null) {
                    readCostFieldsToMap(_lastBundle);
                    if (id === 'prod-price') {
                        const priceVal = parseFloat(el.value) || 0;
                        syncComboPricing(_lastBundle, null, { source: 'ajustes-input', customPrice: priceVal });
                    }
                }
            });
        }
    });

    if (inputBundle) {
        inputBundle.addEventListener('change', (e) => {
            e.stopPropagation();
            if (_lastBundle !== null) readCostFieldsToMap(_lastBundle);

            const newBundle = inputBundle.value;
            writeCostFieldsFromMap(newBundle);
            _lastBundle = newBundle;
            syncComboPricing(newBundle, null, { source: 'ajustes' });

            markFormDirty();
            autoGenerateCodes();
        });
        _lastBundle = inputBundle.value;
    }


    // --- Product Form Save (Ajustes) ---
    if(formProduct) {
        formProduct.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Require PIN C1290 to save settings changes
        const isEdit = !!document.getElementById('prod-id').value;
        if (isEdit) {
            const { value: pin } = await Swal.fire({
                title: 'Autorización Requerida',
                html: `<p style="color:#9CA3AF;margin-bottom:8px;">Introduce el PIN para guardar los cambios en Ajustes:</p>`,
                input: 'password',
                inputPlaceholder: 'PIN de Configuración',
                inputAttributes: { maxlength: 5 },
                showCancelButton: true,
                confirmButtonText: 'Verificar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#2563EB'
            });
            if (!pin) return;
            if (pin !== 'C1290') {
                Swal.fire({ icon: 'error', title: 'PIN incorrecto', text: 'El PIN de Configuración es incorrecto.', timer: 2000, showConfirmButton: false });
                return;
            }
        }

        // Save current presentation fields before submitting
        const currentBundle = document.getElementById('prod-bundle').value;
        readCostFieldsToMap(currentBundle);

        // The active presentation fields are what we persist
        const product = {
            name: document.getElementById('prod-name').value,
            bundle: currentBundle,
            category: document.getElementById('prod-category').value,
            supplier: document.getElementById('prod-supplier').value,
            sku: document.getElementById('prod-sku').value,
            code: document.getElementById('prod-code').value,
            stock: parseInt(document.getElementById('prod-stock').value) || 0,
            minStock: parseInt(document.getElementById('prod-min-stock').value) || 5,
            status: document.getElementById('prod-status').value,

            cost:  parseFloat(document.getElementById('prod-cost').value)  || 0,
            price: parseFloat(document.getElementById('prod-price').value) || 0,
            ads:   parseFloat(document.getElementById('prod-ads').value)   || 0,
            pack:  parseFloat(document.getElementById('prod-pack').value)  || 0,
            ship:  parseFloat(document.getElementById('prod-ship').value)  || 0,
            comm:  parseFloat(document.getElementById('prod-comm').value)  || 0,
            other: parseFloat(document.getElementById('prod-other').value) || 0,

            // Persist the full per-presentation map so it survives reloads
            costStructure: JSON.parse(JSON.stringify(_costStructureMap)),
            updatedAt: new Date().toISOString()
        };

        const id = document.getElementById('prod-id').value;
        try {
            if (id) {
                await db.products.update(parseInt(id), product);
                Swal.fire({icon: 'success', title: 'Actualizado', text: 'Producto actualizado exitosamente.', timer: 1500, showConfirmButton: false});
            } else {
                product.createdAt = new Date().toISOString();
                await db.products.add(product);
                Swal.fire({icon: 'success', title: 'Guardado', text: 'Producto creado exitosamente.', timer: 1500, showConfirmButton: false});
            }
            markFormClean();
            closeProductModal();
            loadProductsTable();
            initDashboard();
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar el producto', 'error');
            console.error(error);
        }
    });
    }

    async function loadProductsTable() {
        const tbody = document.getElementById('products-tbody');
        if(!tbody) return;
        
        let products = await db.products.toArray();

        // Sorting Logic
        const sortDropdown = document.getElementById('sort-products');
        const sortMode = sortDropdown ? sortDropdown.value : 'name';

        if (sortMode === 'profit' || sortMode === 'expenses') {
            const allSales = await db.sales.toArray();
            const allExpenses = await db.expenses.toArray();

            for (let p of products) {
                p._totalProfit = 0;
                p._totalExpenses = 0;
                
                allSales.filter(s => s.productId === p.id).forEach(s => {
                    p._totalProfit += (s.price * s.qty) - s.totalCost;
                });
                
                allExpenses.filter(e => e.productId === p.id).forEach(e => {
                    p._totalExpenses += e.amount;
                });
                
                p._totalProfit -= p._totalExpenses; // Net Profit
            }
        }

        switch(sortMode) {
            case 'stock-asc': products.sort((a, b) => a.stock - b.stock); break;
            case 'stock-desc': products.sort((a, b) => b.stock - a.stock); break;
            case 'profit': products.sort((a, b) => b._totalProfit - a._totalProfit); break;
            case 'expenses': products.sort((a, b) => b._totalExpenses - a._totalExpenses); break;
            case 'name': 
            default: products.sort((a, b) => a.name.localeCompare(b.name)); break;
        }

        tbody.innerHTML = '';
        
        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted p-4">No hay productos registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        products.forEach(p => {
            let stockStatus = 'normal';
            if (p.stock === 0) stockStatus = 'agotado';
            else if (p.stock <= p.minStock) stockStatus = 'bajo';

            const statusBadge = p.status === 'active' ? 'Activo' : 'Inactivo';
            
            let bundleBadge = '';
            if (p.bundle === '2') bundleBadge = `<span class="badge" style="background-color: rgba(168, 85, 247, 0.2); color: #A855F7;">2 Unids</span>`;
            else if (p.bundle === '3') bundleBadge = `<span class="badge" style="background-color: rgba(249, 115, 22, 0.2); color: #F97316;">3 Unids</span>`;
            else if (p.bundle === 'pack') bundleBadge = `<span class="badge" style="background-color: rgba(239, 68, 68, 0.2); color: #EF4444;">Paquete</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight: 500; display:flex; align-items:center; gap: 8px;">${p.name} ${bundleBadge}</div>
                    <small class="text-muted">SKU: ${p.sku || 'N/A'}</small>
                </td>
                <td><span class="status-badge status-${stockStatus}">${stockStatus.toUpperCase()}</span></td>
                <td>${statusBadge}</td>
                <td>RD$ ${parseFloat(p.price).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" style="padding: 6px 12px; font-weight: 500;" onclick="editProduct(${p.id})"><i class="ph ph-folder-open"></i> Administrar</button>
                    <button class="btn btn-sm btn-outline text-danger" onclick="deleteProduct(${p.id})"><i class="ph ph-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Export Edit and Delete functions to window scope so onclick can reach them
    window.editProduct = async function(id) {
        const p = await db.products.get(id);
        if(!p) return;

        // Restore per-presentation cost map (or bootstrap from stored flat fields)
        const currentBundle = p.bundle || '1';
        _costStructureMap = p.costStructure ? JSON.parse(JSON.stringify(p.costStructure)) : {};
        
        // Ensure all 4 bundle keys ('1', '2', '3', 'pack') are pre-populated
        ['1', '2', '3', 'pack'].forEach(bk => {
            if (!_costStructureMap[bk] || !_costStructureMap[bk].price) {
                const defaultP = getComboPriceForProduct(bk, p);
                _costStructureMap[bk] = {
                    cost: p.cost || 0,
                    price: defaultP,
                    ads: p.ads || 0,
                    pack: p.pack || 0,
                    ship: p.ship || 0,
                    comm: p.comm || 0,
                    other: p.other || 0
                };
            }
        });

        // Ensure the active bundle always has the currently stored flat values
        _costStructureMap[currentBundle] = {
            cost:  p.cost  || 0,
            price: p.price || 0,
            ads:   p.ads   || 0,
            pack:  p.pack  || 0,
            ship:  p.ship  || 0,
            comm:  p.comm  || 0,
            other: p.other || 0,
        };
        _lastBundle = currentBundle;

        document.getElementById('prod-id').value = p.id;
        document.getElementById('modal-title').textContent = p.name;
        document.getElementById('prod-bundle').value = currentBundle;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-category').value = p.category || '';
        document.getElementById('prod-supplier').value = p.supplier || '';
        document.getElementById('prod-sku').value = p.sku || '';
        document.getElementById('prod-code').value = p.code || '';
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-min-stock').value = p.minStock;
        document.getElementById('prod-status').value = p.status;

        document.getElementById('prod-cost').value  = p.cost;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-ads').value   = p.ads;
        document.getElementById('prod-pack').value  = p.pack;
        document.getElementById('prod-ship').value  = p.ship;
        document.getElementById('prod-comm').value  = p.comm;
        document.getElementById('prod-other').value = p.other;

        updateProductCalc();
        resetModalTabs();
        
        // Render Super Header
        renderSuperHeader(p);

        // Show UI
        document.getElementById('super-header-container').style.display = 'flex';
        document.getElementById('quick-actions-bar').style.display = 'flex';

        document.getElementById('metrics-container').style.display = 'block';
        document.getElementById('metrics-message').style.display = 'none';

        document.getElementById('btn-new-expense').style.display = 'block';
        document.getElementById('form-expense-container').style.display = 'none';
        document.getElementById('expenses-message').style.display = 'none';
        document.getElementById('expenses-dashboard').style.display = 'block';
        document.getElementById('expenses-table-container').style.display = 'block';

        document.getElementById('btn-new-layaway').style.display = 'block';
        document.getElementById('form-layaway-container').style.display = 'none';
        document.getElementById('layaway-message').style.display = 'none';
        document.getElementById('layaways-table-container').style.display = 'block';
        
        document.getElementById('btn-direct-sale').style.display = 'block';
        document.getElementById('sales-message').style.display = 'none';
        document.getElementById('sales-table-container').style.display = 'block';

        loadLayaways(p.id);
        loadSales(p.id);
        loadExpenses(p.id);
        loadMetrics(p.id);

        markFormClean(); // No unsaved changes right after loading
        modalProduct.style.display = 'flex';
        void modalProduct.offsetWidth;
        modalProduct.classList.add('active');
    };

    window.deleteProduct = async function(id) {
        const { value: pin } = await Swal.fire({
            title: 'Autorización Requerida',
            html: `<p style="color:#9CA3AF;margin-bottom:8px;">Introduce el PIN para eliminar este producto:</p>`,
            input: 'password',
            inputPlaceholder: 'PIN de Producto',
            inputAttributes: { maxlength: 5 },
            showCancelButton: true,
            confirmButtonText: 'Verificar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444'
        });

        if (!pin) return;

        if (pin !== 'P1290') {
            Swal.fire({ icon: 'error', title: 'PIN incorrecto', text: 'El PIN para eliminar productos es incorrecto.', timer: 2000, showConfirmButton: false });
            return;
        }

        const result = await Swal.fire({
            title: '¿Confirmar eliminación?',
            text: 'Esta acción borrará el producto de forma permanente. (Sus ventas y gastos seguirán en el sistema)',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#374151',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            await db.products.delete(id);
            loadProductsTable();
            initDashboard();
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1000, showConfirmButton: false });
        }
    };

    // --- Layaways (Apartados) Logic ---
    const btnNewLayaway = document.getElementById('btn-new-layaway');
    const formLayawayContainer = document.getElementById('form-layaway-container');
    const formLayaway = document.getElementById('form-layaway');

    if(btnNewLayaway) {
        btnNewLayaway.addEventListener('click', async (e) => {
            e.preventDefault();
            const isOpening = formLayawayContainer.style.display === 'none';
            formLayawayContainer.style.display = isOpening ? 'block' : 'none';
            
            if (isOpening) {
                const prodId = parseInt(document.getElementById('prod-id').value);
                const p = await db.products.get(prodId);
                
                // --- Layaway Quantity (Combo) ---
                // Reemplazamos el input numérico por un <select> que usa las mismas opciones
                // que el selector de bundle en la sección de Ajustes.
                const qtyInputOriginal = document.getElementById('lay-qty');
                const totalInput = document.getElementById('lay-total');
                let qtyInput = qtyInputOriginal;
                if (qtyInput && qtyInput.tagName.toLowerCase() !== 'select') {
                    const select = document.createElement('select');
                    select.id = 'lay-qty';
                    // Copiamos clases/estilos básicos (si existen)
                    select.className = qtyInput.className;
                    // Opciones de bundle (configurables mediante el mismo mapa)
                    const bundleOptions = { '1': '1 unidad', '2': '2 unidades (combo)', '3': '3 unidades (combo)', 'pack': 'Pack' };
                    Object.keys(bundleOptions).forEach(key => {
                        const opt = document.createElement('option');
                        opt.value = key;
                        opt.textContent = bundleOptions[key];
                        select.appendChild(opt);
                    });
                    qtyInputOriginal.parentNode.replaceChild(select, qtyInputOriginal);
                    qtyInput = select;
                }

                // Initialize pricing and select using syncComboPricing helper
                const liveBundle = document.getElementById('prod-bundle').value || '1';
                const { price: comboPrice, bundleSize } = syncComboPricing(liveBundle, p, { source: 'apartados' });

                qtyInput.dataset.bundleSize = bundleSize;

                const updateLayawayDiscountSummary = () => {
                    const totalVal = parseFloat(totalInput.value) || 0;
                    const discPercentInput = document.getElementById('lay-disc-percent');
                    const discPercent = discPercentInput ? (parseFloat(discPercentInput.value) || 0) : 0;
                    const discApplyYes = document.getElementById('lay-disc-yes')?.checked;
                    const summaryBox = document.getElementById('lay-disc-summary-box');

                    if (summaryBox) {
                        if (discApplyYes && discPercent > 0) {
                            const discAmount = totalVal * (discPercent / 100);
                            const finalPrice = totalVal - discAmount;
                            document.getElementById('lay-summary-normal').textContent = `RD$${totalVal.toLocaleString()}`;
                            document.getElementById('lay-summary-pct').textContent = discPercent;
                            document.getElementById('lay-summary-disc').textContent = `-RD$${discAmount.toLocaleString()}`;
                            document.getElementById('lay-summary-final').textContent = `RD$${finalPrice.toLocaleString()}`;
                            summaryBox.style.display = 'block';
                        } else {
                            summaryBox.style.display = 'none';
                        }
                    }
                };

                // Sync and retrieve correct pricing when the combo/presentation select is changed
                qtyInput.onchange = () => {
                    const selectedBundle = qtyInput.value;
                    const { price: newComboPrice, bundleSize: newSize } = syncComboPricing(selectedBundle, p, { source: 'apartados' });
                    qtyInput.dataset.bundleSize = newSize;
                    updateLayawayDiscountSummary();
                };

                // Sync pricing back to Ajustes when edited manually in Apartados
                totalInput.oninput = () => {
                    const customPrice = parseFloat(totalInput.value) || 0;
                    syncComboPricing(qtyInput.value, p, { source: 'apartados-input', customPrice });
                    updateLayawayDiscountSummary();
                };

                const expectedDateInput = document.getElementById('lay-expected-date');
                if (expectedDateInput) {
                    const today = new Date();
                    today.setDate(today.getDate() + 15);
                    expectedDateInput.value = today.toISOString().split('T')[0];
                }

                // Reset toggles to defaults
                document.getElementById('lay-ship-no').checked = true;
                document.getElementById('lay-ship-amount-wrap').style.display = 'none';
                document.getElementById('lay-ship-amount').value = 0;
                document.getElementById('lay-disc-no').checked = true;
                document.getElementById('lay-disc-amount-wrap').style.display = 'none';
                document.getElementById('lay-disc-percent').value = 10;
                document.getElementById('lay-disc-summary-box').style.display = 'none';

                // Toggle listeners: only show/hide fields
                document.querySelectorAll('input[name="lay-ship-apply"]').forEach(r => {
                    r.onchange = () => {
                        document.getElementById('lay-ship-amount-wrap').style.display = r.value === 'yes' ? 'block' : 'none';
                    };
                });
                document.querySelectorAll('input[name="lay-disc-apply"]').forEach(r => {
                    r.onchange = () => {
                        document.getElementById('lay-disc-amount-wrap').style.display = r.value === 'yes' ? 'block' : 'none';
                        updateLayawayDiscountSummary();
                    };
                });
                document.getElementById('lay-disc-percent').addEventListener('input', updateLayawayDiscountSummary);
            }
        });
    }

    if(formLayaway) {
        formLayaway.addEventListener('submit', async (e) => {
            e.preventDefault();
            const prodId = parseInt(document.getElementById('prod-id').value);
            if(!prodId) return;

            const selectedBundleKey = document.getElementById('lay-qty').value; // '1', '2', '3', 'pack'
            const bundleQtyMap = { '1': 1, '2': 2, '3': 3, 'pack': 1 };
            const physicalUnits = bundleQtyMap[selectedBundleKey] || 1;

            const totalAmount = parseFloat(document.getElementById('lay-total').value);

            const p = await db.products.get(prodId);
            const expectedDate = document.getElementById('lay-expected-date').value;

            // --- Envío ---
            const shipApply = document.querySelector('input[name="lay-ship-apply"]:checked').value === 'yes';
            const shipAmount = shipApply ? (parseFloat(document.getElementById('lay-ship-amount').value) || 0) : 0;

            // --- Descuento ---
            const discApply = document.querySelector('input[name="lay-disc-apply"]:checked').value === 'yes';
            const discPercent = discApply ? (parseFloat(document.getElementById('lay-disc-percent').value) || 10) : 0;
            const discAmount = discApply && discPercent > 0 ? totalAmount * (discPercent / 100) : 0;
            const finalAmount = discApply && discPercent > 0 ? (totalAmount - discAmount) : totalAmount;

            const layaway = {
                productId: prodId,
                customer: document.getElementById('lay-customer').value,
                phone: document.getElementById('lay-phone').value || '',
                qty: 1,
                bundleKey: selectedBundleKey,
                bundleSize: physicalUnits,
                physicalQty: physicalUnits,
                date: new Date().toISOString(),
                expectedDate: expectedDate || null,
                status: 'pending',
                totalAmount: finalAmount,
                shipAmount: shipAmount,
                discPercent: discPercent,
                discAmount: discAmount
            };

            await db.layaways.add(layaway);
            formLayaway.reset();
            document.getElementById('lay-ship-no').checked = true;
            document.getElementById('lay-ship-amount-wrap').style.display = 'none';
            document.getElementById('lay-disc-no').checked = true;
            document.getElementById('lay-disc-amount-wrap').style.display = 'none';
            formLayawayContainer.style.display = 'none';
            loadLayaways(prodId);
            const comboLabel = bundleSize > 1 ? ` (${combos} combo${combos>1?'s':''} × ${bundleSize} uds)` : '';
            const shipMsg = shipApply ? ` • Envío: RD$${shipAmount}` : '';
            const discMsg = discApply ? ` • Descuento: ${discPercent}% (-RD$${Math.round(discAmount)})` : '';
            Swal.fire({icon: 'success', title: 'Pedido Registrado', html: `Total: <b>RD$${totalAmount.toLocaleString()}</b>${comboLabel}${shipMsg}${discMsg}`, timer: 2500, showConfirmButton: false});
        });
    }

    async function loadLayaways(productId) {
        const tbody = document.getElementById('layaways-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const allLayaways = await db.layaways.toArray();
        let layaways = [];
        if (productId) {
            layaways = allLayaways.filter(l => String(l.productId) === String(productId) && l.status === 'pending');
        } else {
            layaways = allLayaways.filter(l => l.status === 'pending');
        }
        
        if (layaways.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No hay pedidos activos.</td></tr>`;
            return;
        }

        for (const l of layaways) {
            const tr = document.createElement('tr');
            
            // Calculate remaining time
            const created = new Date(l.date);
            let expected;
            if (l.expectedDate) {
                expected = new Date(l.expectedDate + 'T23:59:59');
            } else {
                expected = new Date(created.getTime() + (15 * 24 * 60 * 60 * 1000));
            }
            
            const now = new Date();
            const diffTime = expected - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let timeBadge = '';
            if (diffDays < 0) timeBadge = `<span class="badge badge-red">Atrasado (${Math.abs(diffDays)}d)</span>`;
            else if (diffDays === 0) timeBadge = `<span class="badge badge-yellow">¡Hoy!</span>`;
            else if (diffDays <= 3) timeBadge = `<span class="badge badge-yellow">${diffDays} días</span>`;
            else timeBadge = `<span class="badge badge-green">${diffDays} días</span>`;

            // Calculate estimated profit for this layaway
            const prod = await db.products.get(l.productId);
            const physicalUnits = l.physicalQty || l.bundleSize || 1;
            const bundleKey = l.bundleKey || String(l.bundleSize || 1);
            let comboCost = 0;
            if (_costStructureMap && _costStructureMap[bundleKey]) {
                const c = _costStructureMap[bundleKey];
                comboCost = (c.cost + c.ads + c.pack + c.ship + c.comm + c.other);
            } else if (prod) {
                comboCost = (prod.cost + prod.ads + prod.pack + prod.ship + prod.comm + prod.other) * physicalUnits;
            }
            const totalCost = comboCost + (l.shipAmount || 0);
            const estProfit = l.totalAmount - totalCost;
            const marginPct = l.totalAmount > 0 ? Math.round((estProfit / l.totalAmount) * 100) : 0;

            const bundleLabel = physicalUnits === 2 ? 'Combo (2 uds)' : (physicalUnits === 3 ? 'Combo (3 uds)' : (physicalUnits === 1 ? '1 ud' : `${physicalUnits} uds`));

            const discHtml = (l.discPercent && l.discPercent > 0) ? 
                `<br><span class="badge bg-red text-danger" style="font-size:0.75rem; margin-top:2px;">🏷️ -${l.discPercent}% desc</span>` : '';

            const phoneAction = l.phone ? `<a href="https://wa.me/${l.phone.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-sm btn-outline text-success" title="WhatsApp" style="padding: 4px 8px;"><i class="ph ph-whatsapp-logo"></i></a>` : '';

            tr.innerHTML = `
                <td><small class="text-muted">${created.toLocaleDateString()}</small></td>
                <td><strong>${l.customer}</strong><br><small class="text-muted">${l.phone || 'Sin teléfono'}</small></td>
                <td><span class="badge bg-darker border">📦 ${bundleLabel}</span></td>
                <td>${timeBadge}</td>
                <td><strong class="text-info">RD$${l.totalAmount.toLocaleString()}</strong>${discHtml}</td>
                <td><span class="${estProfit >= 0 ? 'text-success' : 'text-danger'}" style="font-weight:700;">📈 RD$${Math.round(estProfit).toLocaleString()}</span><br><small class="text-muted">(${marginPct}% marg.)</small></td>
                <td>
                    <div style="display:flex; gap:6px;">
                        ${phoneAction}
                        <button class="btn btn-sm btn-success" style="padding: 4px 8px;" onclick="markLayawaySold(${l.id}, ${l.productId})" title="Entregar"><i class="ph ph-check"></i></button>
                        <button class="btn btn-sm btn-outline text-danger" style="padding: 4px 8px;" onclick="cancelLayaway(${l.id}, ${l.productId})" title="Cancelar"><i class="ph ph-x"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        }
    }

    window.cancelLayaway = async function(layawayId, productId) {
        // Step 1: Ask for PIN
        const { value: pin } = await Swal.fire({
            title: 'Autorización Requerida',
            html: `<p style="color:#9CA3AF;margin-bottom:8px;">Introduce el PIN para cancelar este apartado:</p>`,
            input: 'password',
            inputPlaceholder: 'PIN de Apartado',
            inputAttributes: { maxlength: 5 },
            showCancelButton: true,
            confirmButtonText: 'Verificar',
            cancelButtonText: 'Volver',
            confirmButtonColor: '#EF4444'
        });

        if (!pin) return; // User cancelled

        if (pin !== 'A1290') {
            Swal.fire({ icon: 'error', title: 'PIN incorrecto', text: 'El PIN para cancelar apartados es incorrecto.', timer: 2000, showConfirmButton: false });
            return;
        }

        // Step 2: Confirm cancellation
        const result = await Swal.fire({
            title: '¿Cancelar apartado?',
            text: 'El apartado será marcado como cancelado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No'
        });

        if (result.isConfirmed) {
            await db.layaways.update(layawayId, { status: 'cancelled' });
            loadLayaways(productId);
            loadMetrics(productId);
            loadProductsTable();
            initDashboard();
            Swal.fire({ icon: 'success', title: 'Apartado Cancelado', timer: 1500, showConfirmButton: false });
        }
    };

    window.markLayawaySold = async function(layawayId, productId) {
        const result = await Swal.fire({
            title: '¿Marcar como Vendido?',
            text: "Se registrará como completado y pasará a ventas.",
            html: `
                <div style="text-align: left; margin-top: 15px;">
                    <label>Método de Pago:</label>
                    <select id="swal-pay-method" class="swal2-input">
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Tarjeta">Tarjeta</option>
                    </select>
                </div>
            `,
            focusConfirm: false,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, registrar',
            preConfirm: () => {
                return { paymentMethod: document.getElementById('swal-pay-method').value }
            }
        });

        if (result.isConfirmed) {
            const paymentMethod = result.value.paymentMethod;
            const l = await db.layaways.get(layawayId);
            const p = await db.products.get(productId);

            // Physical units = combos × bundleSize
            const units = l.physicalQty || (l.qty * (l.bundleSize || 1));

            if(p.stock < units) {
                Swal.fire('Error', `No hay stock suficiente. Necesitas ${units} unidades.`, 'error');
                return;
            }

            // Deduct physical units from stock
            await db.products.update(productId, { stock: p.stock - units });

            // Mark layaway sold
            await db.layaways.update(layawayId, { status: 'sold' });

            // Sale record — revenue per combo, cost per combo
            const pricePerCombo = l.totalAmount / l.qty;
            const shipPerCombo  = l.shipAmount  ? (l.shipAmount / l.qty) : 0;
            const discPerCombo  = l.discAmount  ? (l.discAmount / l.qty) : 0;
            // Base cost from Ajustes (already covers the combo)
            const baseCostCombo = p.cost + p.ads + p.pack + p.ship + p.comm + p.other;

            await db.sales.add({
                productId: productId,
                customer: l.customer,
                qty: units,  // physical units for reports/stock consistency
                price: l.totalAmount / units,  // price per physical unit
                paymentMethod: paymentMethod,
                totalCost: (baseCostCombo + shipPerCombo + discPerCombo) * l.qty,
                shipAmount: l.shipAmount || 0,
                discPercent: l.discPercent || 0,
                discAmount: l.discAmount || 0,
                bundleSize: l.bundleSize || 1,
                date: new Date().toISOString(),
                source: 'layaway'
            });

            loadLayaways(productId);
            loadSales(productId);
            loadMetrics(productId);
            loadProductsTable();
            initDashboard();

            document.getElementById('prod-stock').value = p.stock - units;
            Swal.fire({icon: 'success', title: '¡Venta completada!', timer: 1500, showConfirmButton: false});
        }
    };

    // --- Direct Sales Logic ---
    const btnDirectSale = document.getElementById('btn-direct-sale');
    if(btnDirectSale) {
        btnDirectSale.addEventListener('click', async (e) => {
            e.preventDefault();
            const prodId = parseInt(document.getElementById('prod-id').value);
            if(!prodId) return;

            const p = await db.products.get(prodId);
            if(p.stock < 1) {
                Swal.fire('Error', 'No hay stock disponible.', 'error');
                return;
            }

            const currentActiveBundle = document.getElementById('prod-bundle')?.value || p.bundle || '1';

            const result = await Swal.fire({
                title: 'Venta Directa',
                html: `
                    <div style="text-align: left; margin-top: 15px;">
                        <label style="font-size:0.85rem;font-weight:600;color:#9CA3AF;">Cliente (Opcional):</label>
                        <input id="swal-cust" class="swal2-input" placeholder="Nombre">
                        <label style="font-size:0.85rem;font-weight:600;color:#9CA3AF;">Presentación / Combo:</label>
                        <select id="swal-bundle" class="swal2-input">
                            <option value="1">1 Unidad (Individual)</option>
                            <option value="2">Combo de 2 Unidades</option>
                            <option value="3">Combo de 3 Unidades</option>
                            <option value="pack">Paquete Especial</option>
                        </select>
                        <label style="font-size:0.85rem;font-weight:600;color:#9CA3AF;">Cantidad (Orden):</label>
                        <input id="swal-qty" type="number" class="swal2-input" value="1" min="1" max="1" readonly style="background:rgba(255,255,255,0.05); color:#9CA3AF; cursor:not-allowed;">
                        <label style="font-size:0.85rem;font-weight:600;color:#9CA3AF;">Precio por Combo (RD$):</label>
                        <input id="swal-price" type="number" class="swal2-input" value="${p.price}">
                        <label style="font-size:0.85rem;font-weight:600;color:#9CA3AF;">Método de Pago:</label>
                        <select id="swal-pay-method" class="swal2-input">
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta">Tarjeta</option>
                        </select>

                        <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
                            <!-- Envío -->
                            <div style="background:rgba(255,255,255,0.05);border:1px solid #374151;border-radius:8px;padding:10px 14px;flex:1;min-width:150px;">
                                <div style="font-size:0.75rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">¿Aplica Envío?</div>
                                <div style="display:flex;gap:6px;">
                                    <label style="cursor:pointer;"><input type="radio" name="swal-ship" id="swal-ship-no" value="no" checked style="display:none;"><span id="swal-ship-no-lbl" style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:600;border:1px solid #374151;background:#2563EB;color:#fff;">No</span></label>
                                    <label style="cursor:pointer;"><input type="radio" name="swal-ship" id="swal-ship-yes" value="yes" style="display:none;"><span id="swal-ship-yes-lbl" style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:600;border:1px solid #374151;color:#9CA3AF;">Sí</span></label>
                                </div>
                                <div id="swal-ship-wrap" style="display:none;margin-top:8px;">
                                    <input type="number" id="swal-ship-amount" class="swal2-input" placeholder="Monto envío (RD$)" value="0" min="0" style="margin:0;width:100%;">
                                </div>
                            </div>
                            <!-- Descuento -->
                            <div style="background:rgba(255,255,255,0.05);border:1px solid #374151;border-radius:8px;padding:10px 14px;flex:1;min-width:150px;">
                                <div style="font-size:0.75rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">¿Aplica Descuento?</div>
                                <div style="display:flex;gap:6px;">
                                    <label style="cursor:pointer;"><input type="radio" name="swal-disc" id="swal-disc-no" value="no" checked style="display:none;"><span id="swal-disc-no-lbl" style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:600;border:1px solid #374151;background:#2563EB;color:#fff;">No</span></label>
                                    <label style="cursor:pointer;"><input type="radio" name="swal-disc" id="swal-disc-yes" value="yes" style="display:none;"><span id="swal-disc-yes-lbl" style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:600;border:1px solid #374151;color:#9CA3AF;">Sí</span></label>
                                </div>
                                <div id="swal-disc-wrap" style="display:none;margin-top:8px;align-items:center;gap:6px;">
                                    <input type="number" id="swal-disc-percent" class="swal2-input" placeholder="%" value="10" min="0" max="100" style="margin:0;width:70px;display:inline-block;">
                                    <span style="font-size:0.85rem;color:#9CA3AF;"> % descuento</span>
                                </div>
                            </div>
                        </div>

                        <!-- Discount Summary Box -->
                        <div id="swal-disc-summary-box" style="display:none; margin-top:14px; padding:12px 16px; background:rgba(16,185,129,0.08); border:1px dashed #10B981; border-radius:8px; width:100%; box-sizing:border-box;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span style="color:#9CA3AF; font-size:0.85rem;">Precio Normal:</span>
                                <span id="swal-summary-normal" style="font-weight:600; font-size:0.85rem; color:#fff;">RD$0</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span style="color:#EF4444; font-size:0.85rem; font-weight:500;">Descuento Aplicado (<span id="swal-summary-pct">0</span>%):</span>
                                <span id="swal-summary-disc" style="color:#EF4444; font-weight:600; font-size:0.85rem;">-RD$0</span>
                            </div>
                            <hr style="border:0; border-top:1px solid #374151; margin:8px 0;">
                            <div style="display:flex; justify-content:space-between;">
                                <span style="font-weight:700; color:#10B981; font-size:0.9rem;">Total a Cobrar:</span>
                                <span id="swal-summary-final" style="font-weight:800; color:#10B981; font-size:1.05rem;">RD$0</span>
                            </div>
                        </div>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'Vender',
                didOpen: () => {
                    const swalBundle = document.getElementById('swal-bundle');
                    swalBundle.value = currentActiveBundle;

                    const updateSwalDiscountSummary = () => {
                        const priceInput = document.getElementById('swal-price');
                        const qtyInput = document.getElementById('swal-qty');
                        const discPercentInput = document.getElementById('swal-disc-percent');
                        const discYes = document.getElementById('swal-disc-yes')?.checked;
                        const summaryBox = document.getElementById('swal-disc-summary-box');
                        
                        if (summaryBox && priceInput && qtyInput && discPercentInput) {
                            const priceVal = parseFloat(priceInput.value) || 0;
                            const qtyVal = parseInt(qtyInput.value) || 1;
                            const totalNormal = priceVal * qtyVal;
                            const discPercent = parseFloat(discPercentInput.value) || 0;
                            
                            if (discYes && discPercent > 0) {
                                const discAmount = totalNormal * (discPercent / 100);
                                const finalPrice = totalNormal - discAmount;
                                
                                document.getElementById('swal-summary-normal').textContent = `RD$${totalNormal.toLocaleString()}`;
                                document.getElementById('swal-summary-pct').textContent = discPercent;
                                document.getElementById('swal-summary-disc').textContent = `-RD$${discAmount.toLocaleString()}`;
                                document.getElementById('swal-summary-final').textContent = `RD$${finalPrice.toLocaleString()}`;
                                summaryBox.style.display = 'block';
                            } else {
                                summaryBox.style.display = 'none';
                            }
                        }
                    };

                    // Initialize price field inside swal
                    const { price: initPrice } = syncComboPricing(currentActiveBundle, p, { source: 'ventas' });
                    document.getElementById('swal-price').value = initPrice;
                    updateSwalDiscountSummary();

                    // Listen for bundle change inside popup
                    swalBundle.addEventListener('change', () => {
                        const { price: newPrice } = syncComboPricing(swalBundle.value, p, { source: 'ventas' });
                        document.getElementById('swal-price').value = newPrice;
                        updateSwalDiscountSummary();
                    });

                    // Listen for manual price edits in swal and sync
                    document.getElementById('swal-price').addEventListener('input', (e) => {
                        const customP = parseFloat(e.target.value) || 0;
                        syncComboPricing(swalBundle.value, p, { source: 'ventas-input', customPrice: customP });
                        updateSwalDiscountSummary();
                    });

                    document.getElementById('swal-qty').addEventListener('input', updateSwalDiscountSummary);
                    document.getElementById('swal-disc-percent').addEventListener('input', updateSwalDiscountSummary);

                    const refreshShip = () => {
                        const yes = document.getElementById('swal-ship-yes').checked;
                        document.getElementById('swal-ship-wrap').style.display = yes ? 'block' : 'none';
                        document.getElementById('swal-ship-yes-lbl').style.background = yes ? '#10B981' : 'transparent';
                        document.getElementById('swal-ship-yes-lbl').style.color = yes ? '#fff' : '#9CA3AF';
                        document.getElementById('swal-ship-yes-lbl').style.borderColor = yes ? '#10B981' : '#374151';
                        document.getElementById('swal-ship-no-lbl').style.background = yes ? 'transparent' : '#2563EB';
                        document.getElementById('swal-ship-no-lbl').style.color = yes ? '#9CA3AF' : '#fff';
                        document.getElementById('swal-ship-no-lbl').style.borderColor = yes ? '#374151' : '#2563EB';
                    };
                    const refreshDisc = () => {
                        const yes = document.getElementById('swal-disc-yes').checked;
                        const wrap = document.getElementById('swal-disc-wrap');
                        wrap.style.display = yes ? 'flex' : 'none';
                        document.getElementById('swal-disc-yes-lbl').style.background = yes ? '#10B981' : 'transparent';
                        document.getElementById('swal-disc-yes-lbl').style.color = yes ? '#fff' : '#9CA3AF';
                        document.getElementById('swal-disc-yes-lbl').style.borderColor = yes ? '#10B981' : '#374151';
                        document.getElementById('swal-disc-no-lbl').style.background = yes ? 'transparent' : '#2563EB';
                        document.getElementById('swal-disc-no-lbl').style.color = yes ? '#9CA3AF' : '#fff';
                        document.getElementById('swal-disc-no-lbl').style.borderColor = yes ? '#374151' : '#2563EB';
                        updateSwalDiscountSummary();
                    };
                    document.querySelectorAll('input[name="swal-ship"]').forEach(r => r.addEventListener('change', refreshShip));
                    document.querySelectorAll('input[name="swal-disc"]').forEach(r => r.addEventListener('change', refreshDisc));
                    
                    ['swal-ship-no-lbl','swal-ship-yes-lbl'].forEach(id => {
                        document.getElementById(id)?.addEventListener('click', () => {
                            const val = id.includes('yes') ? 'yes' : 'no';
                            document.querySelector(`input[name="swal-ship"][value="${val}"]`).checked = true;
                            refreshShip();
                        });
                    });
                    ['swal-disc-no-lbl','swal-disc-yes-lbl'].forEach(id => {
                        document.getElementById(id)?.addEventListener('click', () => {
                            const val = id.includes('yes') ? 'yes' : 'no';
                            document.querySelector(`input[name="swal-disc"][value="${val}"]`).checked = true;
                            refreshDisc();
                        });
                    });
                },
                preConfirm: () => {
                    const shipYes = document.getElementById('swal-ship-yes').checked;
                    const discYes = document.getElementById('swal-disc-yes').checked;
                    const swalBundleKey = document.getElementById('swal-bundle').value;
                    const bundleQtyMap = { '1': 1, '2': 2, '3': 3, 'pack': 1 };
                    const bundleSize = bundleQtyMap[swalBundleKey] || 1;

                    let price = parseFloat(document.getElementById('swal-price').value) || p.price;
                    const qty = parseInt(document.getElementById('swal-qty').value) || 1;
                    const shipAmount = shipYes ? (parseFloat(document.getElementById('swal-ship-amount').value) || 0) : 0;
                    const discPercent = discYes ? (parseFloat(document.getElementById('swal-disc-percent').value) || 10) : 0;
                    if (discYes && discPercent > 0) price = price * (1 - discPercent / 100);
                    return {
                        cust: document.getElementById('swal-cust').value || 'Mostrador',
                        qty,
                        price: Math.round(price * 100) / 100,
                        paymentMethod: document.getElementById('swal-pay-method').value,
                        shipAmount,
                        discPercent,
                        bundleKey: swalBundleKey,
                        bundleSize
                    };
                }
            });

            if (result.isConfirmed) {
                const {cust, qty, price, paymentMethod, shipAmount, discPercent, bundleKey, bundleSize} = result.value;
                const physicalQty = qty * bundleSize;

                if(physicalQty > p.stock) {
                    Swal.fire('Error', `Stock insuficiente. Solo tienes ${p.stock} unidades en stock. Esta venta requiere ${physicalQty} unidades.`, 'error');
                    return;
                }

                // Deduct physical stock
                await db.products.update(prodId, { stock: p.stock - physicalQty });
                
                // Shipping is our cost, add per combo
                const extraCostPerCombo = qty > 0 ? (shipAmount / qty) : 0;
                
                // Cost for this specific combo
                const baseCostCombo = _costStructureMap[bundleKey] ? 
                    (_costStructureMap[bundleKey].cost + _costStructureMap[bundleKey].ads + _costStructureMap[bundleKey].pack + _costStructureMap[bundleKey].ship + _costStructureMap[bundleKey].comm + _costStructureMap[bundleKey].other) : 
                    ((p.cost + p.ads + p.pack + p.ship + p.comm + p.other) * bundleSize);

                // Create Sale record
                await db.sales.add({
                    productId: prodId,
                    customer: cust,
                    qty: qty,
                    bundleSize: bundleSize,
                    physicalQty: physicalQty,
                    price: price,
                    paymentMethod: paymentMethod,
                    totalCost: (baseCostCombo + extraCostPerCombo) * qty,
                    shipAmount: shipAmount,
                    discPercent: discPercent,
                    date: new Date().toISOString(),
                    source: 'direct'
                });

                loadSales(prodId);
                loadMetrics(prodId);
                loadProductsTable(); 
                initDashboard(); 
                document.getElementById('prod-stock').value = p.stock - physicalQty; 
                Swal.fire({icon: 'success', title: 'Venta Registrada', timer: 1500, showConfirmButton: false});
            }
        });
    }

    async function loadSales(productId) {
        const tbody = document.getElementById('sales-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const allSales = await db.sales.toArray();
        let sales = [];
        if (productId) {
            sales = allSales.filter(s => String(s.productId) === String(productId));
        } else {
            sales = allSales;
        }
        // Sort descending by date
        sales.sort((a,b) => new Date(b.date) - new Date(a.date));

        if (sales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No hay ventas registradas.</td></tr>`;
            return;
        }

        sales.forEach(s => {
            const revenue = s.price;
            const profit = revenue - s.totalCost;
            const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
            const pmBadge = s.paymentMethod === 'Transferencia' ? 'bg-blue text-primary' : (s.paymentMethod === 'Tarjeta' ? 'bg-orange text-warning' : 'bg-green text-success');
            const physicalUnits = s.physicalQty || s.bundleSize || 1;
            const bundleLabel = physicalUnits === 2 ? 'Combo (2 uds)' : (physicalUnits === 3 ? 'Combo (3 uds)' : (physicalUnits === 1 ? '1 ud' : `${physicalUnits} uds`));

            const discHtml = (s.discPercent && s.discPercent > 0) ? 
                `<br><span class="badge bg-red text-danger" style="font-size:0.75rem; margin-top:2px;">🏷️ -${s.discPercent}% desc</span>` : '';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><small class="text-muted">${new Date(s.date).toLocaleDateString()}</small></td>
                <td><strong>${s.customer}</strong> <br><small class="text-muted">${s.source === 'layaway' ? 'De Apartado' : 'Directa'}</small></td>
                <td><span class="badge ${pmBadge}">${s.paymentMethod || 'Efectivo'}</span></td>
                <td><span class="badge bg-darker border">📦 ${bundleLabel}</span></td>
                <td><strong class="text-info">RD$${revenue.toLocaleString()}</strong>${discHtml}</td>
                <td><span class="${profit >= 0 ? 'text-success' : 'text-danger'}" style="font-weight:700;">📈 RD$${Math.round(profit).toLocaleString()}</span><br><small class="text-muted">(${marginPct}% marg.)</small></td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-sm btn-outline" onclick="Swal.fire('Detalle', 'Venta el ${new Date(s.date).toLocaleString()}', 'info')"><i class="ph ph-eye"></i></button>
                        <button class="btn btn-sm btn-outline text-danger" onclick="deleteSale('${s.id}', '${s.productId}')" title="Eliminar y devolver stock"><i class="ph ph-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.deleteSale = async function(saleId, productId) {
        // Step 1: Ask for PIN V1290
        const { value: pin } = await Swal.fire({
            title: 'Autorización Requerida',
            html: `<p style="color:#9CA3AF;margin-bottom:8px;">Introduce el PIN para eliminar esta venta:</p>`,
            input: 'password',
            inputPlaceholder: 'PIN de Venta',
            inputAttributes: { maxlength: 5 },
            showCancelButton: true,
            confirmButtonText: 'Verificar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444'
        });

        if (!pin) return;

        if (pin !== 'V1290') {
            Swal.fire({ icon: 'error', title: 'PIN incorrecto', text: 'El PIN para eliminar ventas es incorrecto.', timer: 2000, showConfirmButton: false });
            return;
        }

        // Step 2: Confirm deletion
        const result = await Swal.fire({
            title: '¿Eliminar venta?',
            text: 'Se borrará la venta y las unidades volverán al inventario.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            const s = await db.sales.get(saleId);
            if(s) {
                const p = await db.products.get(productId);
                if(p) {
                    const unitsToRestore = s.physicalQty || (s.source === 'layaway' ? s.qty : (s.qty * (s.bundleSize || 1)));
                    await db.products.update(productId, { stock: p.stock + unitsToRestore });
                    document.getElementById('prod-stock').value = p.stock + unitsToRestore;
                }
                await db.sales.delete(saleId);
                loadSales(productId);
                loadMetrics(productId);
                loadProductsTable();
                initDashboard();
                Swal.fire({ icon: 'success', title: 'Venta Eliminada', text: 'Stock restaurado.', timer: 1500, showConfirmButton: false });
            }
        }
    };

    // --- Expenses (Gastos) Logic ---
    const btnNewExpense = document.getElementById('btn-new-expense');
    const formExpenseContainer = document.getElementById('form-expense-container');
    const formExpense = document.getElementById('form-expense');

    if(btnNewExpense) {
        btnNewExpense.addEventListener('click', (e) => {
            e.preventDefault();
            formExpenseContainer.style.display = formExpenseContainer.style.display === 'none' ? 'block' : 'none';
        });
    }

    if(formExpense) {
        formExpense.addEventListener('submit', async (e) => {
            e.preventDefault();
            const prodId = parseInt(document.getElementById('prod-id').value);
            if(!prodId) return;

            const expense = {
                productId: prodId,
                type: document.getElementById('exp-type').value,
                amount: parseFloat(document.getElementById('exp-amount').value) || 0,
                description: document.getElementById('exp-desc').value || '',
                date: new Date().toISOString()
            };

            await db.expenses.add(expense);
            formExpense.reset();
            formExpenseContainer.style.display = 'none';
            loadExpenses(prodId);
            loadMetrics(prodId);
            Swal.fire({icon: 'success', title: 'Gasto Registrado', timer: 1000, showConfirmButton: false});
        });
    }

    async function loadExpenses(productId) {
        const tbody = document.getElementById('expenses-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        const allExpenses = await db.expenses.toArray();
        let expenses = [];
        if (productId) {
            expenses = allExpenses.filter(e => String(e.productId) === String(productId));
        } else {
            expenses = allExpenses;
        }
        expenses.sort((a,b) => new Date(b.date) - new Date(a.date));

        if (expenses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay gastos registrados.</td></tr>`;
            return;
        }

        expenses.forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><small class="text-muted">${new Date(e.date).toLocaleDateString()}</small></td>
                <td><span class="badge bg-darker text-muted border">${e.type}</span></td>
                <td>${e.description || '-'}</td>
                <td class="text-danger">-RD$${e.amount.toLocaleString()}</td>
                <td><button class="btn btn-sm btn-outline text-danger" onclick="deleteExpense(${e.id}, ${e.productId})"><i class="ph ph-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.deleteExpense = async function(expenseId, productId) {
        // Step 1: Ask for PIN G1290
        const { value: pin } = await Swal.fire({
            title: 'Autorización Requerida',
            html: `<p style="color:#9CA3AF;margin-bottom:8px;">Introduce el PIN para eliminar este gasto:</p>`,
            input: 'password',
            inputPlaceholder: 'PIN de Gasto',
            inputAttributes: { maxlength: 5 },
            showCancelButton: true,
            confirmButtonText: 'Verificar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444'
        });

        if (!pin) return;

        if (pin !== 'G1290') {
            Swal.fire({ icon: 'error', title: 'PIN incorrecto', text: 'El PIN para eliminar gastos es incorrecto.', timer: 2000, showConfirmButton: false });
            return;
        }

        // Step 2: Confirm deletion
        const result = await Swal.fire({
            title: '¿Eliminar Gasto?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if(result.isConfirmed) {
            await db.expenses.delete(expenseId);
            loadExpenses(productId);
            loadMetrics(productId);
            Swal.fire({icon: 'success', title: 'Eliminado', timer: 1000, showConfirmButton: false});
        }
    };

    // --- Quick Actions Logic ---
    window.quickEditPrice = async function(productId, currentPrice) {
        const { value: newPrice } = await Swal.fire({
            title: 'Cambiar Precio',
            input: 'number',
            inputValue: currentPrice,
            showCancelButton: true,
            inputValidator: (value) => !value && 'Debes ingresar un precio'
        });
        if(newPrice) {
            await db.products.update(productId, { price: parseFloat(newPrice) });
            document.getElementById('prod-price').value = newPrice;
            updateProductCalc();
            loadMetrics(productId);
            Swal.fire({icon: 'success', title: 'Precio Actualizado', timer: 1000, showConfirmButton: false});
        }
    };

    window.quickAdjustStock = async function(productId, currentStock, type) {
        const title = type === 'add' ? 'Ingresar Stock' : 'Descontar Stock';
        const { value: qty } = await Swal.fire({
            title: title,
            input: 'number',
            inputValue: 1,
            showCancelButton: true,
            inputValidator: (value) => !value && 'Debes ingresar una cantidad'
        });
        if(qty) {
            const amount = parseInt(qty);
            let newStock = type === 'add' ? currentStock + amount : currentStock - amount;
            if (newStock < 0) newStock = 0;
            await db.products.update(productId, { stock: newStock });
            document.getElementById('prod-stock').value = newStock;
            loadMetrics(productId);
            loadProductsTable();
            Swal.fire({icon: 'success', title: 'Stock Actualizado', timer: 1000, showConfirmButton: false});
        }
    };

    // --- Metrics & Summary Logic ---
    async function loadMetrics(productId) {
        const p = await db.products.get(productId);
        if(!p) return;

        // BIND QUICK ACTIONS
        document.getElementById('qa-price').onclick = (e) => { e.preventDefault(); window.quickEditPrice(p.id, p.price); };
        document.getElementById('qa-stock-add').onclick = (e) => { e.preventDefault(); window.quickAdjustStock(p.id, p.stock, 'add'); };
        document.getElementById('qa-stock-remove').onclick = (e) => { e.preventDefault(); window.quickAdjustStock(p.id, p.stock, 'remove'); };
        document.getElementById('qa-image').onclick = (e) => { e.preventDefault(); Swal.fire('Imagen', 'Sube una imagen para tu producto', 'info'); }; // Placeholder para subir imagen real
        document.getElementById('qa-duplicate').onclick = (e) => { e.preventDefault(); Swal.fire('Duplicar', 'Se duplicará el producto', 'info'); };
        document.getElementById('qa-delete').onclick = (e) => { e.preventDefault(); window.deleteProduct(p.id); };

        const allSales = await db.sales.toArray();
        const sales = allSales.filter(s => String(s.productId) === String(productId));
        const allExpenses = await db.expenses.toArray();
        const expenses = allExpenses.filter(e => String(e.productId) === String(productId));

        let totalRevenue = 0;
        let totalSold = 0;
        let totalCostOfGoodsSold = 0;
        let lastSaleDate = null;
        
        // Arrays for Charts
        const last30Days = [];
        const salesData = [];
        for(let i=29; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last30Days.push(d.toLocaleDateString('es-ES', {day:'2-digit', month:'short'}));
            salesData.push(0);
        }

        sales.sort((a,b) => new Date(a.date) - new Date(b.date)); // Ascendente
        if (sales.length > 0) {
            lastSaleDate = new Date(sales[sales.length - 1].date);
        }

        sales.forEach(s => {
            totalRevenue += (s.price * s.qty);
            totalSold += s.qty;
            totalCostOfGoodsSold += s.totalCost;
            
            // Build Chart Data
            const sDate = new Date(s.date).toLocaleDateString('es-ES', {day:'2-digit', month:'short'});
            const index = last30Days.indexOf(sDate);
            if(index !== -1) salesData[index] += (s.price * s.qty);
        });

        let totalExpenses = 0;
        let expensesMap = {
            'Publicidad': 0, 'Empaque': 0, 'Envío': 0, 'Comisiones': 0, 'CompraInventario': 0, 'Otros': 0
        };
        expenses.forEach(e => {
            totalExpenses += e.amount;
            if (expensesMap[e.type] !== undefined) expensesMap[e.type] += e.amount;
            else expensesMap['Otros'] += e.amount;
        });

        // Cálculos Avanzados
        const netProfit = totalRevenue - totalCostOfGoodsSold - totalExpenses;
        const inventoryValue = p.stock * p.price;
        const totalInvestment = totalCostOfGoodsSold + totalExpenses + (p.stock * p.cost);
        const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const roi = totalInvestment > 0 ? (totalRevenue / totalInvestment) : 0;
        
        const daysIdle = lastSaleDate ? Math.floor((new Date() - lastSaleDate) / (1000 * 60 * 60 * 24)) : '-';
        const createdDate = p.createdAt ? new Date(p.createdAt) : new Date();
        const daysAlive = Math.max(1, Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24)));
        const avgMonth = Math.round(totalSold / (daysAlive / 30));
        const avgTicket = totalSold > 0 ? (totalRevenue / sales.length) : 0; // Por transacción
        
        // --- Populate Tab Resumen (Metrics) ---
        document.getElementById('pm-rev').textContent = `RD$${Math.round(totalRevenue).toLocaleString()}`;
        document.getElementById('pm-net').textContent = `RD$${Math.round(netProfit).toLocaleString()}`;
        document.getElementById('pm-net').className = 'value ' + (netProfit > 0 ? 'text-success' : 'text-danger');
        document.getElementById('pm-exp').textContent = `RD$${Math.round(totalExpenses).toLocaleString()}`;
        document.getElementById('pm-sold').textContent = totalSold;

        document.getElementById('pm-stock').textContent = p.stock;
        document.getElementById('pm-stock-val').textContent = `RD$${Math.round(inventoryValue).toLocaleString()}`;
        document.getElementById('pm-margin').textContent = `${margin.toFixed(1)}%`;
        document.getElementById('pm-roi').textContent = `x${roi.toFixed(2)}`;

        document.getElementById('pm-last-sale').textContent = lastSaleDate ? lastSaleDate.toLocaleDateString() : 'Nunca';
        document.getElementById('pm-days-idle').textContent = daysIdle;
        document.getElementById('pm-avg-month').textContent = avgMonth;
        document.getElementById('pm-ticket').textContent = `RD$${Math.round(avgTicket).toLocaleString()}`;

        // --- Populate Tab Gastos (Dashboard) ---
        document.getElementById('exp-total-val').textContent = `RD$${Math.round(totalExpenses).toLocaleString()}`;
        const costPerUnit = totalSold > 0 ? totalExpenses / totalSold : totalExpenses;
        document.getElementById('exp-avg-val').textContent = `RD$${Math.round(costPerUnit).toLocaleString()}`;

        // --- Init Charts ---
        if(prodSalesChartInstance) prodSalesChartInstance.destroy();
        const ctxSales = document.getElementById('prodSalesChart');
        if (ctxSales) {
            prodSalesChartInstance = new Chart(ctxSales, {
                type: 'line',
                data: { labels: last30Days, datasets: [{ label: 'Ventas (RD$)', data: salesData, borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.4 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid:{color:'#374151'} }, x: { grid:{display:false}, ticks: { maxTicksLimit: 10 } } } }
            });
        }

        if(prodExpensesChartInstance) prodExpensesChartInstance.destroy();
        const ctxExp = document.getElementById('prodExpensesChart');
        if (ctxExp) {
            const expLabels = Object.keys(expensesMap).filter(k => expensesMap[k] > 0);
            const expData = expLabels.map(k => expensesMap[k]);
            if (expData.length > 0) {
                prodExpensesChartInstance = new Chart(ctxExp, {
                    type: 'doughnut',
                    data: { labels: expLabels, datasets: [{ data: expData, backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'], borderWidth: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#9CA3AF' } } } }
                });
            } else {
                // Empty donut
                prodExpensesChartInstance = new Chart(ctxExp, {
                    type: 'doughnut', data: { labels: ['Sin Gastos'], datasets: [{ data: [1], backgroundColor: ['#374151'], borderWidth: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }
        }

        // Render Super Header Again with Metrics
        renderSuperHeader(p, { netProfit, margin, roi, daysIdle, totalSold });
    }

    function renderSuperHeader(p, metrics = null) {
        const shContainer = document.getElementById('super-header-container');
        if (!shContainer) return;

        let profitPerUnit = p.price - (p.cost + p.ads + p.pack + p.ship + p.comm + p.other);
        
        let stockPercent = p.minStock > 0 ? (p.stock / (p.minStock * 3)) * 100 : 100;
        if(stockPercent > 100) stockPercent = 100;
        let stockColorClass = p.stock === 0 ? 'out' : (p.stock <= p.minStock ? 'low' : 'good');
        
        let smartAlertsHTML = '';
        if (p.stock <= p.minStock && p.stock > 0) {
            smartAlertsHTML += `<div class="smart-alert alert-warning"><i class="ph ph-warning"></i> Solo quedan ${p.stock} unidades en inventario.</div>`;
        }
        if (p.stock === 0) {
            smartAlertsHTML += `<div class="smart-alert alert-warning" style="background: rgba(239, 68, 68, 0.1); border-left-color: #EF4444;"><i class="ph ph-warning-circle text-danger"></i> Producto agotado.</div>`;
        }
        if (metrics) {
            if (metrics.daysIdle > 30) smartAlertsHTML += `<div class="smart-alert"><i class="ph ph-clock"></i> Este producto lleva ${metrics.daysIdle} días sin venderse.</div>`;
            if (metrics.margin > 40) smartAlertsHTML += `<div class="smart-alert"><i class="ph ph-trend-up"></i> Este producto genera un margen alto (${metrics.margin.toFixed(1)}%).</div>`;
            if (metrics.totalSold > 50) smartAlertsHTML += `<div class="smart-alert"><i class="ph ph-star"></i> Producto Estrella (Más de 50 vendidos).</div>`;
        }

        shContainer.innerHTML = `
            <div class="super-header-top flex-between">
                <div style="display:flex; align-items:center; gap:16px;">
                    <div class="super-image"><i class="ph ph-package"></i></div>
                    <div class="super-title">
                        <h2>${p.name}</h2>
                        <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px;">
                            <span><i class="ph ph-folder"></i> ${p.category}</span> &bull; 
                            <span><i class="ph ph-barcode"></i> SKU: ${p.sku || p.code || 'N/A'}</span>
                        </div>
                        <div class="super-badges">
                            <span class="super-badge ${p.status === 'active' ? 'bg-success-soft' : 'bg-warning-soft'}"><i class="ph ph-activity"></i> ${p.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                            <span class="super-badge"><i class="ph ph-stack"></i> Stock: ${p.stock}</span>
                            <span class="super-badge"><i class="ph ph-money"></i> Ganan./und: RD$${Math.round(profitPerUnit).toLocaleString()}</span>
                            ${metrics ? `<span class="super-badge"><i class="ph ph-percent"></i> Margen: ${metrics.margin.toFixed(1)}%</span>` : ''}
                            ${metrics ? `<span class="super-badge"><i class="ph ph-arrows-merge"></i> ROI: x${metrics.roi.toFixed(2)}</span>` : ''}
                        </div>
                    </div>
                </div>
                <button class="btn btn-outline text-primary btn-sm" onclick="generateReport('product', '${p.id}', '${p.name}')" title="Generar Reporte"><i class="ph ph-file-text"></i></button>
            </div>
            
            <div class="stock-bar-container">
                <div class="stock-bar-fill ${stockColorClass}" style="width: ${stockPercent}%;"></div>
            </div>

            ${smartAlertsHTML ? `<div class="smart-alerts-container mt-2">${smartAlertsHTML}</div>` : ''}
        `;
    }

    // --- View Specific Init functions ---
    function initProductsView() {
        loadProductsTable();
        const sortDropdown = document.getElementById('sort-products');
        if(sortDropdown) {
            // Remove previous event listeners if initialized multiple times
            const newDropdown = sortDropdown.cloneNode(true);
            sortDropdown.parentNode.replaceChild(newDropdown, sortDropdown);
            newDropdown.addEventListener('change', () => {
                loadProductsTable();
            });
        }
    }

    async function initDashboard() {
        const allSales = await db.sales.toArray();
        const allExpenses = await db.expenses.toArray();

        let totalRevenue = 0;
        let totalSold = 0;
        let totalCogs = 0;

        allSales.forEach(s => {
            totalRevenue += (s.price * s.qty);
            totalSold += s.qty;
            totalCogs += s.totalCost;
        });

        let totalExpenses = 0;
        allExpenses.forEach(e => {
            totalExpenses += e.amount;
        });

        const netProfit = totalRevenue - totalCogs - totalExpenses;

        const elRev = document.getElementById('dash-global-revenue');
        const elSold = document.getElementById('dash-global-sold');
        const elExp = document.getElementById('dash-global-expenses');
        const elProf = document.getElementById('dash-global-profit');

        if(elRev) elRev.textContent = `RD$ ${Math.round(totalRevenue).toLocaleString()}`;
        if(elSold) elSold.textContent = totalSold;
        if(elExp) elExp.textContent = `RD$ ${Math.round(totalExpenses).toLocaleString()}`;
        if(elProf) {
            elProf.textContent = `RD$ ${Math.round(netProfit).toLocaleString()}`;
            elProf.className = 'stat-value ' + (netProfit > 0 ? 'text-success' : (netProfit < 0 ? 'text-danger' : 'text-main'));
        }

        // Render Sales Numbers instead of Chart
        const salesNumbersContainer = document.getElementById('dash-sales-numbers');
        if (salesNumbersContainer) {
            // Generar los últimos 7 días y sumar sus ventas (ingresos brutos)
            salesNumbersContainer.innerHTML = '';
            
            for(let i=6; i>=0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateString = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('es-ES', {weekday: 'long'});
                const formattedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

                let daySum = 0;
                allSales.forEach(s => {
                    if(s.date.startsWith(dateString)) {
                        daySum += (s.price * s.qty);
                    }
                });

                salesNumbersContainer.innerHTML += `
                    <div class="flex-between mb-2 p-2 rounded" style="background-color: rgba(0,0,0,0.15);">
                        <span class="text-muted" style="font-weight: 500;">${formattedDay}</span>
                        <strong class="${daySum > 0 ? 'text-success' : 'text-muted'}" style="font-size: 1.05rem;">RD$ ${daySum.toLocaleString()}</strong>
                    </div>
                `;
            }
        }

        // --- Alertas Inteligentes de Apartados en el Dashboard ---
        const allLayaways = await db.layaways.toArray();
        const pendingLayaways = allLayaways.filter(l => l.status === 'pending');
        
        pendingLayaways.forEach(l => {
            const expected = new Date(new Date(l.date).getTime() + (15 * 24 * 60 * 60 * 1000));
            l.diffDays = Math.ceil((expected - new Date()) / (1000 * 60 * 60 * 24));
        });
        
        pendingLayaways.sort((a, b) => a.diffDays - b.diffDays);
        
        const activityList = document.getElementById('dash-activity-list');
        if (activityList) {
            activityList.innerHTML = '';
            
            if (pendingLayaways.length > 0) {
                const top5 = pendingLayaways.slice(0, 5);
                for (const l of top5) {
                    const prod = await db.products.get(l.productId);
                    const prodName = prod ? prod.name : 'Producto Eliminado';
                    
                    let badge = '';
                    if (l.diffDays < 0) badge = '<span class="badge badge-red">Atrasado</span>';
                    else if (l.diffDays <= 3) badge = `<span class="badge badge-yellow">Quedan ${l.diffDays} días</span>`;
                    else badge = `<span class="badge badge-green">Quedan ${l.diffDays} días</span>`;

                    activityList.innerHTML += `
                        <div class="activity-item p-3 mb-2 rounded" style="background: rgba(0,0,0,0.1); border-left: 3px solid ${l.diffDays <= 3 ? '#F59E0B' : '#374151'}; cursor:pointer;" onclick="editProduct(${l.productId})">
                            <div class="flex-between">
                                <strong>${l.customer}</strong>
                                ${badge}
                            </div>
                            <div class="text-muted" style="font-size: 0.85rem; margin-top: 4px;">${prodName} (x${l.qty}) - Total: RD$${l.totalAmount.toLocaleString()}</div>
                        </div>
                    `;
                }
            } else {
                activityList.innerHTML = '<p class="text-muted text-center mt-4">No hay apartados pendientes.</p>';
            }
        }

        // Mostrar Toast si hay apartados a punto de vencer
        const expiring = pendingLayaways.filter(l => l.diffDays <= 3);
        if (expiring.length > 0) {
            const top3 = expiring.slice(0, 3);
            const msg = top3.map(l => `• <b>${l.customer}</b> (${l.diffDays < 0 ? 'Atrasado' : l.diffDays + ' días'})`).join('<br>');
            
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Apartados por vencer',
                html: msg,
                showConfirmButton: false,
                timer: 6000,
                timerProgressBar: true,
                background: 'var(--bg-card)',
                color: 'var(--text-main)'
            });
        }
    }

    // --- REPORTS LOGIC ---
    window.generateReport = async function(type, productId = null, productName = 'Global') {
        const title = type === 'global' ? 'Reporte Financiero Global' : `Reporte: ${productName}`;
        
        await Swal.fire({
            title: title,
            html: `
                <div style="text-align: left; margin-top: 10px;" id="report-controls">
                    <label>Selecciona el Período:</label>
                    <div style="display:flex; gap:10px;">
                        <select id="swal-report-range" class="swal2-input" onchange="window.updateReportView('${type}', '${productId}')" style="margin:0; flex:1;">
                            <option value="7">Esta Semana (7 días)</option>
                            <option value="30" selected>Este Mes (30 días)</option>
                            <option value="90">Este Trimestre (90 días)</option>
                            <option value="all">Histórico Completo</option>
                        </select>
                        <button class="btn btn-outline text-success" onclick="window.exportExcel('${type}', '${productId}', '${productName}')" title="Descargar Excel"><i class="ph ph-file-xls"></i> Excel</button>
                    </div>
                </div>
                <div id="swal-report-content" style="margin-top:20px; min-height:150px; text-align:left;">
                    <div class="text-center text-muted"><i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i><br>Cargando datos...</div>
                </div>
            `,
            width: '700px',
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonText: '<i class="ph ph-printer"></i> Descargar PDF / Imprimir',
            showCancelButton: true,
            cancelButtonText: 'Cerrar',
            didOpen: () => {
                window.updateReportView(type, productId);
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // PDF Export using native print which is styled via @media print
                window.print();
            }
        });
    };

    window.updateReportView = async function(type, productId) {
        const contentDiv = document.getElementById('swal-report-content');
        if(!contentDiv) return;
        contentDiv.innerHTML = '<div class="text-center text-muted"><i class="ph ph-spinner ph-spin" style="font-size: 2rem;"></i><br>Calculando...</div>';
        
        const range = document.getElementById('swal-report-range').value;
        const cutoffDate = new Date();
        if (range !== 'all') {
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(range));
        }

        let sales = [];
        let expenses = [];
        let products = [];

        if (type === 'global') {
            sales = await db.sales.toArray();
            expenses = await db.expenses.toArray();
            products = await db.products.toArray();
        } else {
            const pid = Number(productId);
            sales = await db.sales.where({productId: pid}).toArray();
            expenses = await db.expenses.where({productId: pid}).toArray();
            const p = await db.products.get(pid);
            if (p) products.push(p);
        }

        if (range !== 'all') {
            sales = sales.filter(s => new Date(s.date) >= cutoffDate);
            expenses = expenses.filter(e => new Date(e.date) >= cutoffDate);
        }

        let rev = 0, cogs = 0, soldQty = 0, txCount = 0;
        sales.forEach(s => {
            rev += (s.price * s.qty);
            cogs += s.totalCost;
            soldQty += s.qty;
            txCount++;
        });

        let expTot = 0;
        expenses.forEach(e => expTot += e.amount);

        const net = rev - cogs - expTot;
        const gross = rev - cogs;
        const margin = rev > 0 ? (net / rev) * 100 : 0;
        const grossMargin = rev > 0 ? (gross / rev) * 100 : 0;
        const roi = cogs + expTot > 0 ? (rev / (cogs + expTot)) : 0;
        const ticket = txCount > 0 ? (rev / txCount) : 0;

        let totalStock = 0;
        products.forEach(p => { totalStock += p.stock; });

        // Pending layaways value
        const allLayaways = type === 'global'
            ? await db.layaways.where({ status: 'pending' }).toArray()
            : await db.layaways.where({ productId: Number(productId), status: 'pending' }).toArray();
        const pendingLayawayValue = allLayaways.reduce((acc, l) => acc + l.totalAmount, 0);
        const pendingLayawayCount = allLayaways.length;

        // Recent sales (last 5)
        const recentSales = [...sales].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        // Store globally for Excel Export
        window.currentReportData = { rev, cogs, soldQty, expTot, net, gross, grossMargin, margin, roi, ticket, totalStock, sales, expenses, range, pendingLayawayValue, pendingLayawayCount };

        const fmt = n => Math.round(n).toLocaleString();
        const netColor = net >= 0 ? '#10B981' : '#EF4444';
        const rangeLabel = range === '7' ? '7 días' : range === '30' ? '30 días' : range === '90' ? '90 días' : 'Histórico';

        const recentSalesRows = recentSales.length > 0
            ? recentSales.map(s => `
                <tr>
                    <td style="padding:6px 8px;font-size:0.82rem;color:#9CA3AF;">${new Date(s.date).toLocaleDateString()}</td>
                    <td style="padding:6px 8px;font-size:0.82rem;">${s.customer}</td>
                    <td style="padding:6px 8px;font-size:0.82rem;text-align:center;">${s.qty}</td>
                    <td style="padding:6px 8px;font-size:0.82rem;color:#3B82F6;">RD$${fmt(s.price * s.qty)}</td>
                    <td style="padding:6px 8px;font-size:0.82rem;color:${(s.price*s.qty - s.totalCost)>=0?'#10B981':'#EF4444'}">RD$${fmt(s.price*s.qty - s.totalCost)}</td>
                </tr>`).join('')
            : `<tr><td colspan="5" style="text-align:center;color:#9CA3AF;padding:12px;">Sin ventas en este período</td></tr>`;

        contentDiv.innerHTML = `
            <!-- KPI Grid -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:14px;">
                <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:0.72rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Ingresos Brutos</div>
                    <div style="font-size:1.1rem;font-weight:700;color:#10B981;">RD$${fmt(rev)}</div>
                </div>
                <div style="background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:0.72rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Ganancia Neta</div>
                    <div style="font-size:1.1rem;font-weight:700;color:${netColor};">RD$${fmt(net)}</div>
                </div>
                <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:0.72rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Gastos Operativos</div>
                    <div style="font-size:1.1rem;font-weight:700;color:#EF4444;">RD$${fmt(expTot)}</div>
                </div>
                <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:0.72rem;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Uds. Vendidas</div>
                    <div style="font-size:1.1rem;font-weight:700;color:#F59E0B;">${soldQty}</div>
                </div>
            </div>

            <!-- Secondary Metrics -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:14px;">
                <div style="background:var(--bg-main,#0B0F19);border:1px solid #374151;border-radius:8px;padding:10px;text-align:center;">
                    <div style="font-size:0.72rem;color:#9CA3AF;margin-bottom:3px;">Margen Neto</div>
                    <div style="font-size:1rem;font-weight:600;color:${margin>=20?'#10B981':'#F59E0B'};">${margin.toFixed(1)}%</div>
                </div>
                <div style="background:var(--bg-main,#0B0F19);border:1px solid #374151;border-radius:8px;padding:10px;text-align:center;">
                    <div style="font-size:0.72rem;color:#9CA3AF;margin-bottom:3px;">ROI</div>
                    <div style="font-size:1rem;font-weight:600;">x${roi.toFixed(2)}</div>
                </div>
                <div style="background:var(--bg-main,#0B0F19);border:1px solid #374151;border-radius:8px;padding:10px;text-align:center;">
                    <div style="font-size:0.72rem;color:#9CA3AF;margin-bottom:3px;">Ticket Promedio</div>
                    <div style="font-size:1rem;font-weight:600;">RD$${fmt(ticket)}</div>
                </div>
                <div style="background:var(--bg-main,#0B0F19);border:1px solid #374151;border-radius:8px;padding:10px;text-align:center;">
                    <div style="font-size:0.72rem;color:#9CA3AF;margin-bottom:3px;">Apartados Activos</div>
                    <div style="font-size:1rem;font-weight:600;color:#A855F7;">${pendingLayawayCount} <small style="font-size:0.7rem">(RD$${fmt(pendingLayawayValue)})</small></div>
                </div>
            </div>

            <!-- COGS Bar -->
            <div style="background:var(--bg-main,#0B0F19);border:1px solid #374151;border-radius:8px;padding:12px;margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span style="font-size:0.8rem;color:#9CA3AF;">Costo Mercancía Vendida (COGS)</span>
                    <strong>RD$${fmt(cogs)}</strong>
                </div>
                <div style="height:6px;background:#374151;border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:${rev > 0 ? Math.min(100,(cogs/rev)*100) : 0}%;background:#EF4444;border-radius:4px;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:8px;">
                    <span style="font-size:0.8rem;color:#9CA3AF;">Ganancia Bruta (antes de gastos op.)</span>
                    <strong style="color:#10B981;">RD$${fmt(gross)} (${grossMargin.toFixed(1)}%)</strong>
                </div>
            </div>

            <!-- Recent Sales Table -->
            <div style="font-size:0.78rem;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">
                Ventas Recientes — ${rangeLabel}
            </div>
            <div style="overflow-x:auto;border-radius:8px;border:1px solid #374151;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#1F2937;">
                            <th style="padding:8px;text-align:left;font-size:0.75rem;color:#9CA3AF;">Fecha</th>
                            <th style="padding:8px;text-align:left;font-size:0.75rem;color:#9CA3AF;">Cliente</th>
                            <th style="padding:8px;text-align:center;font-size:0.75rem;color:#9CA3AF;">Uds</th>
                            <th style="padding:8px;text-align:left;font-size:0.75rem;color:#9CA3AF;">Ingreso</th>
                            <th style="padding:8px;text-align:left;font-size:0.75rem;color:#9CA3AF;">Ganancia</th>
                        </tr>
                    </thead>
                    <tbody>${recentSalesRows}</tbody>
                </table>
            </div>
        `;
    };


    window.exportExcel = function(type, productId, productName) {
        if (!window.XLSX) {
            Swal.fire('Error', 'Librería Excel no cargada. Revisa tu conexión a internet.', 'error');
            return;
        }
        
        const data = window.currentReportData;
        if (!data) return;

        // Hoja 1: Resumen
        const wsResumen = XLSX.utils.aoa_to_sheet([
            ["Reporte Financiero PRISMAR", productName],
            ["Periodo (días)", data.range],
            [],
            ["MÉTRICA", "VALOR"],
            ["Ingresos Brutos (RD$)", Math.round(data.rev)],
            ["Ganancia Neta Pura (RD$)", Math.round(data.net)],
            ["Gastos del Periodo (RD$)", Math.round(data.expTot)],
            ["Costo Mercancía Vendida (COGS)", Math.round(data.cogs)],
            ["Unidades Vendidas", data.soldQty],
            ["Inventario Activo (uds)", data.totalStock],

            ["Margen Neto Operativo (%)", data.margin.toFixed(2)],
            ["ROI Multiplicador", data.roi.toFixed(2)],
            ["Ticket Promedio (RD$)", Math.round(data.ticket)]
        ]);

        // Hoja 2: Ventas
        const salesRows = data.sales.map(s => ({
            Fecha: new Date(s.date).toLocaleDateString(),
            Cliente: s.customer,
            Metodo_Pago: s.paymentMethod || 'Efectivo',
            Cantidad: s.qty,
            Ingreso_Total: s.price * s.qty,
            Costo_Total: s.totalCost,
            Ganancia: (s.price * s.qty) - s.totalCost,
            Origen: s.source
        }));
        const wsVentas = XLSX.utils.json_to_sheet(salesRows);

        // Hoja 3: Gastos
        const expensesRows = data.expenses.map(e => ({
            Fecha: new Date(e.date).toLocaleDateString(),
            Categoria: e.type,
            Monto: e.amount,
            Descripcion: e.description || ''
        }));
        const wsGastos = XLSX.utils.json_to_sheet(expensesRows);

        // Crear Libro
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
        XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas");
        XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos");

        // Descargar
        XLSX.writeFile(wb, `Reporte_PRISMAR_${productName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // =========================================================================
    // MODULO DE COMPRAS E INVENTARIO (Multi-artículo, prorrateo y stock auto)
    // =========================================================================
    const modalPurchase = document.getElementById('modal-purchase');
    const modalPurchaseDetail = document.getElementById('modal-purchase-detail');
    const btnNewPurchase = document.getElementById('btn-new-purchase');
    const quickNewPurchase = document.getElementById('quick-new-purchase');
    const btnClosePurchaseModal = document.getElementById('btn-close-purchase-modal');
    const btnClosePurchaseDetailModal = document.getElementById('btn-close-purchase-detail-modal');
    const btnClosePurchaseDetail = document.getElementById('btn-close-purchase-detail');
    const btnCancelPurchase = document.getElementById('btn-cancel-purchase');
    const formPurchase = document.getElementById('form-purchase');
    const btnAddPurchaseItem = document.getElementById('btn-add-purchase-item');
    const purchaseItemsTbody = document.getElementById('purchase-items-tbody');
    const searchPurchases = document.getElementById('search-purchases');
    const distMethodSelect = document.getElementById('purchase-expense-dist-method');

    // Abrir Modal de Nueva Compra
    async function openPurchaseModal() {
        if (!modalPurchase) return;
        if (formPurchase) formPurchase.reset();
        if (purchaseItemsTbody) purchaseItemsTbody.innerHTML = '';
        
        // Generar Número de Compra correlativo
        const allPurchases = await db.purchases.toArray();
        const nextNum = allPurchases.length + 1;
        document.getElementById('purchase-number').value = `COMP-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
        document.getElementById('purchase-date').value = new Date().toISOString().split('T')[0];
        
        // Fila inicial
        await addPurchaseItemRow();
        
        recalculatePurchaseTotals();
        
        modalPurchase.style.display = 'flex';
        void modalPurchase.offsetWidth;
        modalPurchase.classList.add('active');
    }

    function closePurchaseModal() {
        if (!modalPurchase) return;
        modalPurchase.classList.remove('active');
        setTimeout(() => {
            modalPurchase.style.display = 'none';
        }, 200);
    }

    function closePurchaseDetailModal() {
        if (!modalPurchaseDetail) return;
        modalPurchaseDetail.classList.remove('active');
        setTimeout(() => {
            modalPurchaseDetail.style.display = 'none';
        }, 200);
    }

    if (btnNewPurchase) btnNewPurchase.addEventListener('click', openPurchaseModal);
    if (quickNewPurchase) quickNewPurchase.addEventListener('click', openPurchaseModal);
    if (btnClosePurchaseModal) btnClosePurchaseModal.addEventListener('click', closePurchaseModal);
    if (btnCancelPurchase) btnCancelPurchase.addEventListener('click', closePurchaseModal);
    if (btnClosePurchaseDetailModal) btnClosePurchaseDetailModal.addEventListener('click', closePurchaseDetailModal);
    if (btnClosePurchaseDetail) btnClosePurchaseDetail.addEventListener('click', closePurchaseDetailModal);

    // Constructor dinámico de filas de artículo
    async function addPurchaseItemRow(defaultProdId = null) {
        if (!purchaseItemsTbody) return;
        const products = await db.products.toArray();
        if (products.length === 0) {
            Swal.fire('Atención', 'No tienes productos registrados en el inventario. Crea productos primero.', 'warning');
            return;
        }

        const tr = document.createElement('tr');
        tr.className = 'purchase-item-row';

        let prodOptionsHTML = `<option value="">-- Seleccionar Artículo --</option>`;
        products.forEach(p => {
            const selected = (defaultProdId && String(p.id) === String(defaultProdId)) ? 'selected' : '';
            prodOptionsHTML += `<option value="${p.id}" data-cost="${p.cost || 0}" ${selected}>${p.name} (Stock: ${p.stock || 0})</option>`;
        });

        tr.innerHTML = `
            <td>
                <select class="purchase-item-product select-style" required style="width: 100%; padding: 6px 8px; font-weight: 500; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px;">
                    ${prodOptionsHTML}
                </select>
            </td>
            <td>
                <input type="number" class="purchase-item-qty input-style" value="1" min="1" required style="width: 100%; padding: 6px; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px;">
            </td>
            <td>
                <input type="number" class="purchase-item-cost input-style" value="0" min="0" step="any" required style="width: 100%; padding: 6px; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px;">
            </td>
            <td>
                <strong class="purchase-item-subtotal text-primary" style="font-size: 0.95rem;">RD$ 0</strong>
            </td>
            <td>
                <span class="purchase-item-dist-expense text-warning" style="font-size: 0.85rem;">+RD$ 0</span>
            </td>
            <td>
                <strong class="purchase-item-real-unit-cost text-success" style="font-size: 0.95rem;">RD$ 0</strong>
            </td>
            <td style="text-align: center;">
                <button type="button" class="btn btn-sm btn-outline text-danger btn-remove-item" title="Eliminar fila" style="padding: 4px 8px;">
                    <i class="ph ph-trash"></i>
                </button>
            </td>
        `;

        purchaseItemsTbody.appendChild(tr);

        const prodSelect = tr.querySelector('.purchase-item-product');
        const qtyInput = tr.querySelector('.purchase-item-qty');
        const costInput = tr.querySelector('.purchase-item-cost');
        const removeBtn = tr.querySelector('.btn-remove-item');

        prodSelect.addEventListener('change', () => {
            const selectedOpt = prodSelect.options[prodSelect.selectedIndex];
            if (selectedOpt && selectedOpt.dataset.cost) {
                costInput.value = parseFloat(selectedOpt.dataset.cost) || 0;
            }
            recalculatePurchaseTotals();
        });

        qtyInput.addEventListener('input', recalculatePurchaseTotals);
        costInput.addEventListener('input', recalculatePurchaseTotals);

        removeBtn.addEventListener('click', () => {
            if (purchaseItemsTbody.children.length <= 1) {
                Swal.fire('Atención', 'La compra debe contener al menos un artículo.', 'info');
                return;
            }
            tr.remove();
            recalculatePurchaseTotals();
        });

        if (defaultProdId) {
            const selectedOpt = prodSelect.options[prodSelect.selectedIndex];
            if (selectedOpt && selectedOpt.dataset.cost) {
                costInput.value = parseFloat(selectedOpt.dataset.cost) || 0;
            }
        }

        recalculatePurchaseTotals();
    }

    if (btnAddPurchaseItem) {
        btnAddPurchaseItem.addEventListener('click', () => addPurchaseItemRow());
    }

    document.querySelectorAll('.purchase-expense-input').forEach(input => {
        input.addEventListener('input', recalculatePurchaseTotals);
    });
    if (distMethodSelect) {
        distMethodSelect.addEventListener('change', recalculatePurchaseTotals);
    }

    // Motor de cálculo de la compra y prorrateo de gastos adicionales
    function recalculatePurchaseTotals() {
        if (!purchaseItemsTbody) return;
        const rows = purchaseItemsTbody.querySelectorAll('.purchase-item-row');
        
        let merchandiseSubtotal = 0;
        let totalUnits = 0;
        
        const rowDataList = [];

        rows.forEach(tr => {
            const qty = parseInt(tr.querySelector('.purchase-item-qty').value) || 0;
            const unitCost = parseFloat(tr.querySelector('.purchase-item-cost').value) || 0;
            const subtotal = qty * unitCost;

            merchandiseSubtotal += subtotal;
            totalUnits += qty;

            rowDataList.push({
                tr,
                qty,
                unitCost,
                subtotal
            });
        });

        // Gastos adicionales
        const expShipping = parseFloat(document.getElementById('exp-shipping')?.value) || 0;
        const expTransport = parseFloat(document.getElementById('exp-transport')?.value) || 0;
        const expCustoms = parseFloat(document.getElementById('exp-customs')?.value) || 0;
        const expPackaging = parseFloat(document.getElementById('exp-packaging')?.value) || 0;
        const expOthers = parseFloat(document.getElementById('exp-others')?.value) || 0;

        const totalAdditionalExpenses = expShipping + expTransport + expCustoms + expPackaging + expOthers;
        const finalTotal = merchandiseSubtotal + totalAdditionalExpenses;

        const distMethod = distMethodSelect ? distMethodSelect.value : 'value';

        // Prorrateo por fila
        rowDataList.forEach(data => {
            let allocatedExpense = 0;
            if (totalAdditionalExpenses > 0) {
                if (distMethod === 'value' && merchandiseSubtotal > 0) {
                    allocatedExpense = (data.subtotal / merchandiseSubtotal) * totalAdditionalExpenses;
                } else if (distMethod === 'qty' && totalUnits > 0) {
                    allocatedExpense = (data.qty / totalUnits) * totalAdditionalExpenses;
                }
            }

            const realLandedUnitCost = data.qty > 0 ? ((data.subtotal + allocatedExpense) / data.qty) : 0;

            data.tr.querySelector('.purchase-item-subtotal').textContent = `RD$ ${Math.round(data.subtotal).toLocaleString()}`;
            data.tr.querySelector('.purchase-item-dist-expense').textContent = `+RD$ ${Math.round(allocatedExpense).toLocaleString()}`;
            data.tr.querySelector('.purchase-item-real-unit-cost').textContent = `RD$ ${Math.round(realLandedUnitCost).toLocaleString()}`;
        });

        // Resumen
        const elSubtotal = document.getElementById('summary-merchandise-subtotal');
        const elExpenses = document.getElementById('summary-additional-expenses');
        const elFinal = document.getElementById('summary-final-total');

        if (elSubtotal) elSubtotal.textContent = `RD$ ${Math.round(merchandiseSubtotal).toLocaleString()}`;
        if (elExpenses) elExpenses.textContent = `+RD$ ${Math.round(totalAdditionalExpenses).toLocaleString()}`;
        if (elFinal) elFinal.textContent = `RD$ ${Math.round(finalTotal).toLocaleString()}`;
    }

    // Registro de Compra y Actualización Automática de Inventario
    if (formPurchase) {
        formPurchase.addEventListener('submit', async (e) => {
            e.preventDefault();

            const rows = purchaseItemsTbody.querySelectorAll('.purchase-item-row');
            if (rows.length === 0) {
                Swal.fire('Atención', 'Debes agregar al menos un artículo a la compra.', 'warning');
                return;
            }

            const purchaseNumber = document.getElementById('purchase-number').value;
            const supplier = document.getElementById('purchase-supplier').value || 'Sin especificar';
            const purchaseDate = document.getElementById('purchase-date').value || new Date().toISOString().split('T')[0];

            const expShipping = parseFloat(document.getElementById('exp-shipping').value) || 0;
            const expTransport = parseFloat(document.getElementById('exp-transport').value) || 0;
            const expCustoms = parseFloat(document.getElementById('exp-customs').value) || 0;
            const expPackaging = parseFloat(document.getElementById('exp-packaging').value) || 0;
            const expOthers = parseFloat(document.getElementById('exp-others').value) || 0;

            const totalAdditionalExpenses = expShipping + expTransport + expCustoms + expPackaging + expOthers;
            const distMethod = distMethodSelect ? distMethodSelect.value : 'value';

            const items = [];
            let merchandiseSubtotal = 0;
            let totalUnits = 0;

            for (const tr of rows) {
                const prodId = parseInt(tr.querySelector('.purchase-item-product').value);
                const qty = parseInt(tr.querySelector('.purchase-item-qty').value) || 0;
                const unitCost = parseFloat(tr.querySelector('.purchase-item-cost').value) || 0;

                if (!prodId) {
                    Swal.fire('Atención', 'Por favor selecciona un artículo válido en cada fila.', 'warning');
                    return;
                }
                if (qty <= 0) {
                    Swal.fire('Atención', 'La cantidad de cada artículo debe ser mayor a 0.', 'warning');
                    return;
                }

                const prod = await db.products.get(prodId);
                const productName = prod ? prod.name : 'Producto Desconocido';
                const subtotal = qty * unitCost;

                merchandiseSubtotal += subtotal;
                totalUnits += qty;

                items.push({
                    productId: prodId,
                    productName,
                    qty,
                    unitCost,
                    subtotal
                });
            }

            // Distribuir gastos entre los artículos
            items.forEach(item => {
                let allocatedExpense = 0;
                if (totalAdditionalExpenses > 0) {
                    if (distMethod === 'value' && merchandiseSubtotal > 0) {
                        allocatedExpense = (item.subtotal / merchandiseSubtotal) * totalAdditionalExpenses;
                    } else if (distMethod === 'qty' && totalUnits > 0) {
                        allocatedExpense = (item.qty / totalUnits) * totalAdditionalExpenses;
                    }
                }
                item.allocatedExpense = Math.round(allocatedExpense * 100) / 100;
                item.realUnitCost = Math.round(((item.subtotal + allocatedExpense) / item.qty) * 100) / 100;
                item.totalLandedCost = Math.round((item.subtotal + allocatedExpense) * 100) / 100;
            });

            const finalTotalAmount = merchandiseSubtotal + totalAdditionalExpenses;

            const purchaseRecord = {
                purchaseNumber,
                date: purchaseDate,
                supplier,
                user: 'Administrador',
                items,
                expensesBreakdown: {
                    shipping: expShipping,
                    transport: expTransport,
                    customs: expCustoms,
                    packaging: expPackaging,
                    others: expOthers
                },
                totalAdditionalExpenses,
                merchandiseSubtotal,
                totalAmount: finalTotalAmount,
                distMethod,
                totalUnits,
                createdAt: new Date().toISOString()
            };

            // 1. Guardar Registro de Compra
            await db.purchases.add(purchaseRecord);

            // 2. AUMENTAR INVENTARIO DE CADA ARTÍCULO Y ACTUALIZAR COSTO UNITARIO REAL
            for (const item of items) {
                const prod = await db.products.get(item.productId);
                if (prod) {
                    const newStock = (prod.stock || 0) + item.qty;
                    await db.products.update(prod.id, { 
                        stock: newStock,
                        cost: item.realUnitCost
                    });
                }
            }

            closePurchaseModal();
            Swal.fire({
                icon: 'success',
                title: '¡Compra Registrada!',
                html: `Se registró la compra <b>${purchaseNumber}</b> por un total de <b>RD$ ${finalTotalAmount.toLocaleString()}</b>.<br>Se actualizó automáticamente el inventario de todos los artículos.`,
                timer: 3000,
                showConfirmButton: true
            });

            initPurchasesView();
            initProductsView();
        });
    }

    // Renderizar Historial de Compras
    async function initPurchasesView() {
        const tbody = document.getElementById('purchases-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const allPurchases = await db.purchases.toArray();
        allPurchases.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

        const query = (document.getElementById('search-purchases')?.value || '').toLowerCase().trim();
        const filtered = allPurchases.filter(p => {
            if (!query) return true;
            return (p.purchaseNumber && p.purchaseNumber.toLowerCase().includes(query)) ||
                   (p.supplier && p.supplier.toLowerCase().includes(query));
        });

        let grandTotalCount = allPurchases.length;
        let grandTotalItems = 0;
        let grandTotalAmount = 0;

        allPurchases.forEach(p => {
            grandTotalAmount += (p.totalAmount || 0);
            if (p.items) {
                p.items.forEach(i => grandTotalItems += (i.qty || 0));
            }
        });

        const elCount = document.getElementById('purchases-total-count');
        const elItems = document.getElementById('purchases-total-items');
        const elAmount = document.getElementById('purchases-total-amount');

        if (elCount) elCount.textContent = grandTotalCount;
        if (elItems) elItems.textContent = grandTotalItems;
        if (elAmount) elAmount.textContent = `RD$ ${Math.round(grandTotalAmount).toLocaleString()}`;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted p-4">No hay compras registradas.</td></tr>`;
            return;
        }

        filtered.forEach(p => {
            const tr = document.createElement('tr');
            const totalUnits = p.totalUnits || (p.items ? p.items.reduce((acc, i) => acc + i.qty, 0) : 0);
            const itemCount = p.items ? p.items.length : 0;
            const itemsSummaryText = `${itemCount} artículo${itemCount !== 1 ? 's' : ''} (${totalUnits} uds)`;

            tr.innerHTML = `
                <td><strong class="text-primary">${p.purchaseNumber}</strong></td>
                <td><small class="text-muted">${new Date(p.date).toLocaleDateString()}</small></td>
                <td><strong>${p.supplier || 'Sin especificar'}</strong></td>
                <td><span class="badge bg-darker border">📦 ${itemsSummaryText}</span></td>
                <td>RD$ ${Math.round(p.merchandiseSubtotal || 0).toLocaleString()}</td>
                <td class="text-warning">+RD$ ${Math.round(p.totalAdditionalExpenses || 0).toLocaleString()}</td>
                <td><strong class="text-success" style="font-size: 1.05rem;">RD$ ${Math.round(p.totalAmount || 0).toLocaleString()}</strong></td>
                <td><small class="text-muted"><i class="ph ph-user"></i> ${p.user || 'Administrador'}</small></td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn btn-sm btn-outline text-primary" onclick="viewPurchaseDetail(${p.id})" title="Ver recibo / detalle"><i class="ph ph-eye"></i></button>
                        <button class="btn btn-sm btn-outline text-danger" onclick="deletePurchase(${p.id})" title="Eliminar compra"><i class="ph ph-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    if (searchPurchases) {
        searchPurchases.addEventListener('input', initPurchasesView);
    }

    // Ver Recibo / Detalle completo de la Compra
    window.viewPurchaseDetail = async function(id) {
        const purchase = await db.purchases.get(id);
        if (!purchase) return;

        document.getElementById('purchase-detail-number').textContent = purchase.purchaseNumber;
        const container = document.getElementById('purchase-detail-content');

        let itemsRowsHTML = '';
        if (purchase.items) {
            purchase.items.forEach(item => {
                itemsRowsHTML += `
                    <tr>
                        <td><strong>${item.productName}</strong></td>
                        <td>${item.qty} uds</td>
                        <td>RD$ ${Math.round(item.unitCost).toLocaleString()}</td>
                        <td>RD$ ${Math.round(item.subtotal).toLocaleString()}</td>
                        <td class="text-warning">+RD$ ${Math.round(item.allocatedExpense || 0).toLocaleString()}</td>
                        <td><strong class="text-success">RD$ ${Math.round(item.realUnitCost || item.unitCost).toLocaleString()}</strong></td>
                        <td><strong class="text-info">RD$ ${Math.round(item.totalLandedCost || item.subtotal).toLocaleString()}</strong></td>
                    </tr>
                `;
            });
        }

        const exp = purchase.expensesBreakdown || {};

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom: 20px; flex-wrap:wrap; gap:12px;" class="card bg-darker p-3">
                <div>
                    <span class="text-muted" style="font-size:0.85rem;">Proveedor:</span><br>
                    <strong style="font-size:1.1rem;">${purchase.supplier}</strong>
                </div>
                <div>
                    <span class="text-muted" style="font-size:0.85rem;">Fecha de Compra:</span><br>
                    <strong>${new Date(purchase.date).toLocaleDateString()}</strong>
                </div>
                <div>
                    <span class="text-muted" style="font-size:0.85rem;">Registrado Por:</span><br>
                    <strong><i class="ph ph-user"></i> ${purchase.user || 'Administrador'}</strong>
                </div>
            </div>

            <h3 class="mb-2" style="font-size: 1rem; color: var(--primary);"><i class="ph ph-package"></i> Lista de Artículos Comprados</h3>
            <div class="table-responsive mb-4">
                <table class="table" style="font-size: 0.9rem;">
                    <thead>
                        <tr>
                            <th>Artículo</th>
                            <th>Cant.</th>
                            <th>Costo Base Unit.</th>
                            <th>Subtotal</th>
                            <th>Gasto Adic. Prorrateado</th>
                            <th>Costo Real Unit.</th>
                            <th>Costo Total Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRowsHTML}
                    </tbody>
                </table>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
                <div class="card bg-darker p-3 border border-color">
                    <h4 style="font-size: 0.9rem; color: var(--warning);" class="mb-2"><i class="ph ph-truck"></i> Desglose Gastos Adicionales</h4>
                    <div class="flex-between mb-1" style="font-size:0.85rem;"><span class="text-muted">Envío:</span> <span>RD$ ${Math.round(exp.shipping || 0).toLocaleString()}</span></div>
                    <div class="flex-between mb-1" style="font-size:0.85rem;"><span class="text-muted">Transporte:</span> <span>RD$ ${Math.round(exp.transport || 0).toLocaleString()}</span></div>
                    <div class="flex-between mb-1" style="font-size:0.85rem;"><span class="text-muted">Aduana:</span> <span>RD$ ${Math.round(exp.customs || 0).toLocaleString()}</span></div>
                    <div class="flex-between mb-1" style="font-size:0.85rem;"><span class="text-muted">Empaque:</span> <span>RD$ ${Math.round(exp.packaging || 0).toLocaleString()}</span></div>
                    <div class="flex-between mb-1" style="font-size:0.85rem;"><span class="text-muted">Otros:</span> <span>RD$ ${Math.round(exp.others || 0).toLocaleString()}</span></div>
                    <hr style="border:0; border-top:1px solid var(--border-color); margin:6px 0;">
                    <div class="flex-between" style="font-size:0.9rem; font-weight:700;"><span class="text-warning">Total Gastos:</span> <span class="text-warning">+RD$ ${Math.round(purchase.totalAdditionalExpenses || 0).toLocaleString()}</span></div>
                </div>

                <div class="card bg-darker p-3 border border-color" style="display:flex; flex-direction:column; justify-content:center;">
                    <div class="flex-between mb-2"><span class="text-muted">Subtotal Mercancía:</span> <strong>RD$ ${Math.round(purchase.merchandiseSubtotal || 0).toLocaleString()}</strong></div>
                    <div class="flex-between mb-2"><span class="text-muted">Gastos Adicionales:</span> <strong class="text-warning">+RD$ ${Math.round(purchase.totalAdditionalExpenses || 0).toLocaleString()}</strong></div>
                    <hr style="border:0; border-top:1px solid var(--border-color); margin:10px 0;">
                    <div class="flex-between"><span style="font-size:1.1rem; font-weight:700;">TOTAL DE LA COMPRA:</span> <strong class="text-success" style="font-size:1.3rem;">RD$ ${Math.round(purchase.totalAmount || 0).toLocaleString()}</strong></div>
                </div>
            </div>
        `;

        document.getElementById('btn-delete-purchase').onclick = () => window.deletePurchase(id);

        modalPurchaseDetail.style.display = 'flex';
        void modalPurchaseDetail.offsetWidth;
        modalPurchaseDetail.classList.add('active');
    };

    // Eliminar Compra con PIN
    window.deletePurchase = async function(id) {
        const purchase = await db.purchases.get(id);
        if (!purchase) return;

        const { value: pin } = await Swal.fire({
            title: 'Autorización Requerida',
            html: `<p style="color:#9CA3AF;margin-bottom:8px;">Introduce el PIN para eliminar la compra <b>${purchase.purchaseNumber}</b>:</p>`,
            input: 'password',
            inputPlaceholder: '••••',
            inputAttributes: { maxlength: 4, autocomplete: 'off' },
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (pin === 'C1290' || pin === '1290') {
            const { isConfirmed } = await Swal.fire({
                title: '¿Revertir stock de inventario?',
                text: '¿Deseas descontar del inventario las unidades que se ingresaron con esta compra?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, descontar stock',
                cancelButtonText: 'No, mantener stock actual'
            });

            if (isConfirmed && purchase.items) {
                for (const item of purchase.items) {
                    const prod = await db.products.get(item.productId);
                    if (prod) {
                        const revertedStock = Math.max(0, (prod.stock || 0) - item.qty);
                        await db.products.update(prod.id, { stock: revertedStock });
                    }
                }
            }

            await db.purchases.delete(id);
            closePurchaseDetailModal();
            Swal.fire('Eliminado', 'La compra fue eliminada con éxito.', 'success');
            initPurchasesView();
            initProductsView();
        } else if (pin) {
            Swal.fire('Error', 'PIN de autorización incorrecto.', 'error');
        }
    };

    // Initialize first view
    initDashboard();
});
