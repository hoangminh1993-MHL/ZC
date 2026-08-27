function renderStaff(container) {
    if (state.user.role !== 'admin') {
        container.innerHTML = '<div class="p-6 text-center text-red-500">Bạn không có quyền truy cập</div>';
        return;
    }

    const users = state.data.users || [];

    let html = `
        <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <button onclick="renderView('more')" class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm border border-gray-100 hover:text-brand-red transition-colors">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h2 class="text-xl font-bold text-gray-800">Quản lý Nhân sự</h2>
            </div>
            <button onclick="showAddStaffModal()" class="bg-brand-red text-white px-3 py-2 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors text-sm">
                <i class="fas fa-plus mr-1"></i> Thêm
            </button>
        </div>
        
        <div class="space-y-4">
    `;

    users.forEach(u => {
        const isMe = u.id === state.user.id;
        const deactivated = u.status === 'inactive';
        const opacity = deactivated ? 'opacity-50' : '';
        
        html += `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${opacity}">
                <div class="flex items-center gap-3">
                    <img src="${u.avatar || 'https://ui-avatars.com/api/?name=' + u.name[0]}" class="w-12 h-12 rounded-full border border-gray-200">
                    <div>
                        <div class="font-bold text-gray-900">${u.name} ${isMe ? '<span class="text-xs text-brand-red font-medium ml-1">(Bạn)</span>' : ''}</div>
                        <div class="text-xs text-gray-500">${u.username} &bull; ${ROLE_NAMES[u.role] || u.role}</div>
                    </div>
                </div>
                <div class="flex gap-2">
                    ${!isMe ? `
                        <button onclick="showEditStaffModal('${u.id}')" class="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><i class="fas fa-cog"></i> Cài đặt</button>
                        ${deactivated ? 
                            `<button onclick="toggleStaffStatus('${u.id}', 'active')" class="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Mở khóa</button>` : 
                            `<button onclick="toggleStaffStatus('${u.id}', 'inactive')" class="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Khóa</button>`
                        }
                    ` : ''}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

window.showAddStaffModal = function() {
    let options = '';
    Object.keys(ROLE_NAMES).forEach(k => {
        options += `<option value="${k}">${ROLE_NAMES[k]}</option>`;
    });

    let html = `
        <form onsubmit="submitStaff(event, null)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tên nhân viên</label>
                <input type="text" id="sName" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                <input type="text" id="sUser" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input type="password" id="sPass" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                <select id="sRole" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
                    ${options}
                </select>
            </div>
            <button type="submit" class="w-full mt-4 bg-brand-red text-white py-3 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                Tạo tài khoản
            </button>
        </form>
    `;
    showModal('Thêm nhân viên mới', html);
};

window.showEditStaffModal = function(id) {
    const u = state.data.users.find(x => x.id === id);
    if (!u) return;

    let options = '';
    Object.keys(ROLE_NAMES).forEach(k => {
        options += `<option value="${k}" ${u.role === k ? 'selected' : ''}>${ROLE_NAMES[k]}</option>`;
    });

    let html = `
        <form onsubmit="submitStaff(event, '${id}')" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tên nhân viên</label>
                <input type="text" id="sName" value="${u.name}" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập (ID)</label>
                <input type="text" id="sUser" value="${u.username}" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới (Để trống nếu không đổi)</label>
                <input type="password" id="sPass" placeholder="Nhập mật khẩu mới..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                <select id="sRole" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
                    ${options}
                </select>
            </div>
            <button type="submit" class="w-full mt-4 bg-brand-red text-white py-3 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                Lưu cấu hình
            </button>
        </form>
    `;
    showModal('Cài đặt tài khoản', html);
};

window.submitStaff = async function(e, id) {
    e.preventDefault();
    try {
        if (!id) {
            // Add new
            const body = {
                name: document.getElementById('sName').value,
                username: document.getElementById('sUser').value,
                password: document.getElementById('sPass').value,
                role: document.getElementById('sRole').value,
                points: 100,
                status: 'active'
            };
            const res = await fetchApi('/users', { method: 'POST', body: JSON.stringify(body) });
            if (res && res.success) {
                closeModal(); showToast('Tạo thành công');
            }
        } else {
            // Edit role
            const u = { ...state.data.users.find(x => x.id === id) };
            u.name = document.getElementById('sName').value;
            u.username = document.getElementById('sUser').value;
            u.role = document.getElementById('sRole').value;
            
            const newPass = document.getElementById('sPass').value;
            if (newPass.trim() !== '') {
                u.password = newPass;
            }
            
            const res = await fetchApi(`/users/${id}`, { method: 'PUT', body: JSON.stringify(u) });
            if (res && res.success) {
                closeModal(); showToast('Cập nhật thành công');
            }
        }
        await fetchInitialData();
        renderView('staff');
    } catch(err) {
        showToast('Lỗi thao tác', 'error');
    }
};

window.toggleStaffStatus = async function(id, newStatus) {
    if (!confirm(newStatus === 'inactive' ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản này?')) return;
    try {
        const u = { ...state.data.users.find(x => x.id === id) };
        u.status = newStatus;
        const res = await fetchApi(`/users/${id}`, { method: 'PUT', body: JSON.stringify(u) });
        if (res && res.success) {
            showToast('Đã cập nhật trạng thái');
            await fetchInitialData();
            renderView('staff');
        }
    } catch(err) {
        showToast('Lỗi thao tác', 'error');
    }
};
