function renderReports(container) {
    if (!['admin', 'head_chef', 'sales_lead'].includes(state.user.role)) {
        container.innerHTML = '<div class="p-6 text-center text-red-500">Bạn không có quyền truy cập</div>';
        return;
    }

    const preorders = state.data.preorders || [];
    const violations = state.data.violationRecords || [];
    
    // Quick calculations
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = preorders.filter(o => o.createdAt && o.createdAt.startsWith(today));
    
    let totalDeposit = 0;
    let totalDue = 0;
    
    todayOrders.forEach(o => {
        totalDeposit += (o.deposit || 0);
        totalDue += ((o.price * o.quantity) - (o.deposit || 0));
    });

    const activeViolations = violations.filter(v => v.status === 'approved').length;

    let html = `
        <div class="mb-6 flex items-center gap-3">
            <button onclick="renderView('more')" class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm border border-gray-100 hover:text-brand-red transition-colors">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2 class="text-xl font-bold text-gray-800">Báo cáo & Thống kê</h2>
        </div>
        
        <div class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Hôm nay</h3>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div class="text-gray-500 text-xs mb-1">Đơn đặt trước</div>
                    <div class="text-2xl font-black text-gray-900">${todayOrders.length}</div>
                </div>
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div class="text-gray-500 text-xs mb-1">Phiếu lỗi đã duyệt</div>
                    <div class="text-2xl font-black text-brand-red">${activeViolations}</div>
                </div>
            </div>

            <div class="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-xl shadow-sm text-white relative overflow-hidden mt-2">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                <div class="text-gray-300 text-sm mb-1">Tổng tiền cọc nhận hôm nay</div>
                <div class="text-3xl font-black text-brand-cream mb-4">${formatCurrency(totalDeposit)}</div>
                
                <div class="text-gray-300 text-sm mb-1">Dự thu thêm (khi giao)</div>
                <div class="text-xl font-bold text-white">${formatCurrency(totalDue)}</div>
            </div>
            
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-8">Tổng quan kho dữ liệu</h3>
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                <div class="p-4 flex justify-between items-center">
                    <span class="text-sm text-gray-700">Tổng số đơn lưu trữ</span>
                    <span class="font-bold text-gray-900">${preorders.length}</span>
                </div>
                <div class="p-4 flex justify-between items-center">
                    <span class="text-sm text-gray-700">Tổng số nhân viên</span>
                    <span class="font-bold text-gray-900">${state.data.users ? state.data.users.length : 0}</span>
                </div>
                <div class="p-4 flex justify-between items-center">
                    <span class="text-sm text-gray-700">Tổng số phiếu vi phạm</span>
                    <span class="font-bold text-gray-900">${violations.length}</span>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}
