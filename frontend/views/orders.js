window.currentOrderType = null;
window.currentOrderMonthFilter = 'all';

function renderOrders(container, orderType = 'all') {
    if (window.currentOrderType !== orderType) {
        window.currentOrderType = orderType;
        window.currentOrderMonthFilter = 'all';
    }
    
    let orders = state.data.preorders || [];
    const products = state.data.products || [];
    
    // Filter by orderType
    if (orderType === 'single') {
        orders = orders.filter(function(ord) {
            var p = products.find(function(prod) { return prod.id === ord.productId; });
            return p && p.category !== 'Bánh kem' && p.category !== 'Bánh sinh nhật';
        });
    } else if (orderType === 'birthday') {
        orders = orders.filter(function(ord) {
            var p = products.find(function(prod) { return prod.id === ord.productId; });
            return p && (p.category === 'Bánh kem' || p.category === 'Bánh sinh nhật');
        });
    }
    
    // Helper to get order creation date
    function getOrderDate(ord) {
        if (ord.createdAt) return new Date(ord.createdAt);
        var m = ord.id.match(/^ord-(\d+)$/);
        if (m) return new Date(parseInt(m[1]));
        return new Date();
    }
    
    var currentMonth = new Date().getMonth();
    var currentYear = new Date().getFullYear();
    
    // Build month-only list to compute sequential numbers
    var monthOrders = orders.filter(function(o) {
        var d = getOrderDate(o);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).sort(function(a, b) { return getOrderDate(a) - getOrderDate(b); });
    
    // Assign display titles
    orders.forEach(function(o) {
        var d = getOrderDate(o);
        var dateStr = d.toLocaleDateString('vi-VN');
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            var idx = monthOrders.findIndex(function(mo) { return mo.id === o.id; }) + 1;
            o.displayTitle = 'Ord' + String(idx).padStart(3, '0') + ' - ' + dateStr;
        } else {
            o.displayTitle = o.id + ' - ' + dateStr;
        }
    });
    
    // Apply month filter
    if (window.currentOrderMonthFilter === 'current') {
        orders = orders.filter(function(o) {
            var d = getOrderDate(o);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    }
    
    var title = orderType === 'single' ? 'Đơn đặt trước bánh lẻ' : (orderType === 'birthday' ? 'Đơn bánh sinh nhật' : 'Tất cả Đơn hàng');
    
    var showCreate = ['sales_lead', 'sales_staff', 'admin'].includes(state.user.role);
    var filterAllActive = window.currentOrderMonthFilter === 'all';
    var filterCurrentActive = window.currentOrderMonthFilter === 'current';
    
    var html = '<div class="mb-6 flex justify-between items-center">';
    html += '<h2 class="text-xl font-bold text-gray-800">' + title + '</h2>';
    if (showCreate) {
        html += '<button onclick="showCreateOrderModal()" class="bg-brand-red text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">';
        html += '<i class="fas fa-plus mr-1"></i> Tạo đơn</button>';
    }
    html += '</div>';
    
    // Month filter buttons
    html += '<div class="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide items-center">';
    html += '<span class="text-sm font-medium text-gray-500 whitespace-nowrap mr-2">Thời gian:</span>';
    html += '<button onclick="window.currentOrderMonthFilter=\'all\'; renderView(state.currentView)" class="whitespace-nowrap px-4 py-2 rounded-full ' + (filterAllActive ? 'bg-brand-red text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50') + ' text-sm font-medium">Tất cả</button>';
    html += '<button onclick="window.currentOrderMonthFilter=\'current\'; renderView(state.currentView)" class="whitespace-nowrap px-4 py-2 rounded-full ' + (filterCurrentActive ? 'bg-brand-red text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50') + ' text-sm font-medium">Tháng này</button>';
    html += '</div>';
    
    html += '<div class="space-y-4">';
    
    if (orders.length === 0) {
        html += '<div class="bg-white p-8 rounded-xl text-center text-gray-500 border border-dashed border-gray-300">Không có đơn hàng nào.</div>';
    } else {
        orders.sort(function(a, b) { return new Date(a.deliveryTime) - new Date(b.deliveryTime); }).forEach(function(ord) {
            var prod = products.find(function(p) { return p.id === ord.productId; });
            
            var statusBadge = '';
            if (ord.status === 'draft') statusBadge = '<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">Nháp</span>';
            if (ord.status === 'pending') statusBadge = '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-md">Chờ xác nhận</span>';
            if (ord.status === 'confirmed') statusBadge = '<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-md">Đã xác nhận</span>';
            if (ord.status === 'kitchen_received') statusBadge = '<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md">Bếp đã nhận</span>';
            if (ord.status === 'producing') statusBadge = '<span class="px-2 py-1 bg-brand-orange/20 text-brand-orange text-xs font-semibold rounded-md">Đang sản xuất</span>';
            
            var prodImage = '';
            if (prod && prod.photoUrl) {
                prodImage = '<div class="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg overflow-hidden border border-gray-200"><img src="' + prod.photoUrl + '" class="w-full h-full object-cover" /></div>';
            } else {
                prodImage = '<div class="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-300"><i class="fas fa-birthday-cake text-2xl"></i></div>';
            }
            
            var isOverdue = new Date(ord.deliveryTime) < new Date();
            var deliveryClass = isOverdue ? 'text-brand-red' : 'text-gray-800';
            var prodName = prod ? prod.name : ord.productId;
            
            html += '<div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover-card flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">';
            html += prodImage;
            html += '<div class="flex-1">';
            html += '<div class="flex items-center gap-3 mb-1">';
            html += '<span class="text-sm font-bold text-brand-red">' + ord.displayTitle + '</span>';
            html += statusBadge;
            html += '</div>';
            html += '<h3 class="font-bold text-gray-900 text-lg mb-1">' + ord.customerName + ' - ' + ord.phone + '</h3>';
            html += '<p class="text-sm text-gray-600 mb-2"><strong>' + prodName + '</strong> (Kích thước: ' + ord.size + ' | SL: ' + ord.quantity + ')</p>';
            html += '<div class="flex items-center gap-4 text-xs text-gray-500">';
            html += '<span class="flex items-center gap-1"><i class="far fa-clock"></i> Giao: <strong class="' + deliveryClass + '">' + formatDate(ord.deliveryTime, true) + '</strong></span>';
            html += '<span class="flex items-center gap-1"><i class="fas fa-money-bill-wave"></i> Thu thêm: <strong class="text-brand-red">' + formatCurrency(ord.remainingAmount) + '</strong></span>';
            html += '</div></div>';
            html += '<div class="flex flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">';
            html += '<button onclick="viewOrderDetails(\'' + ord.id + '\')" class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors w-full">Chi tiết</button>';
            html += '</div></div>';
        });
    }
    
    html += '</div>';
    container.innerHTML = html;
}

window.viewOrderDetails = function(orderId) {
    var ord = state.data.preorders.find(function(o) { return o.id === orderId; });
    var prod = state.data.products.find(function(p) { return p.id === ord.productId; });
    
    var prodName = prod ? prod.name : ord.productId;
    
    var detailHtml = '<div class="space-y-4">';
    detailHtml += '<div class="flex justify-between items-center pb-3 border-b border-gray-100"><span class="text-sm text-gray-500">Khách hàng</span><span class="font-medium">' + ord.customerName + ' - ' + ord.phone + '</span></div>';
    detailHtml += '<div class="flex justify-between items-center pb-3 border-b border-gray-100"><span class="text-sm text-gray-500">Giao lúc</span><span class="font-medium text-brand-red">' + formatDate(ord.deliveryTime, true) + '</span></div>';
    detailHtml += '<div class="flex justify-between items-center pb-3 border-b border-gray-100"><span class="text-sm text-gray-500">Sản phẩm</span><span class="font-medium text-right">' + prodName + '<br><span class="text-xs text-gray-400">Size: ' + ord.size + ' | ' + (ord.flavor || '') + '</span></span></div>';
    detailHtml += '<div class="flex justify-between items-center pb-3 border-b border-gray-100"><span class="text-sm text-gray-500">Ghi chữ</span><span class="font-medium italic">"' + (ord.messageOnCake || '') + '"</span></div>';
    detailHtml += '<div class="flex justify-between items-center pb-3 border-b border-gray-100"><span class="text-sm text-gray-500">Đã cọc</span><span class="font-medium text-brand-green">' + formatCurrency(ord.depositAmount) + '</span></div>';
    detailHtml += '<div class="flex justify-between items-center pb-3 border-b border-gray-100"><span class="text-sm text-gray-500">Cần thu</span><span class="font-medium text-brand-red text-lg">' + formatCurrency(ord.remainingAmount) + '</span></div>';
    detailHtml += '</div>';
    
    var modalTitle = ord.displayTitle || ('Chi tiết đơn ' + ord.id);
    showModal(modalTitle, detailHtml);
};

window.showCreateOrderModal = function() {
    var products = state.data.products || [];
    var cakeProducts = products.filter(function(p) { return p.category === 'Bánh sinh nhật'; });
    
    var prodGridHtml = '<div class="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x">';
    cakeProducts.forEach(function(p) {
        var imgTag = p.photoUrl 
            ? '<img src="' + p.photoUrl + '" class="w-full h-full object-cover">' 
            : '<i class="fas fa-birthday-cake text-xl text-gray-300"></i>';
        prodGridHtml += '<div id="cake-card-' + p.id + '" class="cake-selector-card flex-none w-32 border-2 border-transparent border-gray-200 rounded-xl p-2 cursor-pointer flex flex-col items-center hover:border-brand-red/50 hover:bg-red-50/50 transition-all snap-start shadow-sm" onclick="selectCake(\'' + p.id + '\', ' + p.price + ')">';
        prodGridHtml += '<div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 mb-2 flex items-center justify-center shrink-0">' + imgTag + '</div>';
        prodGridHtml += '<div class="text-xs font-bold text-center leading-tight mb-1 text-gray-800 line-clamp-2 h-8 w-full">' + p.name + '</div>';
        prodGridHtml += '<div class="text-brand-red text-xs font-bold mt-auto">' + formatCurrency(p.price) + '</div>';
        prodGridHtml += '</div>';
    });
    prodGridHtml += '</div><input type="hidden" id="ordProductId" required>';
    
    var editMenuBtn = '';
    if (['admin', 'head_chef'].includes(state.user.role)) {
        editMenuBtn = '<button type="button" onclick="closeModal(); renderView(\'products\')" class="text-xs text-brand-red font-medium hover:underline flex items-center gap-1"><i class="fas fa-edit"></i> Sửa Menu</button>';
    }
    
    var html = '<form onsubmit="submitCreateOrder(event)" class="space-y-4 max-h-[75vh] overflow-y-auto pr-2">';
    html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>';
    html += '<div class="grid grid-cols-2 gap-2">';
    html += '<input type="text" id="ordCustomerName" placeholder="Tên khách" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">';
    html += '<input type="tel" id="ordCustomerPhone" placeholder="Số điện thoại" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">';
    html += '</div></div>';
    
    html += '<div><div class="flex justify-between items-center mb-2">';
    html += '<label class="block text-sm font-medium text-gray-700">Chọn Bánh Sinh Nhật</label>';
    html += editMenuBtn + '</div>' + prodGridHtml + '</div>';
    
    html += '<div class="grid grid-cols-2 gap-4">';
    html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Kích thước</label>';
    html += '<select id="ordSize" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">';
    html += '<option value="16cm">16 cm</option><option value="18cm">18 cm</option><option value="20cm">20 cm</option><option value="22cm">22 cm</option><option value="24cm">24 cm</option><option value="Khác">Khác</option>';
    html += '</select></div>';
    html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Thời gian giao</label>';
    html += '<input type="datetime-local" id="ordDeliveryTime" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">';
    html += '</div></div>';
    
    html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Ghi chữ lên bánh</label>';
    html += '<input type="text" id="ordMessage" placeholder="VD: Chúc mừng sinh nhật..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red"></div>';
    
    html += '<div class="grid grid-cols-3 gap-2">';
    html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Giá bánh (đ)</label>';
    html += '<input type="number" id="ordCakePrice" value="0" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red" oninput="calcRemaining()"></div>';
    html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Phí ship (đ)</label>';
    html += '<input type="number" id="ordShippingFee" value="0" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red" oninput="calcRemaining()"></div>';
    html += '<div><label class="block text-sm font-medium text-gray-700 mb-1 text-brand-red">Cần thu (đ)</label>';
    html += '<input type="number" id="ordRemaining" value="0" required class="w-full px-3 py-2 border border-brand-red bg-red-50 rounded-lg text-sm font-bold focus:ring-brand-red focus:border-brand-red" placeholder="Nếu đã thanh toán nhập 0"></div>';
    html += '</div>';
    html += '<p class="text-xs text-gray-500 italic mt-1">* Nếu khách đã thanh toán toàn bộ, vui lòng nhập số tiền "Cần thu" = 0</p>';
    
    html += '<button type="submit" class="w-full bg-brand-red text-white py-3 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors mt-6">Tạo đơn hàng</button>';
    html += '</form>';
    
    showModal('Tạo Đơn Bánh Sinh Nhật', html);
    
    // Set default datetime to tomorrow
    var tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    tmr.setHours(12, 0, 0, 0);
    var tzoffset = tmr.getTimezoneOffset() * 60000;
    var localISOTime = (new Date(tmr - tzoffset)).toISOString().slice(0, 16);
    document.getElementById('ordDeliveryTime').value = localISOTime;
};

window.selectCake = function(id, price) {
    document.querySelectorAll('.cake-selector-card').forEach(function(el) {
        el.classList.remove('border-brand-red', 'bg-red-50');
        el.classList.add('border-gray-200');
    });
    var selected = document.getElementById('cake-card-' + id);
    selected.classList.remove('border-gray-200');
    selected.classList.add('border-brand-red', 'bg-red-50');
    
    document.getElementById('ordProductId').value = id;
    
    var priceInput = document.getElementById('ordCakePrice');
    priceInput.value = price;
    calcRemaining();
};

window.calcRemaining = function() {
    var price = parseInt(document.getElementById('ordCakePrice').value) || 0;
    var ship = parseInt(document.getElementById('ordShippingFee').value) || 0;
    document.getElementById('ordRemaining').value = price + ship;
};

window.submitCreateOrder = async function(e) {
    e.preventDefault();
    
    var price = parseInt(document.getElementById('ordCakePrice').value) || 0;
    var ship = parseInt(document.getElementById('ordShippingFee').value) || 0;
    var remaining = parseInt(document.getElementById('ordRemaining').value) || 0;
    var deposit = (price + ship) - remaining;
    
    var productId = document.getElementById('ordProductId').value;
    if (!productId) {
        showToast('Vui lòng chọn bánh sinh nhật', 'error');
        return;
    }
    
    var ord = {
        id: 'ord-' + Date.now(),
        customerName: document.getElementById('ordCustomerName').value,
        phone: document.getElementById('ordCustomerPhone').value,
        productId: document.getElementById('ordProductId').value,
        size: document.getElementById('ordSize').value,
        flavor: 'Mặc định',
        messageOnCake: document.getElementById('ordMessage').value,
        depositAmount: deposit >= 0 ? deposit : 0,
        remainingAmount: remaining,
        deliveryTime: document.getElementById('ordDeliveryTime').value,
        createdAt: new Date().toISOString(),
        status: 'pending',
        quantity: 1
    };
    
    var res = await fetchApi('/preorders', { method: 'POST', body: JSON.stringify(ord) });
    if (res && res.success) {
        showToast('Đã tạo đơn sinh nhật thành công');
        closeModal();
        await fetchInitialData();
        if (state.currentView.startsWith('orders')) renderView(state.currentView);
    }
};
