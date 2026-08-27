function renderSettings(container) {
    if (state.user.role !== 'admin') {
        container.innerHTML = '<div class="p-6 text-center text-red-500">Bạn không có quyền truy cập</div>';
        return;
    }

    const settings = state.data.appSettings || { rewardTiers: [] };
    const defaultPenalties = settings.penaltyConfig || { "Thấp": 5, "Trung bình": 10, "Cao": 20, "Nghiêm trọng": 50 };

    let html = `
        <div class="mb-6 flex items-center gap-3">
            <button onclick="renderView('more')" class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm border border-gray-100 hover:text-brand-red transition-colors">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h2 class="text-xl font-bold text-gray-800">Cấu hình hệ thống</h2>
        </div>
        
        <div class="space-y-6">
            <!-- Penalty Config -->
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 class="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2"><i class="fas fa-exclamation-triangle text-brand-red mr-2"></i> Mức trừ điểm vi phạm</h3>
                <form id="penaltyForm" class="space-y-4">
    `;

    Object.keys(defaultPenalties).forEach(level => {
        html += `
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-700 w-32">${level}</span>
                        <div class="flex items-center gap-2">
                            <input type="number" name="pen_${level}" value="${defaultPenalties[level]}" class="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:ring-brand-red focus:border-brand-red outline-none">
                            <span class="text-xs text-gray-500">điểm</span>
                        </div>
                    </div>
        `;
    });

    html += `
                    <div class="pt-3">
                        <button type="button" onclick="savePenalties()" class="w-full bg-brand-red text-white py-2.5 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                            Lưu cấu hình điểm phạt
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Reward Tiers Config -->
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 class="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2"><i class="fas fa-gift text-brand-red mr-2"></i> Thang điểm thưởng</h3>
                <form id="rewardForm" class="space-y-3">
    `;

    settings.rewardTiers.forEach((t, i) => {
        html += `
                    <div class="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                        <div class="font-bold text-gray-800 mb-2 flex items-center justify-between">
                            <span>Mốc điểm:</span>
                            <div class="flex items-center gap-1 font-normal">
                                <input type="number" name="min_${i}" value="${t.min}" class="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:ring-brand-red focus:border-brand-red outline-none">
                                <span>-</span>
                                <input type="number" name="max_${i}" value="${t.max}" class="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:ring-brand-red focus:border-brand-red outline-none">
                            </div>
                        </div>
                        <div class="flex flex-col gap-2 text-gray-600">
                            <div class="flex justify-between items-center">
                                <span>Thưởng Trách nhiệm (%):</span>
                                <input type="number" name="resp_${i}" value="${t.responsibility}" class="w-20 px-2 py-1 border border-gray-300 rounded-md text-right focus:ring-brand-red focus:border-brand-red outline-none">
                            </div>
                            <div class="flex justify-between items-center">
                                <span>Thưởng KPI (%):</span>
                                <input type="number" name="kpi_${i}" value="${t.kpi}" class="w-20 px-2 py-1 border border-gray-300 rounded-md text-right focus:ring-brand-red focus:border-brand-red outline-none">
                            </div>
                        </div>
                    </div>
        `;
    });

    html += `
                    <div class="pt-3">
                        <button type="button" onclick="saveRewardTiers()" class="w-full bg-brand-red text-white py-2.5 rounded-lg font-medium shadow-sm hover:bg-red-800 transition-colors">
                            Lưu thang điểm thưởng
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

window.savePenalties = async function() {
    const form = document.getElementById('penaltyForm');
    const settings = { ...state.data.appSettings };
    if (!settings.penaltyConfig) settings.penaltyConfig = {};
    
    ['Thấp', 'Trung bình', 'Cao', 'Nghiêm trọng'].forEach(level => {
        const val = form.elements['pen_' + level].value;
        settings.penaltyConfig[level] = parseInt(val) || 0;
    });
    
    try {
        const res = await fetchApi('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
        if (res && res.success) {
            showToast('Lưu cấu hình thành công');
            await fetchInitialData();
            // Also need to reflect it in the scores.js if necessary, but this requires reloading
        }
    } catch (e) {
        showToast('Lỗi khi lưu cấu hình', 'error');
    }
};

window.saveRewardTiers = async function() {
    const form = document.getElementById('rewardForm');
    const settings = { ...state.data.appSettings };
    if (!settings.rewardTiers) settings.rewardTiers = [];
    
    const newTiers = [];
    let i = 0;
    while(form.elements['min_' + i]) {
        newTiers.push({
            min: parseInt(form.elements['min_' + i].value) || 0,
            max: parseInt(form.elements['max_' + i].value) || 0,
            responsibility: parseInt(form.elements['resp_' + i].value) || 0,
            kpi: parseInt(form.elements['kpi_' + i].value) || 0
        });
        i++;
    }
    
    settings.rewardTiers = newTiers;
    
    try {
        const res = await fetchApi('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
        if (res && res.success) {
            showToast('Lưu thang điểm thưởng thành công');
            await fetchInitialData();
        }
    } catch (e) {
        showToast('Lỗi khi lưu cấu hình', 'error');
    }
};
