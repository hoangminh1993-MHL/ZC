function renderScores(container) {
    const users = state.data.users || [];
    const violations = state.data.violationRecords || [];
    const me = state.user;
    
    let html = `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-800">Điểm Chất lượng</h2>
            ${['admin', 'head_chef'].includes(me.role) ? 
                `<button onclick="showCreateViolationModal()" class="bg-brand-red text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                    <i class="fas fa-file-signature mr-1"></i> Lập phiếu
                </button>` : ''}
        </div>
    `;

    // My Score Section (Everyone sees their own score)
    const myPoint = users.find(u => u.id === me.id)?.points || 100;
    const tiers = state.data.appSettings.rewardTiers;
    let myTier = tiers.find(t => myPoint >= t.min && myPoint <= t.max) || tiers[tiers.length-1];
    
    let pointColor = "text-brand-green";
    if (myPoint < 90) pointColor = "text-brand-orange";
    if (myPoint < 80) pointColor = "text-brand-red";

    html += `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-red to-orange-400"></div>
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Điểm hiện tại của bạn</h3>
            <div class="text-6xl font-black ${pointColor} mb-4">${myPoint} <span class="text-2xl text-gray-400 font-medium">/ 100</span></div>
            
            <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div class="text-xs text-gray-500 mb-1">Thưởng Trách nhiệm</div>
                    <div class="font-bold text-gray-900">${myTier.responsibility}%</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div class="text-xs text-gray-500 mb-1">Thưởng KPI</div>
                    <div class="font-bold text-gray-900">${myTier.kpi}%</div>
                </div>
            </div>
        </div>
    `;

    // Admin/Head Chef sees all employees' scores
    if (['admin', 'head_chef'].includes(me.role)) {
        html += `<h3 class="text-lg font-bold text-gray-800 mb-4 mt-8">Bảng điểm nhân viên</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">`;
        
        users.forEach(emp => {
            if (emp.role === 'admin') return; // Skip admin from scoreboard
            
            const empPoint = emp.points || 100;
            let empTier = tiers.find(t => empPoint >= t.min && empPoint <= t.max) || tiers[tiers.length-1];
            
            let pColor = "text-brand-green";
            if (empPoint < 90) pColor = "text-brand-orange";
            if (empPoint < 80) pColor = "text-brand-red";
            
            html += `
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover-card flex justify-between items-center cursor-pointer" onclick="showEmployeeHistory('${emp.id}')">
                    <div class="flex items-center gap-3">
                        <img src="${emp.avatar || 'https://ui-avatars.com/api/?name=' + emp.name[0]}" class="w-10 h-10 rounded-full border border-gray-200">
                        <div>
                            <div class="font-bold text-gray-900">${emp.name}</div>
                            <div class="text-xs text-gray-500">${ROLE_NAMES[emp.role] || emp.role}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-black ${pColor}">${empPoint}</div>
                        <div class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">KPI: ${empTier.kpi}%</div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    // Point Change History
    let viewViolations = violations;
    if (!['admin', 'head_chef'].includes(me.role)) {
        viewViolations = violations.filter(v => v.employeeId === me.id);
    }
    
    const tasks = state.data.productionTasks || [];
    let evalTasks = tasks.filter(t => t.grade);
    if (!['admin', 'head_chef'].includes(me.role)) {
        evalTasks = evalTasks.filter(t => t.assigneeId === me.id);
    }
    
    const mappedViolations = viewViolations.map(v => ({
        id: v.id,
        type: 'violation',
        date: v.datetime,
        employeeId: v.employeeId,
        title: v.description,
        description: `Mức độ: ${v.severity}`,
        points: v.status === 'approved' ? -v.deductedPoints : 0,
        status: v.status,
        raw: v
    }));
    
    const mappedTasks = evalTasks.map(t => {
        let pts = 0;
        let gradeText = '';
        if (t.grade === 'good') { pts = 3; gradeText = 'Hoàn thành xuất sắc'; }
        else if (t.grade === 'done') { pts = 1; gradeText = 'Hoàn thành đúng hạn'; }
        else if (t.grade === 'late') { pts = -1; gradeText = 'Hoàn thành trễ hạn'; }
        
        return {
            id: t.id,
            type: 'task',
            date: t.startTime, // using startTime or deadline as proxy for date
            employeeId: t.assigneeId,
            title: `Nhiệm vụ: ${t.specialInstruction || t.purpose}`,
            description: `Đánh giá: ${gradeText}`,
            points: pts,
            status: 'approved',
            raw: t
        };
    });
    
    const historyList = [...mappedViolations, ...mappedTasks].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    html += `<h3 class="text-lg font-bold text-gray-800 mb-4">Lịch sử thay đổi điểm</h3><div class="space-y-3">`;
    
    html += generateHistoryHTML(historyList, users);
    
    html += `</div>`;
    container.innerHTML = html;
}

function generateHistoryHTML(historyList, users) {
    let html = '';
    if (historyList.length === 0) {
        html += `<div class="bg-white p-6 rounded-xl text-center text-gray-500 border border-dashed border-gray-300">Chưa có lịch sử điểm nào.</div>`;
    } else {
        historyList.forEach(item => {
            const emp = users.find(u => u.id === item.employeeId);
            
            let statusBadge = '';
            if (item.type === 'violation') {
                if (item.status === 'draft') statusBadge = '<span class="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold">NHÁP</span>';
                if (item.status === 'waiting_explanation') statusBadge = '<span class="text-brand-orange bg-orange-100 px-2 py-0.5 rounded text-[10px] font-bold">CHỜ GIẢI TRÌNH</span>';
                if (item.status === 'waiting_approval') statusBadge = '<span class="text-blue-600 bg-blue-100 px-2 py-0.5 rounded text-[10px] font-bold">CHỜ DUYỆT</span>';
                if (item.status === 'approved') statusBadge = '<span class="text-brand-red bg-red-100 px-2 py-0.5 rounded text-[10px] font-bold">ĐÃ DUYỆT LỖI</span>';
                if (item.status === 'rejected') statusBadge = '<span class="text-gray-400 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold">HỦY</span>';
            } else {
                statusBadge = '<span class="text-brand-green bg-green-100 px-2 py-0.5 rounded text-[10px] font-bold">HOÀN THÀNH NV</span>';
            }
            
            let pointDisplay = '<div class="text-sm text-gray-400">Chưa tính điểm</div>';
            if (item.status === 'approved') {
                if (item.points > 0) {
                    pointDisplay = `<div class="text-xl font-black text-brand-green">+ ${item.points} đ</div>`;
                } else if (item.points < 0) {
                    pointDisplay = `<div class="text-xl font-black text-brand-red">${item.points} đ</div>`;
                } else {
                    pointDisplay = `<div class="text-xl font-black text-gray-500">0 đ</div>`;
                }
            }
            
            let onClickAction = item.type === 'violation' ? `onclick="viewViolation('${item.id}')"` : '';
            let cursorClass = item.type === 'violation' ? 'cursor-pointer hover-card' : '';
            let icon = item.type === 'violation' ? '<i class="fas fa-exclamation-triangle text-brand-red/50"></i>' : '<i class="fas fa-check-circle text-brand-green/50"></i>';
            
            html += `
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4 ${cursorClass}" ${onClickAction}>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            ${icon}
                            <span class="text-xs font-semibold text-gray-500">${item.id}</span>
                            ${statusBadge}
                        </div>
                        <h4 class="font-bold text-gray-900">${item.title}</h4>
                        <div class="text-sm text-gray-600 mt-1">Nhân viên: <strong>${emp ? emp.name : 'Unknown'}</strong> | ${item.description}</div>
                        <div class="text-xs text-gray-400 mt-1"><i class="far fa-clock"></i> ${formatDate(item.date, true)}</div>
                    </div>
                    <div class="text-right">
                        ${pointDisplay}
                    </div>
                </div>
            `;
        });
    }
    return html;
}

window.showEmployeeHistory = function(empId) {
    const emp = state.data.users.find(u => u.id === empId);
    if (!emp) return;
    
    const violations = state.data.violationRecords || [];
    const tasks = state.data.productionTasks || [];
    
    let viewViolations = violations.filter(v => v.employeeId === empId);
    let evalTasks = tasks.filter(t => t.grade && t.assigneeId === empId);
    
    const mappedViolations = viewViolations.map(v => ({
        id: v.id,
        type: 'violation',
        date: v.datetime,
        employeeId: v.employeeId,
        title: v.description,
        description: `Mức độ: ${v.severity}`,
        points: v.status === 'approved' ? -v.deductedPoints : 0,
        status: v.status,
        raw: v
    }));
    
    const mappedTasks = evalTasks.map(t => {
        let pts = 0;
        let gradeText = '';
        if (t.grade === 'good') { pts = 3; gradeText = 'Hoàn thành xuất sắc'; }
        else if (t.grade === 'done') { pts = 1; gradeText = 'Hoàn thành đúng hạn'; }
        else if (t.grade === 'late') { pts = -1; gradeText = 'Hoàn thành trễ hạn'; }
        
        return {
            id: t.id,
            type: 'task',
            date: t.startTime,
            employeeId: t.assigneeId,
            title: `Nhiệm vụ: ${t.specialInstruction || t.purpose}`,
            description: `Đánh giá: ${gradeText}`,
            points: pts,
            status: 'approved',
            raw: t
        };
    });
    
    const historyList = [...mappedViolations, ...mappedTasks].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    let html = `<div class="space-y-3 max-h-[60vh] overflow-y-auto pr-2">`;
    html += generateHistoryHTML(historyList, state.data.users);
    html += `</div>`;
    
    showModal(`Lịch sử điểm: ${emp.name}`, html);
};

window.viewViolation = function(vId) {
    const v = state.data.violationRecords.find(r => r.id === vId);
    const emp = state.data.users.find(u => u.id === v.employeeId);
    
    let html = `
        <div class="space-y-4">
            <div class="p-3 bg-red-50 text-brand-red rounded-lg border border-red-100 mb-2">
                <div class="font-bold mb-1">${v.description}</div>
                <div class="text-sm">Hậu quả: ${v.consequence}</div>
            </div>
            
            <div class="grid grid-cols-2 gap-2 text-sm border-b border-gray-100 pb-3">
                <div class="text-gray-500">Mã phiếu</div><div class="font-medium text-right">${v.id}</div>
                <div class="text-gray-500">Người vi phạm</div><div class="font-medium text-right">${emp ? emp.name : ''}</div>
                <div class="text-gray-500">Thời gian</div><div class="font-medium text-right">${formatDate(v.datetime, true)}</div>
                <div class="text-gray-500">Mức độ</div><div class="font-medium text-right">${v.severity}</div>
                <div class="text-gray-500">Điểm đề xuất trừ</div><div class="font-bold text-brand-red text-right">${v.deductedPoints}</div>
            </div>
            
            <div>
                <div class="text-sm font-semibold text-gray-800 mb-2">Giải trình của nhân viên</div>
                <div class="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 italic border border-gray-200">
                    ${v.explanation ? `"${v.explanation}"` : '<span class="text-gray-400">Chưa có giải trình</span>'}
                </div>
            </div>
    `;
    
    if (v.status === 'waiting_explanation' && state.user.id === v.employeeId) {
        html += `
            <div class="mt-4 pt-4 border-t border-gray-100">
                <textarea id="txtExplanation" rows="2" placeholder="Nhập giải trình của bạn..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"></textarea>
                <button onclick="submitExplanation('${v.id}')" class="w-full bg-brand-red text-white py-2 rounded-lg font-medium text-sm">Gửi giải trình</button>
            </div>
        `;
    } else if (v.status === 'waiting_approval' && ['admin', 'head_chef'].includes(state.user.role)) {
        html += `
            <div class="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button onclick="approveViolation('${v.id}', true)" class="flex-1 bg-brand-red text-white py-2 rounded-lg font-medium text-sm">Duyệt (Trừ điểm)</button>
                <button onclick="approveViolation('${v.id}', false)" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm">Hủy phiếu</button>
            </div>
        `;
    }
    
    html += `</div>`;
    showModal(`Chi tiết Vi phạm`, html);
};

window.submitExplanation = async function(vId) {
    const val = document.getElementById('txtExplanation').value;
    if (!val.trim()) {
        showToast('Vui lòng nhập giải trình', 'error'); return;
    }
    const v = state.data.violationRecords.find(r => r.id === vId);
    try {
        const res = await fetchApi(`/violations/${vId}`, {
            method: 'PUT',
            body: JSON.stringify({ ...v, explanation: val, status: 'waiting_approval' })
        });
        if (res && res.success) {
            closeModal();
            showToast('Đã gửi giải trình');
            await fetchInitialData();
            renderView('scores');
        }
    } catch (e) {}
};

window.approveViolation = async function(vId, isApproved) {
    const v = state.data.violationRecords.find(r => r.id === vId);
    try {
        const status = isApproved ? 'approved' : 'rejected';
        const res = await fetchApi(`/violations/${vId}`, {
            method: 'PUT',
            body: JSON.stringify({ ...v, status, reviewerId: state.user.id })
        });
        if (res && res.success) {
            closeModal();
            showToast(isApproved ? 'Đã duyệt phiếu và trừ điểm' : 'Đã hủy phiếu');
            await fetchInitialData();
            renderView('scores');
        }
    } catch (e) {}
};

window.showCreateViolationModal = function(defaultEmpId = '', defaultDesc = '', relatedTaskId = '') {
    let options = '<option value="">Chọn nhân viên...</option>';
    state.data.users.forEach(u => {
        if (u.id !== state.user.id || defaultEmpId === u.id) { // Cannot penalize self unless prefilled
            options += `<option value="${u.id}" ${u.id === defaultEmpId ? 'selected' : ''}>${u.name} (${ROLE_NAMES[u.role] || u.role})</option>`;
        }
    });

    let html = `
        <form onsubmit="submitNewViolation(event, '${relatedTaskId}')" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nhân viên vi phạm</label>
                <select id="vEmp" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
                    ${options}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Lỗi vi phạm</label>
                <input type="text" id="vDesc" value="${defaultDesc}" required placeholder="Ví dụ: Đi trễ, Làm hỏng bánh..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Hậu quả</label>
                <input type="text" id="vCons" placeholder="Ví dụ: Chậm giao hàng 30p" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mức độ</label>
                    <select id="vSev" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
                        <option value="Thấp">Thấp</option>
                        <option value="Trung bình">Trung bình</option>
                        <option value="Cao">Cao</option>
                        <option value="Nghiêm trọng">Nghiêm trọng</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Trừ điểm</label>
                    <input type="number" id="vPoints" required min="1" max="100" value="5" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-red focus:border-brand-red outline-none">
                </div>
            </div>
            <button type="submit" class="w-full mt-4 bg-brand-red text-white py-3 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                Tạo phiếu & Yêu cầu giải trình
            </button>
        </form>
    `;
    showModal('Lập phiếu ghi nhận lỗi', html);
};

window.submitNewViolation = async function(e, relatedTaskId = '') {
    e.preventDefault();
    const empId = document.getElementById('vEmp').value;
    const desc = document.getElementById('vDesc').value;
    const cons = document.getElementById('vCons').value;
    const sev = document.getElementById('vSev').value;
    const pts = parseInt(document.getElementById('vPoints').value);
    
    // Auto-generate ID: viol-timestamp
    const newId = 'viol-' + Date.now().toString().slice(-6);
    
    const newViol = {
        id: newId,
        employeeId: empId,
        datetime: new Date().toISOString(),
        description: desc,
        consequence: cons,
        severity: sev,
        deductedPoints: pts,
        status: 'waiting_explanation',
        reporterId: state.user.id,
        relatedTask: relatedTaskId || null
    };
    
    try {
        const res = await fetchApi('/violations', {
            method: 'POST',
            body: JSON.stringify(newViol)
        });
        
        // Cập nhật trạng thái task nếu có relatedTaskId
        if (relatedTaskId) {
            const task = state.data.productionTasks.find(t => t.id === relatedTaskId);
            if (task) {
                task.status = 'failed';
                task.grade = 'ruined';
                await fetchApi(`/tasks/${relatedTaskId}`, { method: 'PUT', body: JSON.stringify(task) });
            }
        }
        
        if (res && res.success) {
            closeModal();
            showToast('Đã tạo phiếu và gửi yêu cầu giải trình thành công');
            await fetchInitialData();
            if (relatedTaskId) {
                if (state.currentView === 'tasks') renderView('tasks');
            } else {
                renderView('scores');
            }
        }
    } catch (err) {
        showToast('Có lỗi xảy ra', 'error');
    }
};
