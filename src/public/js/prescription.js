// 處方模組 - 處理處方相關功能

// 載入處方資料
async function loadPrescriptions() {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/prescriptions`);
    if (result.success) {
        window.utils.allPrescriptions = result.data;
        displayPrescriptions(result.data);
    }
}

// 顯示處方列表
function displayPrescriptions(prescriptions) {
    const tbody = document.getElementById('prescriptionTableBody');
    tbody.innerHTML = '';
    
    prescriptions.forEach(prescription => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const statusColor = {
            'Created': 'bg-blue-100 text-blue-700 border border-blue-300',
            'Submitted': 'bg-blue-200 text-blue-800 border border-blue-400',
            'InPreparation': 'bg-blue-500 text-white border border-blue-500',
            'Prepared': 'bg-blue-700 text-white border border-blue-700',
            'Dispensed': 'bg-blue-900 text-white border border-blue-900'
        }[prescription.tag] || 'bg-blue-100 text-blue-800 border border-blue-300';
        
        const patientName = window.utils.getPatientName(prescription.info.patientId);
        const mainMedication = prescription.info.items && prescription.info.items.length > 0 ? 
            prescription.info.items[0].medication.name : '未設定';
        const createdTime = new Date(prescription.createdAt).toLocaleString('zh-TW');
        
        row.innerHTML = `
            <td class="px-4 py-2 font-mono text-sm cursor-pointer hover:text-blue-600" onclick="window.prescription.showPrescriptionDetail('${prescription.info.id}')">${prescription.info.patientId}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 font-medium" onclick="window.prescription.showPrescriptionDetail('${prescription.info.id}')">${patientName}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm" onclick="window.prescription.showPrescriptionDetail('${prescription.info.id}')">${mainMedication}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm" onclick="window.prescription.showPrescriptionDetail('${prescription.info.id}')">${createdTime}</td>
            <td class="px-4 py-2">
                <span class="px-2 py-1 rounded-full text-xs ${statusColor}">
                    ${prescription.tag}
                </span>
            </td>
            <td class="px-4 py-2">
                ${getPrescriptionActions(prescription)}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// 獲取處方操作按鈕
function getPrescriptionActions(prescription) {
    const actions = [];
    
    if (prescription.tag === 'Created') {
        actions.push(`<button onclick="window.prescription.submitPrescription('${prescription.info.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">提交</button>`);
    }
    
    if (prescription.tag === 'Submitted') {
        actions.push(`<button onclick="window.prescription.startPreparingPrescription('${prescription.info.id}')" class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">準備</button>`);
    }
    
    if (prescription.tag === 'InPreparation') {
        actions.push(`<button onclick="window.prescription.completePreparingPrescription('${prescription.info.id}')" class="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600">完成準備</button>`);
    }
    
    if (prescription.tag === 'Prepared') {
        actions.push(`<button onclick="window.prescription.dispensePrescription('${prescription.info.id}')" class="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600">配藥</button>`);
    }
    
    return actions.join(' ');
}

// 顯示處方詳細資訊
async function showPrescriptionDetail(prescriptionId) {
    const prescription = window.utils.allPrescriptions.find(p => p.info.id === prescriptionId);
    if (!prescription) return;

    const patientName = window.utils.getPatientName(prescription.info.patientId);
    
    const medicationsList = prescription.info.items?.map(item => `
        <div class="bg-white p-3 rounded border">
            <div class="font-medium">${item.medication.name}</div>
            <div class="text-sm text-gray-600 mt-1">
                <div>代碼: ${item.medication.code}</div>
                <div>劑型: ${item.medication.dosageForm}</div>
                <div>強度: ${item.medication.strength}</div>
                <div>劑量: ${item.dosage}</div>
                <div>頻率: ${item.frequency}</div>
                <div>給藥途徑: ${item.route}</div>
                <div>療程: ${item.duration}</div>
                <div>用藥指示: ${item.instructions}</div>
            </div>
        </div>
    `).join('') || '<div>無藥物信息</div>';

    const content = `
        <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">處方信息</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><span class="font-medium">處方 ID:</span> ${prescription.info.id}</div>
                    <div><span class="font-medium">患者 ID:</span> ${prescription.info.patientId}</div>
                    <div><span class="font-medium">患者姓名:</span> ${patientName}</div>
                    <div><span class="font-medium">醫生 ID:</span> ${prescription.info.doctorId}</div>
                    <div><span class="font-medium">當前狀態:</span> ${prescription.tag}</div>
                    <div><span class="font-medium">建立時間:</span> ${new Date(prescription.createdAt).toLocaleString()}</div>
                </div>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">藥物列表</h4>
                <div class="space-y-3">
                    ${medicationsList}
                </div>
            </div>
            
            ${prescription.info.notes ? `
            <div class="bg-yellow-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">備註</h4>
                <div class="text-sm">${prescription.info.notes}</div>
            </div>
            ` : ''}
        </div>
    `;

    window.ui.showModal('處方詳細資訊', content);
}

// 提交處方
async function submitPrescription(prescriptionId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/prescriptions/${prescriptionId}/submit`, {
        method: 'POST'
    });
    
    if (result.success) {
        window.ui.showMessage('處方提交成功', 'success');
        loadPrescriptions();
    } else {
        window.ui.showMessage(`提交失敗: ${result.error.message}`, 'error');
    }
}

// 開始準備處方
async function startPreparingPrescription(prescriptionId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/prescriptions/${prescriptionId}/start-preparing`, {
        method: 'POST'
    });
    
    if (result.success) {
        window.ui.showMessage('開始準備處方', 'success');
        loadPrescriptions();
    } else {
        window.ui.showMessage(`開始準備失敗: ${result.error.message}`, 'error');
    }
}

// 完成準備處方
async function completePreparingPrescription(prescriptionId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/prescriptions/${prescriptionId}/complete-preparing`, {
        method: 'POST'
    });
    
    if (result.success) {
        window.ui.showMessage('處方準備完成', 'success');
        loadPrescriptions();
    } else {
        window.ui.showMessage(`完成準備失敗: ${result.error.message}`, 'error');
    }
}

// 配發處方
async function dispensePrescription(prescriptionId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/prescriptions/${prescriptionId}/dispense`, {
        method: 'POST'
    });
    
    if (result.success) {
        window.ui.showMessage('處方配發成功', 'success');
        loadPrescriptions();
    } else {
        window.ui.showMessage(`配發失敗: ${result.error.message}`, 'error');
    }
}

// 刪除處方
async function deletePrescription(prescriptionId) {
    if (!confirm('確定要刪除此處方嗎？')) return;
    
    const result = await window.api.apiRequest(`${window.api.API_BASE}/prescriptions/${prescriptionId}`, {
        method: 'DELETE'
    });
    
    if (result.success) {
        window.ui.showMessage('處方刪除成功', 'success');
        loadPrescriptions();
    } else {
        window.ui.showMessage(`刪除失敗: ${result.error.message}`, 'error');
    }
}

// 導出處方模組函數
window.prescription = {
    loadPrescriptions,
    displayPrescriptions,
    showPrescriptionDetail,
    submitPrescription,
    startPreparingPrescription,
    completePreparingPrescription,
    dispensePrescription,
    deletePrescription
};