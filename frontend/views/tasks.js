window.currentTaskDeptFilter = 'all';

function renderTasks(container) {
    var isManager = ['admin', 'head_chef', 'sales_lead'].includes(state.user.role);
    
    // Filter tasks
    var displayTasks = state.data.productionTasks || [];
    
    // For non-managers, only show their own tasks
    if (!isManager) {
        displayTasks = displayTasks.filter(function(t) { return t.assigneeId === state.user.id; });
    }
    
    // Apply department filter
    if (window.currentTaskDeptFilter !== 'all') {
        displayTasks = displayTasks.filter(function(t) {
            return (t.department || '') === window.currentTaskDeptFilter;
        });
    }
    
    // Sort: newest first
    displayTasks = displayTasks.slice().reverse();
    
    // Department tabs
    var departments = [
        { key: 'all', label: 'Tất cả', icon: 'fa-list' },
        { key: 'bep_lanh', label: 'Bếp lạnh', icon: 'fa-snowflake' },
        { key: 'bep_nong', label: 'Bếp nóng', icon: 'fa-fire' },
        { key: 'tap_vu', label: 'Tạp vụ', icon: 'fa-broom' },
        { key: 'ban_hang', label: 'Bán hàng', icon: 'fa-store' }
    ];
    
    var deptLabels = { 'bep_lanh': 'Bếp lạnh', 'bep_nong': 'Bếp nóng', 'tap_vu': 'Tạp vụ', 'ban_hang': 'Bán hàng' };
    var deptColors = { 'bep_lanh': 'bg-blue-100 text-blue-700', 'bep_nong': 'bg-orange-100 text-orange-700', 'tap_vu': 'bg-gray-200 text-gray-700', 'ban_hang': 'bg-green-100 text-green-700' };
    
    var html = '<div class="mb-6 flex justify-between items-center">';
    html += '<h2 class="text-xl font-bold text-gray-800">Nhiệm vụ</h2>';
    if (isManager) {
        html += '<button onclick="showAssignTaskModal()" class="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-800 shadow-sm transition-colors">';
        html += '<i class="fas fa-plus mr-1"></i> Giao việc</button>';
    }
    html += '</div>';
    
    // Department filter tabs
    html += '<div class="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">';
    departments.forEach(function(dept) {
        var isActive = window.currentTaskDeptFilter === dept.key;
        var cls = isActive ? 'bg-brand-red text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50';
        html += '<button onclick="window.currentTaskDeptFilter=\'' + dept.key + '\'; renderView(\'tasks\')" class="whitespace-nowrap px-4 py-2 rounded-full ' + cls + ' text-sm font-medium flex items-center gap-1.5">';
        html += '<i class="fas ' + dept.icon + ' text-xs"></i> ' + dept.label + '</button>';
    });
    html += '</div>';
    
    // Task list
    html += '<div class="space-y-4" id="tasks-list">';
    
    if (displayTasks.length === 0) {
        html += '<div class="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">Không có nhiệm vụ nào.</div>';
    } else {
        displayTasks.forEach(function(t) {
            var assignee = (state.data.users || []).find(function(u) { return u.id === t.assigneeId; }) || { name: 'N/A' };
            var statusMap = {
                'pending': { label: 'Chưa đánh giá', color: 'bg-yellow-100 text-yellow-800' },
                'waiting_qc': { label: 'Chờ duyệt', color: 'bg-blue-100 text-blue-800' },
                'evaluated': { label: 'Đã đánh giá', color: 'bg-green-100 text-green-800' },
                'failed': { label: 'Thất bại', color: 'bg-red-100 text-red-800' }
            };
            
            var statusKey = t.status;
            if (!statusMap[statusKey]) {
                if (['unassigned', 'assigned', 'in_progress'].indexOf(statusKey) !== -1) statusKey = 'pending';
                else if (statusKey === 'completed') statusKey = 'evaluated';
                else statusKey = 'pending';
            }
            
            var badge = statusMap[statusKey] || statusMap['pending'];
            
            // Department badge
            var deptBadge = '';
            if (t.department && deptLabels[t.department]) {
                var deptCls = deptColors[t.department] || 'bg-gray-100 text-gray-600';
                deptBadge = '<span class="px-2 py-0.5 rounded-full text-xs font-medium ' + deptCls + '">' + deptLabels[t.department] + '</span>';
            }
            
            html += '<div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">';
            html += '<div class="flex justify-between items-start">';
            html += '<div>';
            html += '<div class="flex items-center gap-2 mb-1">';
            html += '<h3 class="font-bold text-gray-900">' + (t.specialInstruction || t.purpose || 'Nhiệm vụ') + '</h3>';
            html += deptBadge;
            html += '</div>';
            html += '<p class="text-sm text-gray-500 mt-1"><i class="far fa-user mr-1"></i> ' + assignee.name + '</p>';
            html += '</div>';
            html += '<span class="px-2.5 py-1 rounded-full text-xs font-medium ' + badge.color + '">' + badge.label + '</span>';
            html += '</div>';
            
            html += '<div class="flex justify-between items-center pt-2 border-t border-gray-50">';
            html += '<div class="text-xs text-gray-500"><i class="far fa-clock mr-1"></i> Hạn: ' + formatDate(t.deadline, true) + '</div>';
            html += '<div class="flex gap-3">';
            
            if (t.photoUrl) {
                html += '<a href="' + t.photoUrl + '" target="_blank" class="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"><i class="fas fa-image"></i> Xem ảnh</a>';
            }
            
            if (statusKey === 'pending' && t.assigneeId === state.user.id) {
                html += '<button onclick="triggerTaskPhotoUpload(\'' + t.id + '\')" class="text-brand-red text-sm font-medium hover:underline flex items-center gap-1"><i class="fas fa-camera"></i> Nộp việc</button>';
            }
            
            if (isManager && ['pending', 'waiting_qc'].indexOf(statusKey) !== -1) {
                html += '<button onclick="showEvaluateTaskModal(\'' + t.id + '\')" class="text-brand-red text-sm font-medium hover:underline">Đánh giá</button>';
            }
            
            html += '</div></div></div>';
        });
    }
    
    html += '</div>';
    html += '<input type="file" id="hiddenTaskPhotoInput" accept="image/*" capture="environment" class="hidden" onchange="handleTaskPhotoUpload(event)">';
    container.innerHTML = html;
}

window.currentUploadTaskId = null;
window.triggerTaskPhotoUpload = function(taskId) {
    window.currentUploadTaskId = taskId;
    document.getElementById('hiddenTaskPhotoInput').click();
};

window.handleTaskPhotoUpload = function(event) {
    var file = event.target.files[0];
    if (!file) return;
    
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var MAX_WIDTH = 800;
            var MAX_HEIGHT = 800;
            var width = img.width;
            var height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            var dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            showToast('Đang tải ảnh lên...', 'info');
            fetchApi('/upload-base64', {
                method: 'POST',
                body: JSON.stringify({ image: dataUrl })
            }).then(function(res) {
                if (res && res.success) {
                    var task = state.data.productionTasks.find(function(t) { return t.id === window.currentUploadTaskId; });
                    if (task) {
                        task.photoUrl = res.url;
                        task.status = 'waiting_qc';
                        fetchApi('/tasks/' + task.id, { method: 'PUT', body: JSON.stringify(task) }).then(function() {
                            showToast('Đã nộp ảnh thành công!');
                            fetchInitialData().then(function() { renderView('tasks'); });
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
    event.target.value = '';
};

window.showAssignTaskModal = function() {
    var users = state.data.users || [];
    var options = '<option value="">Chọn nhân viên...</option>';
    users.forEach(function(u) {
        if (u.id !== state.user.id) {
            options += '<option value="' + u.id + '">' + u.name + ' (' + (ROLE_NAMES[u.role] || u.role) + ')</option>';
        }
    });
    options += '<option value="' + state.user.id + '">' + state.user.name + ' (Tôi)</option>';

    var html = '<form onsubmit="submitAssignTask(event)" class="space-y-4">';
    
    // Department select
    html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Khu vực phân công</label>';
    html += '<select id="taskDepartment" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">';
    html += '<option value="">Chọn khu vực...</option>';
    html += '<option value="bep_lanh">❄️ Bếp lạnh</option>';
    html += '<option value="bep_nong">🔥 Bếp nóng</option>';
    html += '<option value="tap_vu">🧹 Tạp vụ</option>';
    html += '<option value="ban_hang">🏪 Bán hàng</option>';
    html += '</select></div>';
    
    // Assignee select
    html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Người thực hiện</label>';
    html += '<select id="taskAssignee" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">';
    html += options;
    html += '</select></div>';
    
    // Task description
    html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Nội dung công việc</label>';
    html += '<input type="text" id="taskDesc" required placeholder="Ví dụ: Nướng 10 bánh mì..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none"></div>';
    
    // Deadline
    html += '<div><label class="block text-sm font-medium text-gray-700 mb-1">Deadline (Hạn chót)</label>';
    html += '<input type="datetime-local" id="taskDeadline" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none"></div>';
    
    html += '<button type="submit" class="w-full mt-4 bg-brand-red text-white py-3 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">Giao nhiệm vụ</button>';
    html += '</form>';
    
    showModal('Giao việc mới', html);
};

window.submitAssignTask = async function(e) {
    e.preventDefault();
    
    var task = {
        id: '',
        assigneeId: document.getElementById('taskAssignee').value,
        specialInstruction: document.getElementById('taskDesc').value,
        deadline: document.getElementById('taskDeadline').value,
        department: document.getElementById('taskDepartment').value,
        status: 'pending',
        startTime: new Date().toISOString(),
        purpose: 'general',
        productId: null,
        priority: 'normal',
        quantity: 1
    };
    
    var res = await fetchApi('/tasks', { method: 'POST', body: JSON.stringify(task) });
    if (res && res.success) {
        showToast('Đã giao nhiệm vụ');
        closeModal();
        await fetchInitialData();
        if (state.currentView === 'tasks') renderView('tasks');
    }
};

window.showEvaluateTaskModal = function(taskId) {
    var task = state.data.productionTasks.find(function(t) { return t.id === taskId; });
    if (!task) return;
    
    var assignee = (state.data.users || []).find(function(u) { return u.id === task.assigneeId; }) || { name: 'N/A' };
    
    var deptLabels = { 'bep_lanh': 'Bếp lạnh', 'bep_nong': 'Bếp nóng', 'tap_vu': 'Tạp vụ', 'ban_hang': 'Bán hàng' };
    var deptName = task.department ? (deptLabels[task.department] || task.department) : '';
    
    var html = '<form onsubmit="submitTaskEvaluation(event, \'' + taskId + '\')" class="space-y-4">';
    html += '<div class="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-700">';
    html += '<p><strong>Nhiệm vụ:</strong> ' + (task.specialInstruction || task.purpose) + '</p>';
    html += '<p class="mt-1"><strong>Người làm:</strong> ' + assignee.name + '</p>';
    if (deptName) {
        html += '<p class="mt-1"><strong>Khu vực:</strong> ' + deptName + '</p>';
    }
    
    if (task.photoUrl) {
        html += '<div class="mt-2"><p class="font-medium text-gray-900 mb-1">Ảnh hoàn thành:</p>';
        html += '<img src="' + task.photoUrl + '" alt="Task photo" class="w-full max-h-48 object-cover rounded border border-gray-200"></div>';
    } else {
        html += '<p class="mt-2 text-yellow-600 italic"><i class="fas fa-exclamation-triangle"></i> Chưa có ảnh chụp thực tế.</p>';
    }
    html += '</div>';
    
    html += '<label class="block text-sm font-medium text-gray-700 mb-2">Đánh giá kết quả:</label>';
    html += '<div class="space-y-2">';
    
    html += '<label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">';
    html += '<input type="radio" name="evalResult" value="good" required class="text-brand-red focus:ring-brand-red w-4 h-4">';
    html += '<div><div class="font-medium text-gray-900">Hoàn thành tốt</div><div class="text-xs text-green-600">+3 điểm năng suất</div></div></label>';
    
    html += '<label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">';
    html += '<input type="radio" name="evalResult" value="done" required class="text-brand-red focus:ring-brand-red w-4 h-4">';
    html += '<div><div class="font-medium text-gray-900">Hoàn thành</div><div class="text-xs text-green-600">+1 điểm năng suất</div></div></label>';
    
    html += '<label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">';
    html += '<input type="radio" name="evalResult" value="late" required class="text-brand-red focus:ring-brand-red w-4 h-4">';
    html += '<div><div class="font-medium text-gray-900">Trễ deadline</div><div class="text-xs text-red-600">-1 điểm năng suất</div></div></label>';
    
    html += '<label class="flex items-center gap-3 p-3 border border-red-100 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">';
    html += '<input type="radio" name="evalResult" value="ruined" required class="text-brand-red focus:ring-brand-red w-4 h-4">';
    html += '<div><div class="font-medium text-brand-red">Làm hỏng bánh (Lỗi)</div><div class="text-xs text-brand-red opacity-80">Chuyển sang lập phiếu ghi nhận lỗi</div></div></label>';
    
    html += '</div>';
    html += '<button type="submit" class="w-full mt-4 bg-brand-red text-white py-3 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">Lưu đánh giá</button>';
    html += '</form>';
    
    showModal('Đánh giá nhiệm vụ', html);
};

window.submitTaskEvaluation = async function(e, taskId) {
    e.preventDefault();
    var result = document.querySelector('input[name="evalResult"]:checked').value;
    
    var task = state.data.productionTasks.find(function(t) { return t.id === taskId; });
    var u = (state.data.users || []).find(function(x) { return x.id === task.assigneeId; });
    
    if (result === 'ruined') {
        if (typeof showCreateViolationModal === 'function') {
            showCreateViolationModal(task.assigneeId, task.specialInstruction || task.purpose, taskId);
        }
        return;
    }
    
    var pointsChange = 0;
    var newStatus = 'evaluated';
    
    if (result === 'good') pointsChange = 3;
    else if (result === 'done') pointsChange = 1;
    else if (result === 'late') pointsChange = -1;
    
    task.status = newStatus;
    task.grade = result;
    
    if (u) {
        u.points += pointsChange;
        await fetchApi('/users/' + u.id, { method: 'PUT', body: JSON.stringify(u) });
    }
    
    var res = await fetchApi('/tasks/' + taskId, { method: 'PUT', body: JSON.stringify(task) });
    
    if (res && res.success) {
        showToast('Đã lưu đánh giá và cập nhật điểm');
        closeModal();
        await fetchInitialData();
        if (state.currentView === 'tasks') renderView('tasks');
    }
};
