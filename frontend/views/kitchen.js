function renderKitchen(container) {
    const tasks = state.data.productionTasks || [];
    let myTasks = tasks;
    
    // Kitchen staff only sees their own tasks
    if (state.user.role === 'kitchen_staff') {
        myTasks = tasks.filter(t => t.assigneeId === state.user.id);
    }
    
    const users = state.data.users || [];
    
    let html = `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-800">Quản lý Bếp</h2>
            ${['head_chef', 'admin'].includes(state.user.role) ? 
                `<button onclick="showCreateTaskModal()" class="bg-brand-red text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                    <i class="fas fa-plus mr-1"></i> Giao việc
                </button>` : ''}
        </div>
        
        <!-- Filters -->
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button class="whitespace-nowrap px-4 py-2 rounded-full bg-brand-red text-white text-sm font-medium">Tất cả</button>
            <button class="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Chưa nhận</button>
            <button class="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Đang làm</button>
            <button class="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Chờ kiểm tra</button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `;
    
    if (myTasks.length === 0) {
        html += `<div class="col-span-full bg-white p-8 rounded-xl text-center text-gray-500 border border-dashed border-gray-300">Không có công việc nào.</div>`;
    } else {
        myTasks.forEach(task => {
            const prod = state.data.products.find(p => p.id === task.productId);
            const assignee = users.find(u => u.id === task.assigneeId);
            
            let statusBadge = '';
            let actionBtn = '';
            
            if (task.status === 'unassigned') {
                statusBadge = '<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">Chưa nhận</span>';
                if (state.user.role === 'kitchen_staff') {
                    actionBtn = `<button onclick="updateTaskStatus('${task.id}', 'assigned')" class="w-full mt-3 bg-brand-red text-white py-2 rounded-lg text-sm font-medium">Nhận việc</button>`;
                }
            } else if (task.status === 'assigned') {
                statusBadge = '<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-md">Đã nhận</span>';
                if (state.user.role === 'kitchen_staff' || task.assigneeId === state.user.id) {
                    actionBtn = `<button onclick="updateTaskStatus('${task.id}', 'in_progress')" class="w-full mt-3 bg-brand-orange text-white py-2 rounded-lg text-sm font-medium">Bắt đầu làm</button>`;
                }
            } else if (task.status === 'in_progress') {
                statusBadge = '<span class="px-2 py-1 bg-brand-orange/20 text-brand-orange text-xs font-semibold rounded-md">Đang làm</span>';
                actionBtn = `<button onclick="showChecklistModal('${task.id}')" class="w-full mt-3 border border-brand-red text-brand-red py-2 rounded-lg text-sm font-medium hover:bg-red-50">Cập nhật Checklist</button>`;
            } else if (task.status === 'waiting_qc') {
                statusBadge = '<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md">Chờ kiểm tra</span>';
                if (['head_chef', 'admin'].includes(state.user.role)) {
                    actionBtn = `<button onclick="updateTaskStatus('${task.id}', 'completed')" class="w-full mt-3 bg-brand-green text-white py-2 rounded-lg text-sm font-medium">Duyệt hoàn thành</button>`;
                }
            } else if (task.status === 'completed') {
                statusBadge = '<span class="px-2 py-1 bg-brand-green/20 text-brand-green text-xs font-semibold rounded-md">Hoàn thành</span>';
            }
            
            html += `
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover-card relative overflow-hidden">
                    ${task.priority === 'high' ? `<div class="absolute top-0 right-0 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">GẤP</div>` : ''}
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="text-xs text-gray-500 mb-1">Mã: ${task.id} | Ca: ${task.shift}</div>
                            <h3 class="font-bold text-gray-900">${prod ? prod.name : task.productId} (x${task.quantity})</h3>
                        </div>
                    </div>
                    
                    <div class="space-y-2 mt-4 text-sm text-gray-600">
                        <div class="flex items-center gap-2">
                            <i class="far fa-user w-4 text-center"></i> 
                            <span>Phụ trách: <strong>${assignee ? assignee.name : 'Chưa giao'}</strong></span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="far fa-clock w-4 text-center"></i> 
                            <span>Hạn: <span class="${new Date(task.deadline) < new Date() && task.status !== 'completed' ? 'text-brand-red font-bold' : ''}">${formatDate(task.deadline, true)}</span></span>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex justify-between items-center border-t border-gray-100 pt-3">
                        ${statusBadge}
                        <button onclick="reportIncident('${task.id}')" class="text-xs text-gray-500 hover:text-brand-red transition-colors">
                            <i class="fas fa-exclamation-triangle"></i> Báo sự cố
                        </button>
                    </div>
                    
                    ${actionBtn}
                </div>
            `;
        });
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

async function updateTaskStatus(taskId, newStatus) {
    const task = state.data.productionTasks.find(t => t.id === taskId);
    if (!task) return;
    
    try {
        const res = await fetchApi(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ ...task, status: newStatus })
        });
        
        if (res && res.success) {
            showToast('Cập nhật trạng thái thành công');
            await fetchInitialData();
            renderView('kitchen');
        }
    } catch (e) {
        showToast('Có lỗi xảy ra', 'error');
    }
}

function showChecklistModal(taskId) {
    const task = state.data.productionTasks.find(t => t.id === taskId);
    const template = state.data.processTemplates.find(tpl => tpl.id === task.processTemplateId);
    
    if (!template) {
        showToast('Không tìm thấy mẫu quy trình', 'error');
        return;
    }
    
    // Simulate checklist state if not exists
    if (!task.checklist) task.checklist = [];
    
    let checklistHtml = `
        <div class="mb-4">
            <h4 class="font-semibold text-gray-800 text-sm mb-1">Mã công việc: ${task.id}</h4>
            <p class="text-xs text-gray-500">Hoàn thành tất cả các bước bắt buộc để chuyển sang chờ kiểm tra.</p>
        </div>
        <div class="space-y-3 max-h-80 overflow-y-auto pr-2">
    `;
    
    template.steps.forEach(step => {
        const isDone = task.checklist.includes(step.id);
        checklistHtml += `
            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <input type="checkbox" id="step_${step.id}" ${isDone ? 'checked' : ''} 
                    onchange="toggleChecklistStep('${taskId}', '${step.id}', this.checked)"
                    class="mt-1 w-5 h-5 text-brand-red border-gray-300 rounded focus:ring-brand-red">
                <div class="flex-1">
                    <label for="step_${step.id}" class="font-medium text-sm text-gray-800 cursor-pointer block">${step.name}</label>
                    <div class="text-xs text-gray-500 mt-1 flex gap-2">
                        ${step.isMandatory ? '<span class="text-brand-red font-semibold">Bắt buộc</span>' : '<span>Tùy chọn</span>'}
                        ${step.requirePhoto ? '<span>• Cần chụp ảnh</span>' : ''}
                    </div>
                </div>
                ${step.requirePhoto ? `
                    <button class="text-gray-400 hover:text-brand-red transition-colors" onclick="alert('Tính năng tải ảnh đang phát triển')">
                        <i class="fas fa-camera text-lg"></i>
                    </button>
                ` : ''}
            </div>
        `;
    });
    
    checklistHtml += `
        </div>
        <button onclick="completeChecklist('${taskId}')" class="w-full mt-4 bg-brand-red text-white py-3 rounded-lg font-medium hover:bg-red-800 transition-colors">
            Gửi kiểm tra (QC)
        </button>
    `;
    
    showModal('Checklist Quy Trình', checklistHtml);
}

window.toggleChecklistStep = function(taskId, stepId, isChecked) {
    const task = state.data.productionTasks.find(t => t.id === taskId);
    if (!task) return;
    if (!task.checklist) task.checklist = [];
    
    if (isChecked && !task.checklist.includes(stepId)) {
        task.checklist.push(stepId);
    } else if (!isChecked) {
        task.checklist = task.checklist.filter(id => id !== stepId);
    }
};

window.completeChecklist = async function(taskId) {
    const task = state.data.productionTasks.find(t => t.id === taskId);
    const template = state.data.processTemplates.find(tpl => tpl.id === task.processTemplateId);
    
    // Check mandatory
    const missing = template.steps.filter(s => s.isMandatory && !task.checklist.includes(s.id));
    if (missing.length > 0) {
        showToast(`Bạn chưa hoàn thành bước bắt buộc: ${missing[0].name}`, 'error');
        return;
    }
    
    try {
        const res = await fetchApi(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ ...task, status: 'waiting_qc' })
        });
        
        if (res && res.success) {
            closeModal();
            showToast('Đã gửi yêu cầu kiểm tra (QC)');
            await fetchInitialData();
            renderView('kitchen');
        }
    } catch (e) {
        showToast('Có lỗi xảy ra', 'error');
    }
};

window.reportIncident = function(taskId) {
    let formHtml = `
        <form onsubmit="submitIncident(event, '${taskId}')" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Loại sự cố</label>
                <select id="incType" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Chọn loại sự cố...</option>
                    <option value="Hỏng nguyên liệu">Hỏng nguyên liệu</option>
                    <option value="Bánh không đạt form/vị">Bánh không đạt form/vị</option>
                    <option value="Khách đổi yêu cầu">Khách đổi yêu cầu</option>
                    <option value="Khác">Khác</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <textarea id="incDesc" required rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Bằng chứng (Ảnh)</label>
                <input type="file" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-brand-red hover:file:bg-red-100">
            </div>
            <button type="submit" class="w-full bg-brand-red text-white py-3 rounded-lg font-medium shadow-sm hover:bg-red-800">
                Gửi báo cáo
            </button>
        </form>
    `;
    showModal('Báo cáo Sự Cố', formHtml);
};

window.submitIncident = function(e, taskId) {
    e.preventDefault();
    closeModal();
    showToast('Đã ghi nhận sự cố. Bếp trưởng sẽ kiểm tra.', 'success');
};
