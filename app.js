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
const adminProductsList = document.getElementById('adminProductsList');

const openDashboardBtn = document.getElementById('openDashboardBtn');
const closeDashboardBtn = document.getElementById('closeDashboardBtn');
const colEsperando = document.getElementById('colEsperando');
const colPreparacion = document.getElementById('colPreparacion');
const colListos = document.getElementById('colListos');
const colEntregados = document.getElementById('colEntregados');

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

// Auth Elements
const loginModal = document.getElementById('loginModal');
const closeLoginModalBtn = document.getElementById('closeLoginModal');
const openLoginBtn = document.getElementById('openLoginBtn');
const adminControls = document.getElementById('adminControls');
const logoutBtn = document.getElementById('logoutBtn');
const appContainer = document.getElementById('appContainer');
const loginForm = document.getElementById('loginForm');
const loginUser = document.getElementById('loginUser');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');

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
    // Mode Toggle
    modeToggle.addEventListener('change', (e) => {
        const isTryingToClose = e.target.checked;
        
        if (isTryingToClose) {
            const pwd = prompt('Ingrese la contraseña de administrador para cerrar turno:');
            if (pwd !== '12345') {
                alert('Contraseña incorrecta.');
                e.target.checked = false;
                return;
            }

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
            if(dashboardView) dashboardView.classList.remove('active');
            cerradoView.classList.add('active');
            renderAdminMenu();
        } else {
            cerradoView.classList.remove('active');
            if(dashboardView) dashboardView.classList.remove('active');
            abiertoView.classList.add('active');
            renderClientMenu();
            clearCart();
        }
    });

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
    reserveBtn.addEventListener('click', processReservation);

    // Auth Events
    if (openLoginBtn) {
        openLoginBtn.addEventListener('click', () => {
            if (loginModal) loginModal.classList.add('show');
        });
    }

    if (closeLoginModalBtn) {
        closeLoginModalBtn.addEventListener('click', () => {
            if (loginModal) loginModal.classList.remove('show');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = loginUser.value.trim();
            const pass = loginPassword.value.trim();
            
            if (user.toLowerCase() === 'admin' && pass === '12345') {
                loginError.style.display = 'none';
                loginSuccess('admin');
            } else {
                loginError.style.display = 'block';
            }
        });
    }

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

// Auth Logic
function loginSuccess(role) {
    if (loginModal) loginModal.classList.remove('show');
    if (adminControls) adminControls.style.display = 'flex';
    if (openLoginBtn) openLoginBtn.style.display = 'none';
}

function logout() {
    if (adminControls) adminControls.style.display = 'none';
    if (openLoginBtn) openLoginBtn.style.display = 'block';
    
    // Default to client view
    isCerrado = false;
    if (modeToggle) modeToggle.checked = false;
    if (modeLabel) modeLabel.textContent = 'Turno Abierto';
    if (cerradoView) cerradoView.classList.remove('active');
    if (abiertoView) abiertoView.classList.add('active');
    renderClientMenu();
    clearCart();
    
    if (loginForm) loginForm.reset();
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
    reserveBtn.disabled = !(hasItems && hasName);
}

function processReservation() {
    const customerName = customerNameInput.value.trim();
    if (!customerName || Object.keys(cart).length === 0) return;

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
        status: 'esperando'
    };

    tickets.push(newTicket);
    saveState();

    showTicketModal(newTicket);
    clearCart();
    if (cartSidebar) cartSidebar.classList.remove('show-mobile');
}

function showTicketModal(ticket) {
    document.getElementById('ticketNumberDisplay').textContent = ticket.number;
    document.getElementById('ticketCustomerName').textContent = ticket.customer;
    document.getElementById('ticketTotalDisplay').textContent = `$${ticket.total.toFixed(2)}`;

    let statusText = 'Esperando Confirmación';
    let statusColor = '#d94f04';
    if (ticket.status === 'preparacion' || ticket.status === 'pendiente') {
        statusText = 'En Preparación';
        statusColor = 'orange';
    } else if (ticket.status === 'listo') {
        statusText = 'Listo para Entregar';
        statusColor = 'var(--accent-color)';
    } else if (ticket.status === 'entregado') {
        statusText = 'Entregado';
        statusColor = 'var(--success-color)';
    } else if (ticket.status === 'rechazado') {
        statusText = 'Rechazado';
        statusColor = 'var(--danger-color)';
    }

    const statusDisplay = document.getElementById('ticketStatusDisplay');
    if (statusDisplay) {
        statusDisplay.textContent = statusText;
        statusDisplay.style.color = statusColor;
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
        i: ticket.items.map(i => [i.qty, i.name, i.total])
    };
    // Codificación segura en base64 para caracteres especiales (tildes, eñes)
    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(smallTicket))));
    const ticketUrl = `${baseUrl}?resumen=${encodedData}`;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketUrl)}`;
    document.getElementById('ticketQrCode').src = qrUrl;

    ticketModal.classList.add('show');
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

            let statusText = 'Esperando Confirmación';
            let statusColor = '#d94f04';
            if (ticket.status === 'preparacion' || ticket.status === 'pendiente') {
                statusText = 'En Preparación';
                statusColor = 'orange';
            } else if (ticket.status === 'listo') {
                statusText = 'Listo para Entregar';
                statusColor = 'var(--accent-color)';
            } else if (ticket.status === 'entregado') {
                statusText = 'Entregado';
                statusColor = 'var(--success-color)';
            } else if (ticket.status === 'rechazado') {
                statusText = 'Rechazado';
                statusColor = 'var(--danger-color)';
            }

            itemEl.innerHTML = `
                <div class="history-header">
                    <span>Ticket #${ticket.number} - ${ticket.customer}</span>
                    <span style="color:var(--primary-color)">$${ticket.total.toFixed(2)}</span>
                </div>
                <div style="font-size:0.9rem; color:var(--text-light); margin-bottom:0.5rem;">${dateStr}</div>
                <div style="font-size:0.9rem; margin-bottom:0.5rem;"><strong>Estado:</strong> <span style="color:${statusColor}; font-weight:bold;">${statusText}</span></div>
                <div style="font-size:0.9rem;"><strong>Pedido:</strong> ${itemsHtml}</div>
                <button class="btn-secondary mt-4" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick='reprintTicket(${JSON.stringify(ticket)})'>Reimprimir</button>
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

// Dashboard Logic
window.updateTicketStatus = function(number, status) {
    const idx = tickets.findIndex(t => t.number === number);
    if (idx > -1) {
        tickets[idx].status = status;
        saveState();
        renderDashboard();
        if (document.getElementById('ticketsListModal').classList.contains('show')) openTicketsHistory();
    }
}

function renderDashboard() {
    if (!colEsperando || !colPreparacion || !colListos || !colEntregados) return;
    
    colEsperando.innerHTML = '';
    colPreparacion.innerHTML = '';
    colListos.innerHTML = '';
    colEntregados.innerHTML = '';

    const waiting = tickets.filter(t => t.status === 'esperando' || !t.status);
    const preparing = tickets.filter(t => t.status === 'preparacion' || t.status === 'pendiente');
    const ready = tickets.filter(t => t.status === 'listo');
    const delivered = tickets.filter(t => t.status === 'entregado');

    if (waiting.length === 0) colEsperando.innerHTML = '<p style="text-align:center; color:gray;">No hay pedidos en espera.</p>';
    else waiting.forEach(t => colEsperando.appendChild(createDashboardCard(t)));

    if (preparing.length === 0) colPreparacion.innerHTML = '<p style="text-align:center; color:gray;">No hay pedidos en preparación.</p>';
    else preparing.forEach(t => colPreparacion.appendChild(createDashboardCard(t)));

    if (ready.length === 0) colListos.innerHTML = '<p style="text-align:center; color:gray;">No hay pedidos listos.</p>';
    else ready.forEach(t => colListos.appendChild(createDashboardCard(t)));

    if (delivered.length === 0) colEntregados.innerHTML = '<p style="text-align:center; color:gray;">No hay pedidos entregados.</p>';
    else delivered.forEach(t => colEntregados.appendChild(createDashboardCard(t)));
}

function createDashboardCard(ticket) {
    const card = document.createElement('div');
    card.style.cssText = 'background: white; border-radius: var(--radius-md); padding: 1rem; box-shadow: var(--shadow-sm);';
    
    if (ticket.status === 'esperando' || !ticket.status) card.style.borderLeft = '5px solid #d94f04';
    else if (ticket.status === 'preparacion' || ticket.status === 'pendiente') card.style.borderLeft = '5px solid orange';
    else if (ticket.status === 'listo') card.style.borderLeft = '5px solid var(--accent-color)';
    else if (ticket.status === 'entregado') card.style.borderLeft = '5px solid var(--success-color)';

    const d = new Date(ticket.date);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let itemsHtml = ticket.items.map(i => `<div style="margin-bottom:4px;"><strong>${i.qty}x</strong> ${i.name}</div>`).join('');

    let actionBtns = '';
    if (ticket.status === 'esperando' || !ticket.status) {
        actionBtns = `
            <div style="display:flex; gap:10px; margin-top:1rem;">
                <button class="btn-primary w-100" style="background-color: orange; padding:0.5rem; font-size:0.9rem;" onclick="updateTicketStatus(${ticket.number}, 'preparacion')">✅ Aceptar</button>
                <button class="btn-danger w-100" style="padding:0.5rem; font-size:0.9rem;" onclick="updateTicketStatus(${ticket.number}, 'rechazado')">❌ Rechazar</button>
            </div>
        `;
    } else if (ticket.status === 'preparacion' || ticket.status === 'pendiente') {
        actionBtns = `<button class="btn-primary w-100" style="background-color: var(--accent-color); padding:0.5rem; margin-top:1rem; font-size:0.9rem;" onclick="updateTicketStatus(${ticket.number}, 'listo')">Marcar Listo</button>`;
    } else if (ticket.status === 'listo') {
        actionBtns = `<button class="btn-primary w-100" style="background-color: var(--success-color); padding:0.5rem; margin-top:1rem; font-size:0.9rem;" onclick="updateTicketStatus(${ticket.number}, 'entregado')">Marcar Entregado</button>`;
    }

    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem; border-bottom:1px dashed #ccc; padding-bottom:0.5rem;">
            <h4 style="margin:0; color: var(--secondary-color);">#${ticket.number} - ${ticket.customer}</h4>
            <span style="color:var(--text-light); font-size:0.9rem;">${timeStr}</span>
        </div>
        <div style="font-size:0.95rem; margin-bottom:0.8rem; color: var(--text-color);">
            ${itemsHtml}
        </div>
        <div style="font-size:0.85rem; color:var(--text-light); text-align:right;">
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
        document.getElementById('resumenNumber').textContent = ticketData.n;
        document.getElementById('resumenCustomer').textContent = ticketData.c;
        document.getElementById('resumenTotal').textContent = `$${ticketData.t.toFixed(2)}`;

        function updateResumenStatus() {
            let currentStatus = 'esperando';
            const savedTickets = localStorage.getItem('donjuan_tickets');
            if (savedTickets) {
                const localTickets = JSON.parse(savedTickets);
                const found = localTickets.find(t => t.number === ticketData.n);
                if (found && found.status) currentStatus = found.status;
            }

            let statusText = 'Esperando Confirmación';
            let statusColor = '#d94f04';
            if (currentStatus === 'preparacion' || currentStatus === 'pendiente') {
                statusText = 'En Preparación';
                statusColor = 'orange';
            } else if (currentStatus === 'listo') {
                statusText = 'Listo para Entregar';
                statusColor = 'var(--accent-color)';
            } else if (currentStatus === 'entregado') {
                statusText = 'Entregado';
                statusColor = 'var(--success-color)';
            } else if (currentStatus === 'rechazado') {
                statusText = 'Rechazado';
                statusColor = 'var(--danger-color)';
            }

            const resumenStatus = document.getElementById('resumenStatus');
            if (resumenStatus) {
                resumenStatus.textContent = statusText;
                resumenStatus.style.color = statusColor;
            }
        }
        
        updateResumenStatus();
        setInterval(updateResumenStatus, 3000);

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
    } catch (e) {
        resumenView.innerHTML = "<div style='text-align:center;'><h2>❌ Error</h2><p>No se pudo cargar el resumen del pedido. Es posible que el código sea inválido.</p></div>";
    }
} else {
    // Si no, iniciar la app normal
    initApp();
}
