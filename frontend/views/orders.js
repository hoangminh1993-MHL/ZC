function renderOrders(container, orderType = 'all') {
    let orders = state.data.preorders || [];
    const products = state.data.products || [];
    
    // Filter by orderType
    if (orderType === 'single') {
        orders = orders.filter(ord => {
            const p = products.find(prod => prod.id === ord.productId);
            return p && p.category !== 'Bánh kem';
        });
    } else if (orderType === 'birthday') {
        orders = orders.filter(ord => {
            const p = products.find(prod => prod.id === ord.productId);
            return p && p.category === 'Bánh kem';
        });
    }
    
    const title = orderType === 'single' ? 'Đơn đặt trước bánh lẻ' : (orderType === 'birthday' ? 'Đơn bánh sinh nhật' : 'Tất cả Đơn hàng');
    
    let html = `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-800">${title}</h2>
            ${['sales_lead', 'sales_staff', 'admin'].includes(state.user.role) ? 
                `<button onclick="alert('Form tạo đơn')" class="bg-brand-red text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                    <i class="fas fa-plus mr-1"></i> Tạo đơn
                </button>` : ''}
        </div>
        
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button class="whitespace-nowrap px-4 py-2 rounded-full bg-brand-red text-white text-sm font-medium">Tất cả</button>
            <button class="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Chờ bếp nhận</button>
            <button class="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Đang sản xuất</button>
            <button class="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Sẵn sàng giao</button>
        </div>
        
        <div class="space-y-4">
    `;
    
    if (orders.length === 0) {
        html += `<div class="bg-white p-8 rounded-xl text-center text-gray-500 border border-dashed border-gray-300">Không có đơn hàng nào.</div>`;
    } else {
        orders.sort((a, b) => new Date(a.deliveryTime) - new Date(b.deliveryTime)).forEach(ord => {
            const prod = products.find(p => p.id === ord.productId);
            
            let statusBadge = '';
            if (ord.status === 'draft') statusBadge = '<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">Nháp</span>';
            if (ord.status === 'pending') statusBadge = '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-md">Chờ xác nhận</span>';
            if (ord.status === 'confirmed') statusBadge = '<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-md">Đã xác nhận</span>';
            if (ord.status === 'kitchen_received') statusBadge = '<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md">Bếp đã nhận</span>';
            if (ord.status === 'producing') statusBadge = '<span class="px-2 py-1 bg-brand-orange/20 text-brand-orange text-xs font-semibold rounded-md">Đang sản xuất</span>';
            
            html += `
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover-card flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <span class="text-sm font-bold text-brand-red">${ord.id}</span>
                            ${statusBadge}
                        </div>
                        <h3 class="font-bold text-gray-900 text-lg mb-1">${ord.customerName} - ${ord.phone}</h3>
                        <p class="text-sm text-gray-600 mb-2">
                            <strong>${prod ? prod.name : ord.productId}</strong> (Kích thước: ${ord.size} | SL: ${ord.quantity})
                        </p>
                        <div class="flex items-center gap-4 text-xs text-gray-500">
                            <span class="flex items-center gap-1"><i class="far fa-clock"></i> Giao: <strong class="${new Date(ord.deliveryTime) < new Date() ? 'text-brand-red' : 'text-gray-800'}">${formatDate(ord.deliveryTime, true)}</strong></span>
                            <span class="flex items-center gap-1"><i class="fas fa-money-bill-wave"></i> Thu thêm: <strong class="text-brand-red">${formatCurrency(ord.remainingAmount)}</strong></span>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <button onclick="viewOrderDetails('${ord.id}')" class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Chi tiết</button>
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div>`;
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
    
    showModal(`Chi tiết đơn ${ord.id}`, detailHtml);
};
