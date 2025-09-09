// 醫療服務模組 - 處理醫療服務相關功能

// 載入醫療服務資料
async function loadServices() {
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
        const serviceName = service.info.description || '未設定';
        const serviceType = service.info.serviceType || '未設定';
        const priority = service.info.priority || '未設定';
        
        row.innerHTML = `
            <td class="px-4 py-2 font-mono text-sm cursor-pointer hover:text-blue-600" onclick="window.service.showServiceDetail('${service.info.id}')">${service.info.patientId}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 font-medium" onclick="window.service.showServiceDetail('${service.info.id}')">${patientName}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm" onclick="window.service.showServiceDetail('${service.info.id}')">${serviceName}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm" onclick="window.service.showServiceDetail('${service.info.id}')">${serviceType}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm" onclick="window.service.showServiceDetail('${service.info.id}')">${priority}</td>
            <td class="px-4 py-2">
                <span class="px-2 py-1 rounded-full text-xs ${statusColor}">
                    ${service.tag}
                </span>
            </td>
            <td class="px-4 py-2">
                ${getServiceActions(service)}
            </td>
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
    const service = window.utils.allServices.find(s => s.info.id === serviceId);
    if (!service) return;

    const patientName = window.utils.getPatientName(service.info.patientId);
    
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
                    <div><span class="font-medium">服務名稱:</span> ${service.info.description}</div>
                    <div><span class="font-medium">優先級:</span> ${service.info.priority}</div>
                    <div><span class="font-medium">預計時長:</span> ${service.info.estimatedDuration} 分鐘</div>
                    <div><span class="font-medium">申請人:</span> ${service.info.requestedBy}</div>
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
                    刪除服務
                </button>
            </div>
        </div>
    `;

    window.ui.showModal('醫療服務詳細資訊', content);
}

// 安排醫療服務
async function scheduleService(serviceId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/services/${serviceId}/schedule`, {
        method: 'POST'
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
    const result = await window.api.apiRequest(`${window.api.API_BASE}/services/${serviceId}/start-preparing`, {
        method: 'POST'
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
    const result = await window.api.apiRequest(`${window.api.API_BASE}/services/${serviceId}/complete`, {
        method: 'POST'
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
    deleteService
};