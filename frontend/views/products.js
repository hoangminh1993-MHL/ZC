function renderProducts(container) {
    const isManager = ['admin', 'head_chef'].includes(state.user.role);
    if (!isManager) {
        container.innerHTML = '<div class="p-6 text-center text-red-500">Bạn không có quyền truy cập</div>';
        return;
    }

    const products = state.data.products || [];

    let html = `
        <div class="mb-6 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <button onclick="renderView('more')" class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm border border-gray-100 hover:text-brand-red transition-colors">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h2 class="text-xl font-bold text-gray-800">Danh mục Bánh</h2>
            </div>
            <button onclick="showEditProductModal()" class="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-red-800 transition-colors flex items-center gap-2">
                <i class="fas fa-plus"></i><span class="hidden md:inline">Thêm Bánh</span>
            </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
    `;

    if (products.length === 0) {
        html += `<div class="col-span-2 md:col-span-3 bg-white p-8 rounded-xl text-center text-gray-500 border border-dashed border-gray-300">Chưa có sản phẩm nào.</div>`;
    } else {
        products.forEach(p => {
            html += `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover-card cursor-pointer" onclick="showEditProductModal('${p.id}')">
                    <div class="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden border-b border-gray-100">
                        ${p.photoUrl ? `<img src="${p.photoUrl}" class="w-full h-full object-cover">` : `<i class="fas fa-birthday-cake text-4xl text-gray-300"></i>`}
                    </div>
                    <div class="p-3">
                        <div class="text-[10px] font-bold text-brand-red mb-1 uppercase">${p.category || 'Khác'}</div>
                        <h3 class="font-bold text-gray-900 text-sm mb-1 truncate">${p.name}</h3>
                        <div class="font-bold text-gray-700 text-sm">${formatCurrency(p.price)}</div>
                    </div>
                </div>
            `;
        });
    }

    html += `
        </div>
        <input type="file" id="productPhotoInput" accept="image/*" class="hidden" onchange="handleProductPhotoUpload(event)">
    `;
    
    container.innerHTML = html;
}

window.currentEditingProductId = null;

window.showEditProductModal = function(productId = null) {
    const products = state.data.products || [];
    const p = productId ? products.find(x => x.id === productId) : null;
    window.currentEditingProductId = productId;
    
    const photoUrl = p?.photoUrl || '';
    
    let html = `
        <form onsubmit="submitProductForm(event)" class="space-y-4">
            <div class="text-center mb-4 relative">
                <div class="w-24 h-24 mx-auto bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors" onclick="document.getElementById('productPhotoInput').click()">
                    ${photoUrl ? `<img src="${photoUrl}" id="previewProductPhoto" class="w-full h-full object-cover">` : `<i class="fas fa-camera text-2xl text-gray-400" id="previewProductIcon"></i><img src="" id="previewProductPhoto" class="hidden w-full h-full object-cover">`}
                </div>
                <div class="text-xs text-gray-500 mt-2">Bấm để tải ảnh lên</div>
                <input type="hidden" id="prodPhotoUrl" value="${photoUrl}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tên bánh</label>
                <input type="text" id="prodName" value="${p ? p.name : ''}" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">
            </div>
            
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phân loại</label>
                    <select id="prodCategory" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">
                        <option value="Bánh kem" ${p?.category === 'Bánh kem' ? 'selected' : ''}>Bánh kem</option>
                        <option value="Bánh lạnh" ${p?.category === 'Bánh lạnh' ? 'selected' : ''}>Bánh lạnh</option>
                        <option value="Khác" ${p?.category === 'Khác' ? 'selected' : ''}>Khác</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Giá (đ)</label>
                    <input type="number" id="prodPrice" value="${p ? p.price : 0}" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red">
                </div>
            </div>
            
            <div class="pt-4 flex gap-2">
                <button type="submit" class="flex-1 bg-brand-red text-white py-2.5 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                    ${p ? 'Cập nhật' : 'Thêm mới'}
                </button>
                ${p ? `
                <button type="button" onclick="deleteProduct('${p.id}')" class="bg-gray-100 text-red-600 px-4 py-2.5 rounded-lg font-medium hover:bg-red-50 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </div>
        </form>
    `;
    
    showModal(p ? 'Chỉnh sửa Bánh' : 'Thêm Bánh Mới', html);
};

window.handleProductPhotoUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Data = e.target.result;
        
        // Update preview immediately
        const icon = document.getElementById('previewProductIcon');
        if (icon) icon.classList.add('hidden');
        
        const preview = document.getElementById('previewProductPhoto');
        preview.src = base64Data;
        preview.classList.remove('hidden');
        
        showToast('Đang tải ảnh lên...', 'info');
        
        try {
            const res = await fetchApi('/upload-base64', {
                method: 'POST',
                body: JSON.stringify({ imageBase64: base64Data })
            });
            
            if (res && res.success) {
                document.getElementById('prodPhotoUrl').value = res.url;
                showToast('Tải ảnh xong');
            } else {
                showToast('Lỗi khi tải ảnh', 'error');
            }
        } catch (err) {
            showToast('Lỗi khi tải ảnh', 'error');
        }
    };
    reader.readAsDataURL(file);
};

window.submitProductForm = async function(e) {
    e.preventDefault();
    
    const product = {
        id: window.currentEditingProductId || '',
        name: document.getElementById('prodName').value,
        category: document.getElementById('prodCategory').value,
        price: parseInt(document.getElementById('prodPrice').value) || 0,
        photoUrl: document.getElementById('prodPhotoUrl').value
    };
    
    const method = window.currentEditingProductId ? 'PUT' : 'POST';
    const url = window.currentEditingProductId ? `/products/${window.currentEditingProductId}` : `/products`;
    
    const res = await fetchApi(url, { method, body: JSON.stringify(product) });
    if (res && res.success) {
        showToast('Đã lưu sản phẩm');
        closeModal();
        await fetchInitialData();
        if (state.currentView === 'products') renderView('products');
    }
};

window.deleteProduct = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) return;
    
    const res = await fetchApi(`/products/${id}`, { method: 'DELETE' });
    if (res && res.success) {
        showToast('Đã xóa sản phẩm');
        closeModal();
        await fetchInitialData();
        if (state.currentView === 'products') renderView('products');
    }
};
