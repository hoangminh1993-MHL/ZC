function renderTasks(container) {
    const isManager = ['admin', 'head_chef', 'sales_lead'].includes(state.user.role);
    
    let html = `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-800">Nhiệm vụ</h2>
            ${isManager ? `
            <button onclick="showAssignTaskModal()" class="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-800 shadow-sm transition-colors">
                <i class="fas fa-plus mr-1"></i> Giao việc
            </button>
            ` : ''}
        </div>
        
        <!-- Task List -->
        <div class="space-y-4" id="tasks-list">
    `;

    // Filter tasks
    let displayTasks = state.data.productionTasks || [];
    
    // For non-managers, only show their own tasks
    if (!isManager) {
        displayTasks = displayTasks.filter(t => t.assigneeId === state.user.id);
    }
    
    // Sort: newest created (reverse array).
    displayTasks = [...displayTasks].reverse();

    if (displayTasks.length === 0) {
        html += `<div class="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">Không có nhiệm vụ nào.</div>`;
    } else {
        displayTasks.forEach(t => {
            const assignee = state.data.users.find(u => u.id === t.assigneeId) || { name: 'N/A' };
            const statusMap = {
                'pending': { label: 'Chưa đánh giá', color: 'bg-yellow-100 text-yellow-800' },
                'waiting_qc': { label: 'Chờ duyệt', color: 'bg-blue-100 text-blue-800' },
                'evaluated': { label: 'Đã đánh giá', color: 'bg-green-100 text-green-800' },
                'failed': { label: 'Thất bại', color: 'bg-red-100 text-red-800' }
            };
            
            // Map old task statuses for backwards compatibility
            let statusKey = t.status;
            if (!statusMap[statusKey]) {
                if (['unassigned', 'assigned', 'in_progress'].includes(statusKey)) statusKey = 'pending';
                else if (statusKey === 'completed') statusKey = 'evaluated';
                else statusKey = 'pending';
            }
            
            const badge = statusMap[statusKey] || statusMap['pending'];
            
            html += `
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-bold text-gray-900">${t.specialInstruction || t.purpose || 'Nhiệm vụ'}</h3>
                            <p class="text-sm text-gray-500 mt-1">
                                <i class="far fa-user mr-1"></i> ${assignee.name}
                            </p>
                        </div>
                        <span class="px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}">${badge.label}</span>
                    </div>
                    
                    <div class="flex justify-between items-center pt-2 border-t border-gray-50">
                        <div class="text-xs text-gray-500">
                            <i class="far fa-clock mr-1"></i> Hạn: ${formatDate(t.deadline, true)}
                        </div>
                        <div class="flex gap-3">
                            ${t.photoUrl ? `
                            <a href="${t.photoUrl}" target="_blank" class="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                                <i class="fas fa-image"></i> Xem ảnh
                            </a>
                            ` : ''}
                            
                            ${statusKey === 'pending' && t.assigneeId === state.user.id ? `
                            <button onclick="triggerTaskPhotoUpload('${t.id}')" class="text-brand-red text-sm font-medium hover:underline flex items-center gap-1">
                                <i class="fas fa-camera"></i> Nộp việc
                            </button>
                            ` : ''}
                            
                            ${isManager && ['pending', 'waiting_qc'].includes(statusKey) ? `
                                <button onclick="showEvaluateTaskModal('${t.id}')" class="text-brand-red text-sm font-medium hover:underline">
                                    Đánh giá
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>
    
        <input type="file" id="hiddenTaskPhotoInput" accept="image/*" capture="environment" class="hidden" onchange="handleTaskPhotoUpload(event)">
    `;
    container.innerHTML = html;
}

window.currentUploadTaskId = null;
window.triggerTaskPhotoUpload = function(taskId) {
    window.currentUploadTaskId = taskId;
    document.getElementById('hiddenTaskPhotoInput').click();
};

window.handleTaskPhotoUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Compress image
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // Upload to server
            showToast('Đang tải ảnh lên...', 'info');
            fetchApi('/upload-base64', {
                method: 'POST',
                body: JSON.stringify({ image: dataUrl })
            }).then(res => {
                if (res && res.success) {
                    // Update task
                    const task = state.data.productionTasks.find(t => t.id === window.currentUploadTaskId);
                    if (task) {
                        task.photoUrl = res.url;
                        task.status = 'waiting_qc';
                        fetchApi(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(task) }).then(() => {
                            showToast('Đã nộp ảnh thành công!');
                            fetchInitialData().then(() => renderView('tasks'));
                        });
                    }
                } else {
                    showToast('Tải ảnh thất bại', 'error');
                }
            });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
};

window.showAssignTaskModal = function() {
    let options = '<option value="">Chọn nhân viên...</option>';
    state.data.users.forEach(u => {
        if (u.id !== state.user.id) {
            options += `<option value="${u.id}">${u.name} (${ROLE_NAMES[u.role] || u.role})</option>`;
        }
    });

    options += `<option value="${state.user.id}">${state.user.name} (Tôi)</option>`;

    let html = `
        <form onsubmit="submitAssignTask(event)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Người thực hiện</label>
                <select id="taskAssignee" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
                    ${options}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nội dung công việc</label>
                <input type="text" id="taskDesc" required placeholder="Ví dụ: Nướng 10 bánh mì..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Deadline (Hạn chót)</label>
                <input type="datetime-local" id="taskDeadline" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
            </div>
            <button type="submit" class="w-full mt-4 bg-brand-red text-white py-3 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                Giao nhiệm vụ
            </button>
        </form>
    `;
    showModal('Giao việc mới', html);
};

window.submitAssignTask = async function(e) {
    e.preventDefault();
    
    const task = {
        id: '', // Empty id required for PowerShell backend to set it without throwing error
        assigneeId: document.getElementById('taskAssignee').value,
        specialInstruction: document.getElementById('taskDesc').value,
        deadline: document.getElementById('taskDeadline').value,
        status: 'pending',
        startTime: new Date().toISOString(),
        purpose: 'general',
        productId: null,
        priority: 'normal',
        quantity: 1
    };
    
    const res = await fetchApi('/tasks', { method: 'POST', body: JSON.stringify(task) });
    if (res && res.success) {
        showToast('Đã giao nhiệm vụ');
        closeModal();
        await fetchInitialData();
        if (state.currentView === 'tasks') renderView('tasks');
    }
};

window.showEvaluateTaskModal = function(taskId) {
    const task = state.data.productionTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const assignee = state.data.users.find(u => u.id === task.assigneeId) || { name: 'N/A' };

    let html = `
        <form onsubmit="submitTaskEvaluation(event, '${taskId}')" class="space-y-4">
            <div class="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-700">
                <p><strong>Nhiệm vụ:</strong> ${task.specialInstruction || task.purpose}</p>
                <p class="mt-1"><strong>Người làm:</strong> ${assignee.name}</p>
                ${task.photoUrl ? `
                <div class="mt-2">
                    <p class="font-medium text-gray-900 mb-1">Ảnh hoàn thành:</p>
                    <img src="${task.photoUrl}" alt="Task photo" class="w-full max-h-48 object-cover rounded border border-gray-200">
                </div>
                ` : '<p class="mt-2 text-yellow-600 italic"><i class="fas fa-exclamation-triangle"></i> Chưa có ảnh chụp thực tế.</p>'}
            </div>
            
            <label class="block text-sm font-medium text-gray-700 mb-2">Đánh giá kết quả:</label>
            
            <div class="space-y-2">
                <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="evalResult" value="good" required class="text-brand-red focus:ring-brand-red w-4 h-4">
                    <div>
                        <div class="font-medium text-gray-900">Hoàn thành tốt</div>
                        <div class="text-xs text-green-600">+3 điểm năng suất</div>
                    </div>
                </label>
                
                <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="evalResult" value="done" required class="text-brand-red focus:ring-brand-red w-4 h-4">
                    <div>
                        <div class="font-medium text-gray-900">Hoàn thành</div>
                        <div class="text-xs text-green-600">+1 điểm năng suất</div>
                    </div>
                </label>
                
                <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="evalResult" value="late" required class="text-brand-red focus:ring-brand-red w-4 h-4">
                    <div>
                        <div class="font-medium text-gray-900">Trễ deadline</div>
                        <div class="text-xs text-red-600">-1 điểm năng suất</div>
                    </div>
                </label>
                
                <label class="flex items-center gap-3 p-3 border border-red-100 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                    <input type="radio" name="evalResult" value="ruined" required class="text-brand-red focus:ring-brand-red w-4 h-4">
                    <div>
                        <div class="font-medium text-brand-red">Làm hỏng bánh (Lỗi)</div>
                        <div class="text-xs text-brand-red opacity-80">Chuyển sang lập phiếu ghi nhận lỗi</div>
                    </div>
                </label>
            </div>
            
            <button type="submit" class="w-full mt-4 bg-brand-red text-white py-3 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                Lưu đánh giá
            </button>
        </form>
    `;
    showModal('Đánh giá nhiệm vụ', html);
};

window.submitTaskEvaluation = async function(e, taskId) {
    e.preventDefault();
    const result = document.querySelector('input[name="evalResult"]:checked').value;
    
    const task = state.data.productionTasks.find(t => t.id === taskId);
    let u = state.data.users.find(x => x.id === task.assigneeId);
    
    if (result === 'ruined') {
        // Cần truyền default employee và tên lỗi vào form Lập phiếu lỗi
        if (typeof showCreateViolationModal === 'function') {
            showCreateViolationModal(task.assigneeId, task.specialInstruction || task.purpose, taskId);
        }
        return;
    }
    
    let pointsChange = 0;
    let newStatus = 'evaluated';
    
    if (result === 'good') pointsChange = 3;
    else if (result === 'done') pointsChange = 1;
    else if (result === 'late') pointsChange = -1;
    
    // Update task
    task.status = newStatus;
    task.grade = result;
    
    // Update user points
    if (u) {
        u.points += pointsChange;
        await fetchApi(`/users/${u.id}`, { method: 'PUT', body: JSON.stringify(u) });
    }
    
    // Save task
    const res = await fetchApi(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(task) });
    
    if (res && res.success) {
        showToast('Đã lưu đánh giá và cập nhật điểm');
        closeModal();
        await fetchInitialData();
        if (state.currentView === 'tasks') renderView('tasks');
    }
};
