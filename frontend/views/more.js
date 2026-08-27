function renderMore(container) {
    const isManager = ['admin', 'head_chef', 'sales_lead'].includes(state.user.role);
    
    let html = `
        <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-800">Cài đặt & Thêm</h2>
        </div>
        
        <div class="space-y-4">
    `;

    // Menu list
    const menus = [
        { id: 'profile', icon: 'fa-user-circle', title: 'Hồ sơ cá nhân', desc: 'Xem thông tin và đổi mật khẩu', roles: Object.keys(ROLE_NAMES) },
        { id: 'staff', icon: 'fa-users', title: 'Nhân sự', desc: 'Quản lý tài khoản và chức vụ', roles: ['admin'] },
        { id: 'reports', icon: 'fa-chart-pie', title: 'Báo cáo & Thống kê', desc: 'Xem số liệu hoạt động', roles: ['admin', 'head_chef', 'sales_lead'] },
        { id: 'products', icon: 'fa-birthday-cake', title: 'Danh mục Bánh', desc: 'Sản phẩm và công thức', roles: ['admin', 'head_chef'] },
        { id: 'settings', icon: 'fa-cog', title: 'Cấu hình hệ thống', desc: 'Quy định thưởng, mức phạt', roles: ['admin'] },
    ];
    
    menus.filter(m => m.roles.includes(state.user.role)).forEach(m => {
        html += `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover-card flex items-center gap-4 cursor-pointer" onclick="handleMoreMenu('${m.id}')">
                <div class="w-10 h-10 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
                    <i class="fas ${m.icon}"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-gray-900">${m.title}</h3>
                    <p class="text-xs text-gray-500 mt-0.5">${m.desc}</p>
                </div>
                <i class="fas fa-chevron-right text-gray-300"></i>
            </div>
        `;
    });
    
    html += `
        </div>
        
        <div class="mt-8 pt-6 border-t border-gray-200">
            <button onclick="logout()" class="w-full bg-white text-brand-red border border-red-200 py-3 rounded-lg font-medium shadow-sm hover:bg-red-50 transition-colors flex justify-center items-center gap-2">
                <i class="fas fa-sign-out-alt"></i> Đăng xuất
            </button>
            <div class="text-center text-xs text-gray-400 mt-6">
                ZC Operations v1.0.0<br>
                &copy; 2026 Zhuang's Cake
            </div>
        </div>
    `;

    container.innerHTML = html;
}

window.handleMoreMenu = function(menuId) {
    if (menuId === 'profile') {
        showModal('Hồ sơ của bạn', `
            <div class="text-center mb-6">
                <img src="${state.user.avatar || 'https://ui-avatars.com/api/?name=U'}" class="w-20 h-20 rounded-full mx-auto mb-3 shadow-md border-2 border-brand-cream">
                <h3 class="text-lg font-bold text-gray-900">${state.user.name}</h3>
                <p class="text-sm text-gray-500">${ROLE_NAMES[state.user.role]}</p>
            </div>
            <div class="space-y-4">
                <div class="flex justify-between border-b border-gray-100 pb-2">
                    <span class="text-gray-500 text-sm">Tên đăng nhập</span>
                    <span class="font-medium text-sm text-gray-800">${state.user.username}</span>
                </div>
                <div class="flex justify-between border-b border-gray-100 pb-2">
                    <span class="text-gray-500 text-sm">Điểm số hiện tại</span>
                    <span class="font-bold text-brand-red text-sm">${state.user.points} điểm</span>
                </div>
            </div>
        `);
    } else if (['staff', 'reports', 'settings'].includes(menuId)) {
        renderView(menuId);
    } else {
        alert('Tính năng đang được phát triển trong phiên bản tiếp theo.');
    }
};
