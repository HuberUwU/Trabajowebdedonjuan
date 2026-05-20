// State Management
let menu = [];
let tickets = [];
let cart = {};
let isCerrado = false;
let editingProductId = null;

// DOM Elements
const modeToggle = document.getElementById('modeToggle');
const modeLabel = document.getElementById('modeLabel');
const abiertoView = document.getElementById('abiertoView');
const cerradoView = document.getElementById('cerradoView');
const dashboardView = document.getElementById('dashboardView');

const menuGrid = document.getElementById('menuGrid');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const closeDashboardBtn = document.getElementById('closeDashboardBtn');
const dashboardPendingList = document.getElementById('dashboardPendingList');
const dashboardAcceptedList = document.getElementById('dashboardAcceptedList');
const adminProductsList = document.getElementById('adminProductsList');

const cartItemsContainer = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const customerNameInput = document.getElementById('customerName');
const reserveBtn = document.getElementById('reserveBtn');

const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');
const closeProductModalBtn = document.getElementById('closeProductModal');

const ticketModal = document.getElementById('ticketModal');
const closeTicketModalBtn = document.getElementById('closeTicketModal');
const printTicketBtn = document.getElementById('printTicketBtn');

const ticketsListModal = document.getElementById('ticketsListModal');
const viewTicketsBtn = document.getElementById('viewTicketsBtn');
const closeTicketsListModalBtn = document.getElementById('closeTicketsListModal');
const ticketsHistoryContainer = document.getElementById('ticketsHistoryContainer');

// Mobile Cart & Options Elements
const mobileCartBtn = document.getElementById('mobileCartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const closeCartMobileBtn = document.getElementById('closeCartMobileBtn');
const mobileCartTotal = document.getElementById('mobileCartTotal');

const optionsModal = document.getElementById('optionsModal');
const closeOptionsModalBtn = document.getElementById('closeOptionsModal');
const confirmOptionsBtn = document.getElementById('confirmOptionsBtn');
const optionsList = document.getElementById('optionsList');
const optionsModalProductName = document.getElementById('optionsModalProductName');

let currentProductForOptions = null;

// Initialize Application
async function initApp() {
    loadState();
    if (menu.length === 0) {
        await fetchInitialData();
    }
    renderUI();
    setupEventListeners();
}

function loadState() {
    const savedMenu = localStorage.getItem('donjuan_menu');
    if (savedMenu) {
        menu = JSON.parse(savedMenu);
    }

    const savedTickets = localStorage.getItem('donjuan_tickets');
    if (savedTickets) {
        tickets = JSON.parse(savedTickets);
    }
}

function saveState() {
    localStorage.setItem('donjuan_menu', JSON.stringify(menu));
    localStorage.setItem('donjuan_tickets', JSON.stringify(tickets));
}

async function fetchInitialData() {
    try {
        const response = await fetch('menu.json');
        if (response.ok) {
            const data = await response.json();
            // Filter out the header row if present (id 1 "productos")
            menu = data.filter(item => item.name.toLowerCase() !== 'productos' && item.name.toLowerCase() !== 'nan');
            saveState();
        }
    } catch (e) {
        console.error("Error loading initial menu.json", e);
    }
}

function setupEventListeners() {
    // Dashboard Toggle
    if (openDashboardBtn) {
        openDashboardBtn.addEventListener('click', () => {
            abiertoView.classList.remove('active');
            cerradoView.classList.remove('active');
            dashboardView.classList.add('active');
            renderDashboard();
        });
    }

    if (closeDashboardBtn) {
        closeDashboardBtn.addEventListener('click', () => {
            dashboardView.classList.remove('active');
            if (isCerrado) {
                cerradoView.classList.add('active');
            } else {
                abiertoView.classList.add('active');
            }
        });
    }

    // Auto-refresh dashboard
    setInterval(() => {
        if (dashboardView && dashboardView.classList.contains('active')) {
            renderDashboard();
        }
    }, 5000);

    // Mode Toggle
    modeToggle.addEventListener('change', (e) => {
        const isTryingToClose = e.target.checked;
        
        if (isTryingToClose) {
            // Pedir confirmación al cerrar turno
            const confirmClose = confirm('¿Estás seguro de que deseas cerrar el turno? Esto borrará todos los tickets actuales y el contador iniciará en 1 para el próximo turno.');
            
            if (!confirmClose) {
                // Revertir el toggle si cancela
                e.target.checked = false;
                return;
            }
            
            // Si confirma, borrar todos los tickets
            tickets = [];
            saveState();
        }

        isCerrado = e.target.checked;
        modeLabel.textContent = isCerrado ? 'Turno Cerrado' : 'Turno Abierto';

        if (isCerrado) {
            abiertoView.classList.remove('active');
            cerradoView.classList.add('active');
            renderAdminMenu();
        } else {
            cerradoView.classList.remove('active');
            abiertoView.classList.add('active');
            renderClientMenu();
            clearCart();
        }
    });

    // Admin Add Product
    document.getElementById('addNewProductBtn').addEventListener('click', () => {
        openProductModal();
    });

    // Product Form Submit
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProduct();
    });

    // Close Modals
    closeProductModalBtn.addEventListener('click', () => productModal.classList.remove('show'));
    closeTicketModalBtn.addEventListener('click', () => ticketModal.classList.remove('show'));
    closeTicketsListModalBtn.addEventListener('click', () => ticketsListModal.classList.remove('show'));

    // Cart Events
    customerNameInput.addEventListener('input', updateReserveButton);
    document.getElementById('paymentMethod').addEventListener('change', updateReserveButton);
    reserveBtn.addEventListener('click', processReservation);

    // Mobile Cart
    if (mobileCartBtn && cartSidebar && closeCartMobileBtn) {
        mobileCartBtn.addEventListener('click', () => cartSidebar.classList.add('show-mobile'));
        closeCartMobileBtn.addEventListener('click', () => cartSidebar.classList.remove('show-mobile'));
    }

    // Options Modal
    closeOptionsModalBtn.addEventListener('click', () => {
        optionsModal.classList.remove('show');
        currentProductForOptions = null;
    });
    confirmOptionsBtn.addEventListener('click', () => {
        if (!currentProductForOptions) return;
        
        const selects = optionsList.querySelectorAll('.option-select');
        const options = [];
        selects.forEach(sel => {
            const val = sel.value;
            if (val !== 'Normal') {
                options.push({ name: sel.dataset.ingredient, value: val });
            }
        });
        
        addToCartWithOptions(currentProductForOptions, options);
        optionsModal.classList.remove('show');
        currentProductForOptions = null;
    });

    // Tickets List
    viewTicketsBtn.addEventListener('click', openTicketsHistory);

    // Print
    printTicketBtn.addEventListener('click', () => {
        window.print();
    });
}

// Rendering UI
function renderUI() {
    if (isCerrado) {
        renderAdminMenu();
    } else {
        renderClientMenu();
    }
    renderCart();
}

function renderClientMenu() {
    menuGrid.innerHTML = '';
    menu.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const fallbackIcon = getIconForFood(item.name);
        let imageHTML = item.image ? `<img src="${item.image}" class="product-img" alt="${item.name}">`
            : `<div class="product-icon">${fallbackIcon}</div>`;

        card.innerHTML = `
            ${imageHTML}
            <h3 class="product-name">${item.name}</h3>
            <p class="product-price">$${item.price.toFixed(2)}</p>
            <button class="btn-primary w-100" onclick="addToCart(${item.id})">Agregar</button>
        `;
        menuGrid.appendChild(card);
    });
}

function renderAdminMenu() {
    adminProductsList.innerHTML = '';
    menu.forEach(item => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <div class="admin-card-info">
                <h3>${item.name}</h3>
                <p><strong>$${item.price.toFixed(2)}</strong></p>
            </div>
            <div class="admin-card-actions">
                <button class="btn-edit" onclick="openProductModal(${item.id})">✏️</button>
                <button class="btn-danger" onclick="deleteProduct(${item.id})">🗑️</button>
            </div>
        `;
        adminProductsList.appendChild(card);
    });
}

// Cart Logic
function isPreparedFood(name) {
    const n = name.toLowerCase();
    return n.includes('mollete') || n.includes('torta') || n.includes('taco') || n.includes('quesadilla') || n.includes('gordita') || n.includes('sincronizada') || n.includes('burrito') || n.includes('huarache') || n.includes('sope');
}

function generateCartKey(productId, options) {
    if (!options || options.length === 0) return productId.toString();
    const optsStr = options.map(o => `${o.name}:${o.value}`).sort().join('|');
    return `${productId}_${optsStr}`;
}

function addToCart(productId) {
    const product = menu.find(p => p.id === productId);
    if (!product) return;
    
    if (isPreparedFood(product.name)) {
        currentProductForOptions = product;
        openOptionsModal(product);
    } else {
        addToCartWithOptions(product, []);
    }
}

function openOptionsModal(product) {
    optionsModalProductName.textContent = product.name;
    const ingredients = ['Jitomate', 'Queso Oaxaca', 'Lechuga', 'Crema', 'Salsa'];
    optionsList.innerHTML = '';
    
    ingredients.forEach(ing => {
        const item = document.createElement('div');
        item.className = 'option-item';
        item.innerHTML = `
            <span>${ing}</span>
            <select class="option-select" data-ingredient="${ing}">
                <option value="Sin">Sin</option>
                <option value="Normal" selected>Normal</option>
                <option value="Extra">Extra</option>
            </select>
        `;
        optionsList.appendChild(item);
    });
    
    optionsModal.classList.add('show');
}

function addToCartWithOptions(product, options) {
    const key = generateCartKey(product.id, options);
    if (cart[key]) {
        cart[key].qty += 1;
    } else {
        cart[key] = { ...product, options: options, qty: 1, cartKey: key };
    }
    renderCart();
}

function updateCartQty(key, delta) {
    if (cart[key]) {
        cart[key].qty += delta;
        if (cart[key].qty <= 0) {
            delete cart[key];
        }
        renderCart();
    }
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    const itemKeys = Object.keys(cart);
    let total = 0;

    if (itemKeys.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">No hay productos seleccionados</div>';
        if (mobileCartTotal) mobileCartTotal.textContent = '$0.00';
    } else {
        itemKeys.forEach(key => {
            const item = cart[key];
            const itemTotal = item.price * item.qty;
            total += itemTotal;

            let optionsHtml = '';
            if (item.options && item.options.length > 0) {
                const optsText = item.options.map(o => `${o.value} ${o.name}`).join(', ');
                optionsHtml = `<div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.3rem;">${optsText}</div>`;
            }

            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            cartItemEl.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    ${optionsHtml}
                    <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateCartQty('${key}', -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateCartQty('${key}', 1)">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemEl);
        });
    }

    cartTotalEl.textContent = `$${total.toFixed(2)}`;
    if (mobileCartTotal) mobileCartTotal.textContent = `$${total.toFixed(2)}`;
    updateReserveButton();
}

function clearCart() {
    cart = {};
    customerNameInput.value = '';
    renderCart();
}

function updateReserveButton() {
    const hasItems = Object.keys(cart).length > 0;
    const hasName = customerNameInput.value.trim().length > 0;
    const hasPayment = document.getElementById('paymentMethod').value !== "";
    reserveBtn.disabled = !(hasItems && hasName && hasPayment);
}

function processReservation() {
    const customerName = customerNameInput.value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    if (!customerName || Object.keys(cart).length === 0 || !paymentMethod) return;

    // Generate Ticket Number
    const ticketNumber = tickets.length > 0 ? tickets[tickets.length - 1].number + 1 : 1;

    // Calculate total
    let total = 0;
    const itemsList = Object.values(cart).map(item => {
        total += item.price * item.qty;
        
        let optsText = '';
        if (item.options && item.options.length > 0) {
            optsText = ' (' + item.options.map(o => `${o.value} ${o.name}`).join(', ') + ')';
        }

        return {
            name: item.name + optsText,
            qty: item.qty,
            price: item.price,
            total: item.price * item.qty
        };
    });

    const newTicket = {
        number: ticketNumber,
        customer: customerName,
        items: itemsList,
        total: total,
        date: new Date().toISOString(),
        status: 'pending',
        paymentMethod: paymentMethod,
        rejectReason: ''
    };

    tickets.push(newTicket);
    saveState();

    showTicketModal(newTicket);
    document.getElementById('paymentMethod').value = "";
    clearCart();
    if (cartSidebar) cartSidebar.classList.remove('show-mobile');
}

function showTicketModal(ticket) {
    document.getElementById('ticketNumberDisplay').textContent = ticket.number;
    document.getElementById('ticketCustomerName').textContent = ticket.customer;
    document.getElementById('ticketTotalDisplay').textContent = `$${ticket.total.toFixed(2)}`;

    const statusEl = document.getElementById('ticketStatusDisplay');
    statusEl.textContent = ticket.status === 'pending' ? 'Pendiente' : (ticket.status === 'accepted' ? 'Aceptado' : 'Rechazado');
    statusEl.style.color = ticket.status === 'pending' ? 'orange' : (ticket.status === 'accepted' ? 'green' : 'red');
    
    document.getElementById('ticketPaymentDisplay').textContent = ticket.paymentMethod ? ticket.paymentMethod.charAt(0).toUpperCase() + ticket.paymentMethod.slice(1) : 'No especificado';
    
    const reasonContainer = document.getElementById('ticketRejectReasonContainer');
    if (ticket.status === 'rejected' && ticket.rejectReason) {
        reasonContainer.style.display = 'block';
        document.getElementById('ticketRejectReasonDisplay').textContent = ticket.rejectReason;
    } else {
        reasonContainer.style.display = 'none';
    }

    const itemsContainer = document.getElementById('ticketItemsDisplay');
    itemsContainer.innerHTML = '';
    ticket.items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'ticket-item-row';
        row.innerHTML = `
            <span>${item.qty}x ${item.name}</span>
            <span>$${item.total.toFixed(2)}</span>
        `;
        itemsContainer.appendChild(row);
    });

    // Generar URL con datos para el escaneo QR
    const baseUrl = window.location.origin + window.location.pathname;
    const smallTicket = {
        n: ticket.number,
        c: ticket.customer,
        t: ticket.total,
        p: ticket.paymentMethod,
        i: ticket.items.map(i => [i.qty, i.name, i.total])
    };
    // Codificación segura en base64 para caracteres especiales (tildes, eñes)
    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(smallTicket))));
    const ticketUrl = `${baseUrl}?resumen=${encodedData}`;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketUrl)}`;
    document.getElementById('ticketQrCode').src = qrUrl;

    ticketModal.classList.add('show');

    if (window.ticketUpdateInterval) clearInterval(window.ticketUpdateInterval);
    window.ticketUpdateInterval = setInterval(() => {
        if (!ticketModal.classList.contains('show')) {
            clearInterval(window.ticketUpdateInterval);
            return;
        }
        const latestTickets = JSON.parse(localStorage.getItem('donjuan_tickets') || '[]');
        const latest = latestTickets.find(t => t.number === ticket.number);
        if (latest && (latest.status !== ticket.status || latest.rejectReason !== ticket.rejectReason)) {
            ticket.status = latest.status;
            ticket.rejectReason = latest.rejectReason;
            showTicketModal(ticket);
        }
    }, 2000);
}

// Admin Logic
function openProductModal(productId = null) {
    editingProductId = productId;
    const idInput = document.getElementById('productId');
    const nameInput = document.getElementById('productName');
    const priceInput = document.getElementById('productPrice');
    const imageInput = document.getElementById('productImage');

    if (productId !== null) {
        modalTitle.textContent = 'Editar Producto';
        const product = menu.find(p => p.id === productId);
        idInput.value = product.id;
        nameInput.value = product.name;
        priceInput.value = product.price;
        imageInput.value = product.image || '';
    } else {
        modalTitle.textContent = 'Nuevo Producto';
        productForm.reset();
        idInput.value = '';
    }

    productModal.classList.add('show');
}

function saveProduct() {
    const idValue = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const image = document.getElementById('productImage').value.trim();

    if (editingProductId !== null) {
        // Edit
        const idx = menu.findIndex(p => p.id === editingProductId);
        if (idx > -1) {
            menu[idx].name = name;
            menu[idx].price = price;
            menu[idx].image = image;
        }
    } else {
        // Add
        const newId = menu.length > 0 ? Math.max(...menu.map(p => p.id)) + 1 : 1;
        menu.push({
            id: newId,
            name: name,
            price: price,
            image: image
        });
    }

    saveState();
    renderAdminMenu();
    productModal.classList.remove('show');
}

function deleteProduct(productId) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        menu = menu.filter(p => p.id !== productId);
        saveState();
        renderAdminMenu();
    }
}

// Tickets History
function openTicketsHistory() {
    ticketsHistoryContainer.innerHTML = '';
    if (tickets.length === 0) {
        ticketsHistoryContainer.innerHTML = '<p style="text-align:center; color:gray;">No hay tickets registrados aún.</p>';
    } else {
        // Show reversed (newest first)
        const reversedTickets = [...tickets].reverse();
        reversedTickets.forEach(ticket => {
            const d = new Date(ticket.date);
            const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();

            const itemEl = document.createElement('div');
            itemEl.className = 'history-item';

            let itemsHtml = ticket.items.map(i => `${i.qty}x ${i.name}`).join(', ');

            let statusText = '';
            let statusColor = '';
            if (ticket.status === 'pending') {
                statusText = 'Pendiente';
                statusColor = 'orange';
            } else if (ticket.status === 'accepted') {
                statusText = 'Aceptado';
                statusColor = 'green';
            } else if (ticket.status === 'rejected') {
                statusText = 'Rechazado';
                statusColor = 'red';
            } else {
                statusText = 'Completado';
                statusColor = 'gray';
            }

            let actionBtns = '';
            if (ticket.status === 'pending' || !ticket.status) {
                actionBtns = `
                    <div style="margin-top: 10px; display: flex; gap: 10px;">
                        <button class="btn-primary" style="background-color: var(--success-color);" onclick='acceptTicket(${ticket.number})'>Aceptar</button>
                        <button class="btn-danger" onclick='rejectTicket(${ticket.number})'>Rechazar</button>
                    </div>
                `;
            }

            itemEl.innerHTML = `
                <div class="history-header">
                    <span>Ticket #${ticket.number} - ${ticket.customer}</span>
                    <span style="color:var(--primary-color)">$${ticket.total.toFixed(2)}</span>
                </div>
                <div style="font-size:0.9rem; color:var(--text-light); margin-bottom:0.5rem;">${dateStr}</div>
                <div style="font-size:0.9rem; margin-bottom:0.5rem;"><strong>Estado:</strong> <span style="color:${statusColor}; font-weight:bold;">${statusText}</span></div>
                <div style="font-size:0.9rem; margin-bottom:0.5rem;"><strong>Pago:</strong> ${ticket.paymentMethod ? ticket.paymentMethod.charAt(0).toUpperCase() + ticket.paymentMethod.slice(1) : 'No especificado'}</div>
                <div style="font-size:0.9rem;"><strong>Pedido:</strong> ${itemsHtml}</div>
                ${ticket.status === 'rejected' && ticket.rejectReason ? `<div style="font-size:0.9rem; color:red; margin-top:0.5rem;"><strong>Motivo de rechazo:</strong> ${ticket.rejectReason}</div>` : ''}
                ${actionBtns}
                <button class="btn-secondary mt-4" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick='reprintTicket(${JSON.stringify(ticket)})'>Ver / Reimprimir</button>
            `;
            ticketsHistoryContainer.appendChild(itemEl);
        });
    }

    ticketsListModal.classList.add('show');
}

window.reprintTicket = function (ticket) {
    ticketsListModal.classList.remove('show');
    showTicketModal(ticket);
};

window.acceptTicket = function(number) {
    const ticketIndex = tickets.findIndex(t => t.number === number);
    if (ticketIndex > -1) {
        tickets[ticketIndex].status = 'accepted';
        saveState();
        if (document.getElementById('ticketsListModal').classList.contains('show')) openTicketsHistory();
        if (dashboardView && dashboardView.classList.contains('active')) renderDashboard();
    }
};

window.rejectTicket = function(number) {
    const reason = prompt('Motivo de rechazo:');
    if (reason === null) return;
    
    const ticketIndex = tickets.findIndex(t => t.number === number);
    if (ticketIndex > -1) {
        tickets[ticketIndex].status = 'rejected';
        tickets[ticketIndex].rejectReason = reason || 'Sin motivo especificado';
        saveState();
        if (document.getElementById('ticketsListModal').classList.contains('show')) openTicketsHistory();
        if (dashboardView && dashboardView.classList.contains('active')) renderDashboard();
    }
};

window.completeTicket = function(number) {
    const ticketIndex = tickets.findIndex(t => t.number === number);
    if (ticketIndex > -1) {
        tickets[ticketIndex].status = 'completed';
        saveState();
        if (document.getElementById('ticketsListModal').classList.contains('show')) openTicketsHistory();
        if (dashboardView && dashboardView.classList.contains('active')) renderDashboard();
    }
};

function renderDashboard() {
    if (!dashboardPendingList || !dashboardAcceptedList) return;
    dashboardPendingList.innerHTML = '';
    dashboardAcceptedList.innerHTML = '';
    
    const pendingTickets = tickets.filter(t => t.status === 'pending');
    const acceptedTickets = tickets.filter(t => t.status === 'accepted');

    if (pendingTickets.length === 0) {
        dashboardPendingList.innerHTML = '<p style="text-align:center; color:gray; margin-top:2rem;">No hay pedidos pendientes.</p>';
    } else {
        pendingTickets.forEach(ticket => {
            dashboardPendingList.appendChild(createDashboardCard(ticket));
        });
    }

    if (acceptedTickets.length === 0) {
        dashboardAcceptedList.innerHTML = '<p style="text-align:center; color:gray; margin-top:2rem;">No hay pedidos en preparación.</p>';
    } else {
        acceptedTickets.forEach(ticket => {
            dashboardAcceptedList.appendChild(createDashboardCard(ticket));
        });
    }
}

function createDashboardCard(ticket) {
    const card = document.createElement('div');
    card.className = 'dashboard-card';
    card.style.cssText = 'background: white; border-radius: var(--radius-md); padding: 1rem; box-shadow: var(--shadow-sm); border-left: 5px solid ' + (ticket.status === 'pending' ? 'orange' : 'var(--success-color)');
    
    const d = new Date(ticket.date);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let itemsHtml = ticket.items.map(i => `<div style="margin-bottom:4px;"><strong>${i.qty}x</strong> ${i.name}</div>`).join('');
    
    let actionBtns = '';
    if (ticket.status === 'pending') {
        actionBtns = `
            <div style="display:flex; gap:10px; margin-top:1rem;">
                <button class="btn-primary w-100" style="background-color: var(--success-color); padding:0.5rem;" onclick="acceptTicket(${ticket.number})">Aceptar</button>
                <button class="btn-danger w-100" style="padding:0.5rem;" onclick="rejectTicket(${ticket.number})">Rechazar</button>
            </div>
        `;
    } else if (ticket.status === 'accepted') {
        actionBtns = `
            <div style="display:flex; gap:10px; margin-top:1rem;">
                <button class="btn-primary w-100" style="background-color: gray; padding:0.5rem;" onclick="completeTicket(${ticket.number})">Marcar Listo</button>
            </div>
        `;
    }

    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem; border-bottom:1px dashed #ccc; padding-bottom:0.5rem;">
            <h4 style="margin:0; color: var(--secondary-color);">#${ticket.number} - ${ticket.customer}</h4>
            <span style="color:var(--text-light); font-size:0.9rem;">${timeStr}</span>
        </div>
        <div style="font-size:0.95rem; margin-bottom:0.8rem; color: var(--text-color);">
            ${itemsHtml}
        </div>
        <div style="font-size:0.85rem; color:var(--text-light); display:flex; justify-content:space-between; align-items:center;">
            <span>💳 ${ticket.paymentMethod ? ticket.paymentMethod.charAt(0).toUpperCase() + ticket.paymentMethod.slice(1) : ''}</span>
            <span style="font-weight:bold; color:var(--primary-color); font-size:1.1rem;">$${ticket.total.toFixed(2)}</span>
        </div>
        ${actionBtns}
    `;
    return card;
}

// Helper
function getIconForFood(name) {
    name = name.toLowerCase();
    if (name.includes('torta')) return '🥪';
    if (name.includes('taco')) return '🌮';
    if (name.includes('agua') || name.includes('mineral')) return '💧';
    if (name.includes('electrolitro')) return '🥤';
    if (name.includes('mollete')) return '🥖';
    if (name.includes('quesadilla')) return '🧀';
    if (name.includes('pan')) return '🥐';
    return '🍽️';
}

// Start
const urlParams = new URLSearchParams(window.location.search);
const resumenData = urlParams.get('resumen');

if (resumenData) {
    // Si viene el parámetro resumen, mostrar solo esa vista
    document.querySelector('.app-header').style.display = 'none';
    document.getElementById('abiertoView').classList.remove('active');
    document.getElementById('cerradoView').classList.remove('active');
    document.querySelector('.app-footer').style.display = 'none';

    const resumenView = document.getElementById('resumenView');
    resumenView.style.display = 'flex';

    try {
        // Decodificación segura
        const ticketData = JSON.parse(decodeURIComponent(escape(atob(resumenData))));
        
        // Cargar estado más reciente si estamos en el mismo dispositivo
        const latestTickets = JSON.parse(localStorage.getItem('donjuan_tickets') || '[]');
        const latest = latestTickets.find(t => t.number === ticketData.n);
        
        const status = latest ? latest.status : 'pending';
        const payment = latest ? latest.paymentMethod : (ticketData.p || 'No especificado');
        const rejectReason = latest ? latest.rejectReason : '';

        document.getElementById('resumenNumber').textContent = ticketData.n;
        document.getElementById('resumenCustomer').textContent = ticketData.c;
        document.getElementById('resumenTotal').textContent = `$${ticketData.t.toFixed(2)}`;

        const statusEl = document.getElementById('resumenStatus');
        statusEl.textContent = status === 'pending' ? 'Pendiente' : (status === 'accepted' ? 'Aceptado' : 'Rechazado');
        statusEl.style.color = status === 'pending' ? 'orange' : (status === 'accepted' ? 'green' : 'red');
        
        document.getElementById('resumenPayment').textContent = payment.charAt(0).toUpperCase() + payment.slice(1);
        
        const reasonContainer = document.getElementById('resumenRejectReasonContainer');
        if (status === 'rejected' && rejectReason) {
            reasonContainer.style.display = 'block';
            document.getElementById('resumenRejectReason').textContent = rejectReason;
        } else {
            reasonContainer.style.display = 'none';
        }

        const itemsContainer = document.getElementById('resumenItems');
        ticketData.i.forEach(item => {
            const row = document.createElement('div');
            row.className = 'ticket-item-row';
            row.style.marginBottom = '10px';
            row.innerHTML = `
                <span>${item[0]}x ${item[1]}</span>
                <span style="font-weight: 800;">$${item[2].toFixed(2)}</span>
            `;
            itemsContainer.appendChild(row);
        });

        // Auto update para vista QR
        setInterval(() => {
            const currentTickets = JSON.parse(localStorage.getItem('donjuan_tickets') || '[]');
            const current = currentTickets.find(t => t.number === ticketData.n);
            if (current) {
                const currentStatus = current.status || 'pending';
                statusEl.textContent = currentStatus === 'pending' ? 'Pendiente' : (currentStatus === 'accepted' ? 'Aceptado' : 'Rechazado');
                statusEl.style.color = currentStatus === 'pending' ? 'orange' : (currentStatus === 'accepted' ? 'green' : 'red');
                
                if (currentStatus === 'rejected' && current.rejectReason) {
                    reasonContainer.style.display = 'block';
                    document.getElementById('resumenRejectReason').textContent = current.rejectReason;
                } else {
                    reasonContainer.style.display = 'none';
                }
            }
        }, 3000);
    } catch (e) {
        resumenView.innerHTML = "<div style='text-align:center;'><h2>❌ Error</h2><p>No se pudo cargar el resumen del pedido. Es posible que el código sea inválido.</p></div>";
    }
} else {
    // Si no, iniciar la app normal
    initApp();
}
