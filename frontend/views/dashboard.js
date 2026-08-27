function renderDashboard(container) {
    const tasks = state.data.productionTasks || [];
    const orders = state.data.preorders || [];
    const incidents = state.data.incidents || [];
    const myTasks = tasks.filter(t => t.assigneeId === state.user.id);
    const todayStr = new Date().toISOString().split('T')[0];
    
    const todayOrders = orders.filter(o => o.deliveryTime.startsWith(todayStr));
    const pendingOrders = todayOrders.filter(o => ['draft', 'pending'].includes(o.status));
    const activeTasks = tasks.filter(t => ['assigned', 'in_progress'].includes(t.status));
    
    let html = `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-800">Tổng quan hôm nay</h2>
            <div class="text-sm text-gray-500">${formatDate(new Date().toISOString())}</div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover-card">
                <div class="text-gray-500 text-xs mb-1 font-medium">Đơn hàng mới</div>
                <div class="text-2xl font-bold text-gray-900">${pendingOrders.length}</div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover-card">
                <div class="text-gray-500 text-xs mb-1 font-medium">Việc đang làm</div>
                <div class="text-2xl font-bold text-brand-orange">${activeTasks.length}</div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover-card">
                <div class="text-gray-500 text-xs mb-1 font-medium">Đơn giao hôm nay</div>
                <div class="text-2xl font-bold text-gray-900">${todayOrders.length}</div>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover-card">
                <div class="text-gray-500 text-xs mb-1 font-medium">Sự cố trong ngày</div>
                <div class="text-2xl font-bold text-brand-red">${incidents.filter(i => i.datetime.startsWith(todayStr)).length}</div>
            </div>
        </div>
    `;

    // Role specific content
    if (['sales_lead', 'sales_staff', 'admin'].includes(state.user.role)) {
        html += `
            <div class="flex justify-between items-center mb-3 mt-8">
                <h3 class="text-lg font-bold text-gray-800">Đơn hàng cần xử lý</h3>
                <button onclick="renderView('orders_birthday')" class="text-brand-red text-sm font-medium">Xem tất cả</button>
            </div>
            <div class="space-y-3">
        `;
        if (pendingOrders.length === 0) {
            html += `<div class="bg-white p-6 rounded-xl text-center text-gray-500 border border-dashed border-gray-300">Không có đơn hàng mới</div>`;
        } else {
            pendingOrders.forEach(ord => {
                const prod = state.data.products.find(p => p.id === ord.productId);
                const isBirthday = prod && prod.category === 'Bánh kem';
                html += `
                    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover-card flex justify-between items-center cursor-pointer" onclick="renderView('${isBirthday ? 'orders_birthday' : 'orders_single'}')">
                        <div>
                            <div class="text-xs font-semibold text-brand-red mb-1">${ord.id} - ${ord.customerName}</div>
                            <div class="font-medium text-gray-900">${ord.phone} - Giao lúc: ${formatDate(ord.deliveryTime, true)}</div>
                        </div>
                        <button class="bg-brand-red text-white px-3 py-1.5 rounded-lg text-sm font-medium">Kiểm tra</button>
                    </div>
                `;
            });
        }
        html += `</div>`;
    }

    container.innerHTML = html;
}
