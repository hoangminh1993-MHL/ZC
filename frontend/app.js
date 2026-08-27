const API_URL = '/api';

// State
let state = {
    user: null,
    token: null,
    data: null, // Full db for offline-like quick rendering (in real app we paginate)
    currentView: 'dashboard'
};

// Roles config
const ROLE_NAMES = {
    'admin': 'Chủ cửa hàng',
    'head_chef': 'Bếp trưởng',
    'kitchen_staff': 'Nhân viên bếp',
    'sales_lead': 'Trưởng ca bán hàng',
    'sales_staff': 'Nhân viên bán hàng'
};

// Init
async function initApp() {
    const token = localStorage.getItem('zc_token');
    const userStr = localStorage.getItem('zc_user');
    
    if (!token || !userStr) {
        window.location.href = '/frontend/login.html';
        return;
    }
    
    state.token = token;
    state.user = JSON.parse(userStr);
    
    // Setup UI with User info
    document.getElementById('userName').textContent = state.user.name;
    document.getElementById('userRole').textContent = ROLE_NAMES[state.user.role];
    document.getElementById('userAvatar').src = state.user.avatar || 'https://ui-avatars.com/api/?name=U';
    
    setupNavigation();
    await fetchInitialData();
    renderView('dashboard');
}

// Network
async function fetchApi(endpoint, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
        };
        const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        if (res.status === 401) {
            logout();
            throw new Error("Phiên đăng nhập hết hạn");
        }
        return await res.json();
    } catch (e) {
        console.error("API Error", e);
        showToast(e.message, 'error');
        return null;
    }
}

async function fetchInitialData() {
    const db = await fetchApi('/data');
    if (db) {
        state.data = db;
    }
}

function logout() {
    localStorage.removeItem('zc_token');
    localStorage.removeItem('zc_user');
    window.location.href = '/frontend/login.html';
}

// UI Utilities
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bg = type === 'success' ? 'bg-green-600' : (type === 'error' ? 'bg-red-600' : 'bg-gray-800');
    toast.className = `${bg} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium toast-enter flex items-center gap-2`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-enter-active');
    });
    
    setTimeout(() => {
        toast.classList.remove('toast-enter-active');
        toast.classList.add('toast-exit');
        requestAnimationFrame(() => {
            toast.classList.add('toast-exit-active');
        });
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showModal(title, contentHTML) {
    const container = document.getElementById('modal-container');
    const content = document.getElementById('modal-content');
    
    content.innerHTML = `
        <div class="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 class="font-bold text-lg text-gray-900">${title}</h3>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-700">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="p-4">${contentHTML}</div>
    `;
    
    container.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(isoString, includeTime = false) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const dateStr = d.toLocaleDateString('vi-VN');
    if (includeTime) {
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${dateStr}`;
    }
    return dateStr;
}

// Navigation
const NAV_ITEMS = [
    { id: 'dashboard', icon: 'fa-home', label: 'Hôm nay', roles: ['admin', 'head_chef', 'kitchen_staff', 'sales_lead', 'sales_staff'] },
    { id: 'orders_single', icon: 'fa-cookie', label: 'Đơn bánh lẻ', roles: ['admin', 'sales_lead', 'sales_staff', 'head_chef'] },
    { id: 'orders_birthday', icon: 'fa-birthday-cake', label: 'Đơn bánh SN', roles: ['admin', 'sales_lead', 'sales_staff', 'head_chef'] },
    { id: 'tasks', icon: 'fa-tasks', label: 'Nhiệm vụ', roles: ['admin', 'head_chef', 'kitchen_staff', 'sales_lead', 'sales_staff'] },
    { id: 'scores', icon: 'fa-star', label: 'Điểm', roles: ['admin', 'head_chef', 'kitchen_staff', 'sales_lead', 'sales_staff'] },
    { id: 'more', icon: 'fa-ellipsis-h', label: 'Thêm', roles: ['admin', 'head_chef', 'kitchen_staff', 'sales_lead', 'sales_staff'] }
];

function setupNavigation() {
    const pcNav = document.getElementById('pc-nav');
    const mobileNav = document.getElementById('mobile-nav');
    
    pcNav.innerHTML = '';
    mobileNav.innerHTML = '';
    
    NAV_ITEMS.filter(item => item.roles.includes(state.user.role)).forEach(item => {
        // PC
        const aPc = document.createElement('a');
        aPc.href = '#';
        aPc.className = `nav-item-${item.id} flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-gray-600 hover:bg-gray-100`;
        aPc.innerHTML = `<i class="fas ${item.icon} w-5 text-center"></i> ${item.label}`;
        aPc.onclick = (e) => { e.preventDefault(); renderView(item.id); };
        pcNav.appendChild(aPc);
        
        // Mobile
        const aMob = document.createElement('a');
        aMob.href = '#';
        aMob.className = `nav-item-${item.id} flex-1 flex flex-col items-center py-2 text-gray-500 hover:text-brand-red transition-colors`;
        aMob.innerHTML = `<i class="fas ${item.icon} text-lg mb-1"></i><span class="text-[10px] font-medium">${item.label}</span>`;
        aMob.onclick = (e) => { e.preventDefault(); renderView(item.id); };
        mobileNav.appendChild(aMob);
    });
}

function updateNavHighlight(viewId) {
    document.querySelectorAll('[class^="nav-item-"]').forEach(el => {
        el.classList.remove('text-brand-red', 'bg-brand-red/10', 'text-brand-red');
        if (el.parentElement.id === 'pc-nav') {
            el.classList.remove('bg-brand-red/10', 'text-brand-red');
            el.classList.add('text-gray-600');
        } else {
            el.classList.remove('text-brand-red');
            el.classList.add('text-gray-500');
        }
    });
    
    document.querySelectorAll(`.nav-item-${viewId}`).forEach(el => {
        if (el.parentElement.id === 'pc-nav') {
            el.classList.add('bg-brand-red/10', 'text-brand-red');
            el.classList.remove('text-gray-600');
        } else {
            el.classList.add('text-brand-red');
            el.classList.remove('text-gray-500');
        }
    });
    
    const navItem = NAV_ITEMS.find(n => n.id === viewId);
    if (navItem) {
        document.getElementById('mobile-header-title').textContent = navItem.label;
    }
}

// Rendering
function renderView(viewId) {
    state.currentView = viewId;
    updateNavHighlight(viewId);
    const content = document.getElementById('app-content');
    
    switch(viewId) {
        case 'dashboard': renderDashboard(content); break;
        case 'orders_single': renderOrders(content, 'single'); break;
        case 'orders_birthday': renderOrders(content, 'birthday'); break;
        case 'tasks': renderTasks(content); break;
        case 'scores': renderScores(content); break;
        case 'more': renderMore(content); break;
        case 'staff': renderStaff(content); break;
        case 'reports': renderReports(content); break;
        case 'settings': renderSettings(content); break;
        case 'products': renderProducts(content); break;
        default: content.innerHTML = '<div class="p-4 text-center">Not implemented</div>';
    }
}

// ================= MODULES =================
// View modules are loaded from frontend/views/*.js


// Start app
document.addEventListener('DOMContentLoaded', initApp);
