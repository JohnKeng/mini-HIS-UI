// 醫療服務模組 - 處理醫療服務相關功能

// 載入醫療服務資料
async function loadServices() {
    if (window.utils?.ensureDoctorsLoaded) await window.utils.ensureDoctorsLoaded();
    const result = await window.api.apiRequest(`${window.api.API_BASE}/services`);
    if (result.success) {
        window.utils.allServices = result.data;
        displayServices(result.data);
    }
}

// 顯示醫療服務列表
function displayServices(services) {
    const tbody = document.getElementById('serviceTableBody');
    tbody.innerHTML = '';
    
    services.forEach(service => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const statusColor = {
            'Requested': 'bg-blue-100 text-blue-700 border border-blue-300',
            'Scheduled': 'bg-blue-200 text-blue-800 border border-blue-400',
            'InPreparation': 'bg-blue-500 text-white border border-blue-500',
            'InProgress': 'bg-blue-700 text-white border border-blue-700',
            'Completed': 'bg-blue-900 text-white border border-blue-900'
        }[service.tag] || 'bg-blue-100 text-blue-800 border border-blue-300';
        
        const patientName = window.utils.getPatientName(service.info.patientId);
        // 名稱優先取用 description；為相容舊資料，也嘗試 serviceName
        const serviceName = service.info.description || service.info.serviceName || '未設定';
        const serviceType = service.info.serviceType || '未設定';
        const priority = service.info.priority || '未設定';
        const requestedBy = window.utils.getDoctorDisplay(service.requestedBy);
        const requestedAt = service.requestedAt ? new Date(service.requestedAt).toLocaleString('zh-TW') : '-';
        const estimated = (service.info.estimatedDuration != null) ? `${service.info.estimatedDuration} 分鐘` : '-';
        const scheduledTime = service.scheduledTime ? new Date(service.scheduledTime).toLocaleString('zh-TW') : '-';
        const location = service.location || '-';
        const scheduleInfo = scheduledTime !== '-' || location !== '-' ? `${scheduledTime} / ${location}` : '-';
        const resources = Array.isArray(service.info.requiredResources) && service.info.requiredResources.length > 0 ? service.info.requiredResources.join('、') : '-';
        const outcome = service.outcome || '-';
        const notes = service.info.notes || '-';
        
        row.innerHTML = `
            <td class="px-4 py-2 sticky left-0 bg-white z-10 w-[260px]">
                <div class="font-medium cursor-pointer hover:text-blue-600" onclick="window.service.showServiceDetail('${service.info.id}')">${patientName}</div>
                <div class="text-xs text-slate-500 font-mono cursor-pointer hover:text-blue-600" onclick="window.service.showServiceDetail('${service.info.id}')">${service.info.patientId}</div>
            </td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm w-[240px]" onclick="window.service.showServiceDetail('${service.info.id}')">${serviceName}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm w-[160px]" onclick="window.service.showServiceDetail('${service.info.id}')">${serviceType}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm w-[140px]" onclick="window.service.showServiceDetail('${service.info.id}')">${priority}</td>
            <td class="px-4 py-2 w-[140px]"><span class="px-2 py-1 rounded-full text-xs ${statusColor}">${service.tag}</span></td>
            <td class="px-4 py-2 w-[200px]">${requestedBy}</td>
            <td class="px-4 py-2 w-[220px]">${requestedAt}</td>
            <td class="px-4 py-2 w-[160px]">${estimated}</td>
            <td class="px-4 py-2 w-[220px]">${scheduleInfo}</td>
            <td class="px-4 py-2 w-[240px] truncate" title="${resources}">${resources}</td>
            <td class="px-4 py-2 w-[200px] truncate" title="${outcome}">${outcome}</td>
            <td class="px-4 py-2 w-[200px] truncate" title="${notes}">${notes}</td>
            <td class="px-4 py-2 sticky right-0 bg-white z-10 w-[180px]">${getServiceActions(service)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// 獲取醫療服務操作按鈕
function getServiceActions(service) {
    const actions = [];
    
    if (service.tag === 'Requested') {
        actions.push(`<button onclick="window.service.scheduleService('${service.info.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">安排</button>`);
    }
    
    if (service.tag === 'Scheduled') {
        actions.push(`<button onclick="window.service.startPreparingService('${service.info.id}')" class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">準備</button>`);
    }
    
    if (service.tag === 'InPreparation') {
        actions.push(`<button onclick="window.service.startService('${service.info.id}')" class="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600">開始</button>`);
    }
    
    if (service.tag === 'InProgress') {
        actions.push(`<button onclick="window.service.completeService('${service.info.id}')" class="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600">完成</button>`);
    }
    
    return actions.join(' ');
}

// 顯示醫療服務詳細資訊
async function showServiceDetail(serviceId) {
    if (window.utils?.ensureDoctorsLoaded) await window.utils.ensureDoctorsLoaded();
    const service = window.utils.allServices.find(s => s.info.id === serviceId);
    if (!service) return;

    const patientName = window.utils.getPatientName(service.info.patientId);
    const requesterDisplay = window.utils.getDoctorDisplay(service.requestedBy);
    
    const resourcesList = service.info.requiredResources?.map(resource => 
        `<span class="bg-gray-100 px-2 py-1 rounded text-sm">${resource}</span>`
    ).join(' ') || '<span class="text-gray-500">無特殊資源需求</span>';

    const content = `
        <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">服務信息</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><span class="font-medium">服務 ID:</span> ${service.info.id}</div>
                    <div><span class="font-medium">患者 ID:</span> ${service.info.patientId}</div>
                    <div><span class="font-medium">患者姓名:</span> ${patientName}</div>
                    <div><span class="font-medium">服務類型:</span> ${service.info.serviceType}</div>
                    <div><span class="font-medium">服務名稱:</span> ${service.info.description || service.info.serviceName || '未設定'}</div>
                    <div><span class="font-medium">優先級:</span> ${service.info.priority}</div>
                    <div><span class="font-medium">預計時長:</span> ${service.info.estimatedDuration} 分鐘</div>
                    <div><span class="font-medium">請求者:</span> ${requesterDisplay}</div>
                    <div><span class="font-medium">當前狀態:</span> ${service.tag}</div>
                    <div><span class="font-medium">建立時間:</span> ${new Date(service.createdAt).toLocaleString()}</div>
                </div>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">所需資源</h4>
                <div class="space-x-2">
                    ${resourcesList}
                </div>
            </div>
            
            ${service.info.notes ? `
            <div class="bg-yellow-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">備註</h4>
                <div class="text-sm">${service.info.notes}</div>
            </div>
            ` : ''}
            <div class="mt-6 flex justify-end">
                <button onclick="window.service.deleteService('${service.info.id}'); window.ui.hideModal();" class="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold">
                    刪除
                </button>
            </div>
        </div>
    `;

    window.ui.showModal('醫療服務詳細資訊', content);
}

// 安排醫療服務
async function scheduleService(serviceId) {
    const scheduledTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const payload = { scheduledTime, scheduledBy: 'staff-001', location: 'Room 305' };
    const result = await window.api.apiRequest(`${window.api.API_BASE}/services/${serviceId}/schedule`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    
    if (result.success) {
        window.ui.showMessage('服務安排成功', 'success');
        loadServices();
    } else {
        window.ui.showMessage(`安排失敗: ${result.error.message}`, 'error');
    }
}

// 開始準備醫療服務
async function startPreparingService(serviceId) {
    const staff = [{
        id: 'staff-001',
        name: '系統預設',
        birthDate: new Date().toISOString(),
        gender: 'other',
        staffType: 'labTechnician',
        department: 'Lab',
        licenseNumber: 'LIC-UI-0001'
    }];
    const payload = { staff, location: '準備室', preparationNotes: '自動準備' };
    const result = await window.api.apiRequest(`${window.api.API_BASE}/services/${serviceId}/start-preparing`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    
    if (result.success) {
        window.ui.showMessage('開始準備服務', 'success');
        loadServices();
    } else {
        window.ui.showMessage(`開始準備失敗: ${result.error.message}`, 'error');
    }
}

// 開始醫療服務
async function startService(serviceId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/services/${serviceId}/start`, {
        method: 'POST'
    });
    
    if (result.success) {
        window.ui.showMessage('服務開始', 'success');
        loadServices();
    } else {
        window.ui.showMessage(`開始失敗: ${result.error.message}`, 'error');
    }
}

// 完成醫療服務
async function completeService(serviceId) {
    const payload = { results: '完成', actualDuration: 30, followUpInstructions: '' };
    const result = await window.api.apiRequest(`${window.api.API_BASE}/services/${serviceId}/complete`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    
    if (result.success) {
        window.ui.showMessage('服務完成', 'success');
        loadServices();
    } else {
        window.ui.showMessage(`完成失敗: ${result.error.message}`, 'error');
    }
}

// 刪除醫療服務
async function deleteService(serviceId) {
    if (!confirm('確定要刪除此服務嗎？')) return;
    
    const result = await window.api.apiRequest(`${window.api.API_BASE}/services/${serviceId}`, {
        method: 'DELETE'
    });
    
    if (result.success) {
        window.ui.showMessage('服務刪除成功', 'success');
        loadServices();
    } else {
        window.ui.showMessage(`刪除失敗: ${result.error.message}`, 'error');
    }
}

// 導出醫療服務模組函數
window.service = {
    loadServices,
    displayServices,
    showServiceDetail,
    scheduleService,
    startPreparingService,
    startService,
    completeService,
    deleteService,
    openCreateModal
};

// 以彈窗方式新增服務
function openCreateModal() {
    const content = `
        <form id="serviceCreateForm" class="space-y-4" aria-label="新增服務表單">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="newServicePatientId" class="block text-sm font-medium mb-1">選擇患者</label>
                    <input id="newServicePatientId" type="text" list="newServicePatientList" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <datalist id="newServicePatientList"></datalist>
                </div>
                <div>
                    <label for="newServiceType" class="block text-sm font-medium mb-1">服務類型</label>
                    <select id="newServiceType" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="">請選擇</option>
                        <option value="Consultation">門診</option>
                        <option value="Examination">檢查</option>
                        <option value="Laboratory">檢驗</option>
                        <option value="Surgery">手術</option>
                    </select>
                </div>
                <div>
                    <label for="newServiceName" class="block text-sm font-medium mb-1">服務名稱</label>
                    <input id="newServiceName" type="text" value="X光檢查" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label for="newServicePriority" class="block text-sm font-medium mb-1">優先度</label>
                    <select id="newServicePriority" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="">請選擇</option>
                        <option value="Low">低</option>
                        <option value="Normal">一般</option>
                        <option value="High">高</option>
                        <option value="Emergency">緊急</option>
                    </select>
                </div>
                <div>
                    <label for="newServiceDuration" class="block text-sm font-medium mb-1">預估時間 (分鐘)</label>
                    <input id="newServiceDuration" type="number" value="45" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label for="newServiceRequestedBy" class="block text-sm font-medium mb-1">選擇請求者</label>
                    <input id="newServiceRequestedBy" type="text" list="newServiceRequesterList" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <datalist id="newServiceRequesterList"></datalist>
                </div>
                <div class="md:col-span-2">
                    <label for="newServiceNotes" class="block text-sm font-medium mb-1">備註</label>
                    <textarea id="newServiceNotes" rows="3" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">檢查胸部</textarea>
                </div>
            </div>
            <div class="flex justify-end space-x-3 pt-2">
                <button type="button" class="px-4 py-2 rounded border" onclick="window.ui.hideModal()">取消</button>
                <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">新增</button>
            </div>
        </form>
    `;
    window.ui.showModal('新增服務', content);
    if (window.utils?.loadPatientOptions) window.utils.loadPatientOptions('newServicePatientList');
    if (window.utils?.loadDoctorOptions) window.utils.loadDoctorOptions('newServiceRequesterList');

    const requesterInput = document.getElementById('newServiceRequestedBy');
    const requesterList = document.getElementById('newServiceRequesterList');
    if (requesterInput && requesterList) {
        requesterInput.addEventListener('change', () => {
            const opt = requesterList.querySelector(`option[value="${requesterInput.value}"]`);
            if (opt) requesterInput.value = opt.getAttribute('data-id') || requesterInput.value;
        });
    }

    document.getElementById('serviceCreateForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            patientId: document.getElementById('newServicePatientId').value,
            serviceType: document.getElementById('newServiceType').value,
            description: document.getElementById('newServiceName').value,
            serviceName: document.getElementById('newServiceName').value,
            priority: document.getElementById('newServicePriority').value,
            estimatedDuration: parseInt(document.getElementById('newServiceDuration').value),
            requestedBy: document.getElementById('newServiceRequestedBy').value,
            requiredResources: ['X光機', '技術人員'],
            notes: document.getElementById('newServiceNotes').value
        };
        const result = await window.api.apiRequest(`${window.api.API_BASE}/services`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (result.success) {
            window.ui.showMessage('服務請求成功', 'success');
            window.ui.hideModal();
            loadServices();
        } else {
            window.ui.showMessage(`請求失敗: ${result.error.message}`, 'error');
        }
    });
}
