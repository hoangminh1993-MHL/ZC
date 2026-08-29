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
        orders = orders.filter(ord => {
            const p = products.find(prod => prod.id === ord.productId);
            return p && p.category !== 'Bánh kem' && p.category !== 'Bánh sinh nhật';
        });
    } else if (orderType === 'birthday') {
        orders = orders.filter(ord => {
            const p = products.find(prod => prod.id === ord.productId);
            return p && (p.category === 'Bánh kem' || p.category === 'Bánh sinh nhật');
        });
    }
    
    const getOrderDate = (ord) => {
        if (ord.createdAt) return new Date(ord.createdAt);
        const m = ord.id.match(/^ord-(\d+)$/);
        if (m) return new Date(parseInt(m[1]));
        return new Date();
    };
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthOrders = [...orders].filter(o => {
        const d = getOrderDate(o);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).sort((a, b) => getOrderDate(a) - getOrderDate(b));
    
    orders.forEach(o => {
        const d = getOrderDate(o);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const idx = monthOrders.findIndex(mo => mo.id === o.id) + 1;
            o.displayTitle = `Ord${String(idx).padStart(3, '0')} - ${d.toLocaleDateString('vi-VN')}`;
        } else {
            o.displayTitle = `${o.id} - ${d.toLocaleDateString('vi-VN')}`;
        }
    });
    
    if (window.currentOrderMonthFilter === 'current') {
        orders = orders.filter(o => {
            const d = getOrderDate(o);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    }
    
    const title = orderType === 'single' ? 'Đơn đặt trước bánh lẻ' : (orderType === 'birthday' ? 'Đơn bánh sinh nhật' : 'Tất cả Đơn hàng');
    
    let html = `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-800">\${title}</h2>
            \${['sales_lead', 'sales_staff', 'admin'].includes(state.user.role) ? 
                \`<button onclick="showCreateOrderModal()" class="bg-brand-red text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                    <i class="fas fa-plus mr-1"></i> Tạo đơn
                </button>\` : ''}
        </div>
        
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide items-center">
            <span class="text-sm font-medium text-gray-500 whitespace-nowrap mr-2">Thời gian:</span>
            <button onclick="window.currentOrderMonthFilter='all'; renderView(state.currentView)" class="whitespace-nowrap px-4 py-2 rounded-full \${window.currentOrderMonthFilter === 'all' ? 'bg-brand-red text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'} text-sm font-medium">Tất cả</button>
            <button onclick="window.currentOrderMonthFilter='current'; renderView(state.currentView)" class="whitespace-nowrap px-4 py-2 rounded-full \${window.currentOrderMonthFilter === 'current' ? 'bg-brand-red text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'} text-sm font-medium">Tháng này</button>
        </div>
        
        <div class="space-y-4">
    `;
    
    if (orders.length === 0) {
        html += \`<div class="bg-white p-8 rounded-xl text-center text-gray-500 border border-dashed border-gray-300">Không có đơn hàng nào.</div>\`;
    } else {
        orders.sort((a, b) => new Date(a.deliveryTime) - new Date(b.deliveryTime)).forEach(ord => {
            const prod = products.find(p => p.id === ord.productId);
            
            let statusBadge = '';
            if (ord.status === 'draft') statusBadge = '<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">Nháp</span>';
            if (ord.status === 'pending') statusBadge = '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-md">Chờ xác nhận</span>';
            if (ord.status === 'confirmed') statusBadge = '<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-md">Đã xác nhận</span>';
            if (ord.status === 'kitchen_received') statusBadge = '<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md">Bếp đã nhận</span>';
            if (ord.status === 'producing') statusBadge = '<span class="px-2 py-1 bg-brand-orange/20 text-brand-orange text-xs font-semibold rounded-md">Đang sản xuất</span>';
            
            let prodImage = '';
            if (prod && prod.photoUrl) {
                prodImage = \`<div class="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg overflow-hidden border border-gray-200"><img src="\${prod.photoUrl}" class="w-full h-full object-cover" /></div>\`;
            } else {
                prodImage = \`<div class="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-300"><i class="fas fa-birthday-cake text-2xl"></i></div>\`;
            }
            
            html += \`
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover-card flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    \${prodImage}
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <span class="text-sm font-bold text-brand-red">\${ord.displayTitle}</span>
                            \${statusBadge}
                        </div>
                        <h3 class="font-bold text-gray-900 text-lg mb-1">\${ord.customerName} - \${ord.phone}</h3>
                        <p class="text-sm text-gray-600 mb-2">
                            <strong>\${prod ? prod.name : ord.productId}</strong> (Kích thước: \${ord.size} | SL: \${ord.quantity})
                        </p>
                        <div class="flex items-center gap-4 text-xs text-gray-500">
                            <span class="flex items-center gap-1"><i class="far fa-clock"></i> Giao: <strong class="\${new Date(ord.deliveryTime) < new Date() ? 'text-brand-red' : 'text-gray-800'}">\${formatDate(ord.deliveryTime, true)}</strong></span>
                            <span class="flex items-center gap-1"><i class="fas fa-money-bill-wave"></i> Thu thêm: <strong class="text-brand-red">\${formatCurrency(ord.remainingAmount)}</strong></span>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
                        <button onclick="viewOrderDetails('\${ord.id}')" class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors w-full">Chi tiết</button>
                    </div>
                </div>
            \`;
        });
    }
    
    html += \`</div>\`;
    container.innerHTML = html;
}


window.viewOrderDetails = function(orderId) {
    const ord = state.data.preorders.find(o => o.id === orderId);
    const prod = state.data.products.find(p => p.id === ord.productId);
    
    let detailHtml = `
        <div class="space-y-4">
            <div class="flex justify-between items-center pb-3 border-b border-gray-100">
                <span class="text-sm text-gray-500">Khách hàng</span>
                <span class="font-medium">${ord.customerName} - ${ord.phone}</span>
            </div>
            <div class="flex justify-between items-center pb-3 border-b border-gray-100">
                <span class="text-sm text-gray-500">Giao lúc</span>
                <span class="font-medium text-brand-red">${formatDate(ord.deliveryTime, true)}</span>
            </div>
            <div class="flex justify-between items-center pb-3 border-b border-gray-100">
                <span class="text-sm text-gray-500">Sản phẩm</span>
                <span class="font-medium text-right">${prod ? prod.name : ord.productId}<br><span class="text-xs text-gray-400">Size: ${ord.size} | ${ord.flavor}</span></span>
            </div>
            <div class="flex justify-between items-center pb-3 border-b border-gray-100">
                <span class="text-sm text-gray-500">Ghi chữ</span>
                <span class="font-medium italic">"${ord.messageOnCake}"</span>
            </div>
            <div class="flex justify-between items-center pb-3 border-b border-gray-100">
                <span class="text-sm text-gray-500">Đã cọc</span>
                <span class="font-medium text-brand-green">${formatCurrency(ord.depositAmount)}</span>
            </div>
            <div class="flex justify-between items-center pb-3 border-b border-gray-100">
                <span class="text-sm text-gray-500">Cần thu</span>
                <span class="font-medium text-brand-red text-lg">${formatCurrency(ord.remainingAmount)}</span>
            </div>
        </div>
    `;
    
    showModal(ord.displayTitle || ('Chi tiết đơn ' + ord.id), detailHtml);
};

window.showCreateOrderModal = function() {
    const products = state.data.products || [];
    const cakeProducts = products.filter(p => p.category === 'Bánh sinh nhật');
    
    let prodGridHtml = `<div class="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x">`;
    cakeProducts.forEach(p => {
        prodGridHtml += `
            <div id="cake-card-${p.id}" class="cake-selector-card flex-none w-32 border-2 border-transparent border-gray-200 rounded-xl p-2 cursor-pointer flex flex-col items-center hover:border-brand-red/50 hover:bg-red-50/50 transition-all snap-start shadow-sm" onclick="selectCake('${p.id}', ${p.price})">
                <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 mb-2 flex items-center justify-center shrink-0">
                    ${p.photoUrl ? `<img src="${p.photoUrl}" class="w-full h-full object-cover">` : `<i class="fas fa-birthday-cake text-xl text-gray-300"></i>`}
                </div>
                <div class="text-xs font-bold text-center leading-tight mb-1 text-gray-800 line-clamp-2 h-8 w-full">${p.name}</div>
                <div class="text-brand-red text-xs font-bold mt-auto">${formatCurrency(p.price)}</div>
            </div>
        `;
    });
    prodGridHtml += `</div><input type="hidden" id="ordProductId" required>`;
    
    let html = `
        <form onsubmit="submitCreateOrder(event)" class="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="ordCustomerName" placeholder="Tên khách" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">
                    <input type="tel" id="ordCustomerPhone" placeholder="Số điện thoại" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">
                </div>
            </div>
            
            <div>
                <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-medium text-gray-700">Chọn Bánh Sinh Nhật</label>
                    ${['admin', 'head_chef'].includes(state.user.role) ? `<button type="button" onclick="closeModal(); renderView('products')" class="text-xs text-brand-red font-medium hover:underline flex items-center gap-1"><i class="fas fa-edit"></i> Sửa Menu</button>` : ''}
                </div>
                ${prodGridHtml}
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Kích thước</label>
                    <select id="ordSize" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">
                        <option value="16cm">16 cm</option>
                        <option value="18cm">18 cm</option>
                        <option value="20cm">20 cm</option>
                        <option value="22cm">22 cm</option>
                        <option value="24cm">24 cm</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Thời gian giao</label>
                    <input type="datetime-local" id="ordDeliveryTime" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ghi chữ lên bánh</label>
                <input type="text" id="ordMessage" placeholder="VD: Chúc mừng sinh nhật..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">
            </div>
            
            <div class="grid grid-cols-3 gap-2">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Giá bánh (đ)</label>
                    <input type="number" id="ordCakePrice" value="0" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red" oninput="calcRemaining()">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phí ship (đ)</label>
                    <input type="number" id="ordShippingFee" value="0" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red" oninput="calcRemaining()">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1 text-brand-red">Cần thu (đ)</label>
                    <input type="number" id="ordRemaining" value="0" required class="w-full px-3 py-2 border border-brand-red bg-red-50 rounded-lg text-sm font-bold focus:ring-brand-red focus:border-brand-red" placeholder="Nếu đã thanh toán nhập 0">
                </div>
            </div>
            <p class="text-xs text-gray-500 italic mt-1">* Nếu khách đã thanh toán toàn bộ, vui lòng nhập số tiền "Cần thu" = 0</p>
            
            <button type="submit" class="w-full bg-brand-red text-white py-3 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors mt-6">
                Tạo đơn hàng
            </button>
        </form>
    `;
    
    showModal('Tạo Đơn Bánh Sinh Nhật', html);
    
    // Set default datetime to tomorrow
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    tmr.setHours(12, 0, 0, 0);
    // Format to yyyy-mm-ddThh:mm
    const tzoffset = tmr.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(tmr - tzoffset)).toISOString().slice(0, 16);
    document.getElementById('ordDeliveryTime').value = localISOTime;
};

window.selectCake = function(id, price) {
    document.querySelectorAll('.cake-selector-card').forEach(el => {
        el.classList.remove('border-brand-red', 'bg-red-50');
        el.classList.add('border-gray-200');
    });
    const selected = document.getElementById(`cake-card-${id}`);
    selected.classList.remove('border-gray-200');
    selected.classList.add('border-brand-red', 'bg-red-50');
    
    document.getElementById('ordProductId').value = id;
    
    const priceInput = document.getElementById('ordCakePrice');
    priceInput.value = price;
    calcRemaining();
};

window.calcRemaining = function() {
    const price = parseInt(document.getElementById('ordCakePrice').value) || 0;
    const ship = parseInt(document.getElementById('ordShippingFee').value) || 0;
    document.getElementById('ordRemaining').value = price + ship;
};

window.submitCreateOrder = async function(e) {
    e.preventDefault();
    
    const price = parseInt(document.getElementById('ordCakePrice').value) || 0;
    const ship = parseInt(document.getElementById('ordShippingFee').value) || 0;
    const remaining = parseInt(document.getElementById('ordRemaining').value) || 0;
    const deposit = (price + ship) - remaining;
    
    const productId = document.getElementById('ordProductId').value;
    if (!productId) {
        showToast('Vui lòng chọn bánh sinh nhật', 'error');
        return;
    }
    
    const ord = {
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
        status: 'pending',
        quantity: 1
    };
    
    const res = await fetchApi('/preorders', { method: 'POST', body: JSON.stringify(ord) });
    if (res && res.success) {
        showToast('Đã tạo đơn sinh nhật thành công');
        closeModal();
        await fetchInitialData();
        if (state.currentView.startsWith('orders')) renderView(state.currentView);
    }
};

