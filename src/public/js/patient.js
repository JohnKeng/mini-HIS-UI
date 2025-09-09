// 患者模組 - 處理患者相關功能

// 載入患者資料
async function loadPatients() {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/patients`);
    if (result.success) {
        window.utils.allPatients = result.data;
        displayPatients(result.data);
    }
}

// 顯示患者列表
function displayPatients(patients) {
    const tbody = document.getElementById('patientTableBody');
    tbody.innerHTML = '';
    
    patients.forEach(patient => {
        // 確保患者資料結構完整
        if (!patient || !patient.info || !patient.info.id) {
            console.warn('跳過無效的患者資料:', patient);
            return;
        }
        
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const statusColor = {
            'Registered': 'bg-blue-100 text-blue-800 border border-blue-300',
            'Admitted': 'bg-blue-600 text-white border border-blue-600',
            'Discharged': 'bg-blue-200 text-blue-700 border border-blue-300'
        }[patient.tag] || 'bg-blue-100 text-blue-800 border border-blue-300';
        
        row.innerHTML = `
            <td class="px-4 py-2 font-mono text-sm cursor-pointer hover:text-blue-600" onclick="window.patient.showPatientDetail('${patient.info.id}')">${patient.info.id}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 font-medium" onclick="window.patient.showPatientDetail('${patient.info.id}')">${patient.info.name}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm" onclick="window.patient.showPatientDetail('${patient.info.id}')">${patient.info.birthDate}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm" onclick="window.patient.showPatientDetail('${patient.info.id}')">${patient.info.gender === 'Male' ? '男' : '女'}</td>
            <td class="px-4 py-2">
                <span class="px-2 py-1 rounded-full text-xs ${statusColor}">
                    ${patient.tag}
                </span>
            </td>
            <td class="px-4 py-2">
                ${getPatientActions(patient)}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// 獲取患者操作按鈕
function getPatientActions(patient) {
    const actions = [];
    
    if (patient.tag === 'Registered') {
        actions.push(`<button onclick="window.patient.admitPatient('${patient.info.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">入院</button>`);
    }
    
    if (patient.tag === 'Admitted') {
        actions.push(`<button onclick="window.patient.dischargePatient('${patient.info.id}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">出院</button>`);
    }
    
    return actions.join(' ');
}

// 顯示患者詳細資訊
async function showPatientDetail(patientId) {
    const patient = window.utils.allPatients.find(p => p.info && p.info.id === patientId);
    if (!patient) return;

    const admissionInfo = patient.tag === 'Admitted' ? `
        <div class="mt-4">
            <h4 class="font-semibold text-gray-800 mb-2">住院信息</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div><span class="font-medium">病房號碼:</span> ${patient.wardNumber || 'N/A'}</div>
                <div><span class="font-medium">床位號碼:</span> ${patient.bedNumber || 'N/A'}</div>
                <div><span class="font-medium">主治醫師:</span> ${patient.attendingDoctorId || 'N/A'}</div>
                <div><span class="font-medium">入院時間:</span> ${patient.admittedAt ? new Date(patient.admittedAt).toLocaleString() : 'N/A'}</div>
            </div>
        </div>
    ` : '';

    const dischargeInfo = patient.tag === 'Discharged' ? `
        <div class="mt-4">
            <h4 class="font-semibold text-gray-800 mb-2">出院信息</h4>
            <div class="text-sm">
                <div class="mb-2"><span class="font-medium">出院時間:</span> ${patient.dischargedAt ? new Date(patient.dischargedAt).toLocaleString() : 'N/A'}</div>
                <div class="mb-2"><span class="font-medium">出院摘要:</span> ${patient.dischargeSummary || 'N/A'}</div>
                <div><span class="font-medium">後續追蹤:</span> ${patient.followUpDate ? new Date(patient.followUpDate).toLocaleString() : 'N/A'}</div>
            </div>
        </div>
    ` : '';

    const content = `
        <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">基本信息</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><span class="font-medium">患者 ID:</span> ${patient.info.id}</div>
                    <div><span class="font-medium">姓名:</span> ${patient.info.name}</div>
                    <div><span class="font-medium">生日:</span> ${patient.info.birthDate}</div>
                    <div><span class="font-medium">性別:</span> ${patient.info.gender === 'Male' ? '男性' : '女性'}</div>
                    <div><span class="font-medium">聯絡電話:</span> ${patient.info.contactNumber}</div>
                    <div><span class="font-medium">地址:</span> ${patient.info.address.street}, ${patient.info.address.city}</div>
                </div>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">狀態信息</h4>
                <div class="text-sm">
                    <div class="mb-2"><span class="font-medium">當前狀態:</span> ${patient.tag}</div>
                    <div class="mb-2"><span class="font-medium">建立時間:</span> ${new Date(patient.createdAt).toLocaleString()}</div>
                    <div><span class="font-medium">最後更新:</span> ${patient.updatedAt ? new Date(patient.updatedAt).toLocaleString() : 'N/A'}</div>
                </div>
            </div>
            
            ${admissionInfo}
            ${dischargeInfo}
            
            <div class="mt-6 flex justify-end">
                <button onclick="window.patient.deletePatient('${patient.info.id}'); window.ui.hideModal();" class="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold">
                    🗑️ 刪除患者
                </button>
            </div>
        </div>
    `;

    window.ui.showModal('患者詳細資訊', content);
}

// 患者入院
async function admitPatient(patientId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/patients/${patientId}/admit`, {
        method: 'POST',
        body: JSON.stringify({
            wardNumber: 'A101',
            bedNumber: '1',
            attendingDoctorId: 'doc-001'
        })
    });
    
    if (result.success) {
        window.ui.showMessage('患者入院成功', 'success');
        loadPatients();
    } else {
        window.ui.showMessage(`入院失敗: ${result.error.message}`, 'error');
    }
}

// 患者出院
async function dischargePatient(patientId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/patients/${patientId}/discharge`, {
        method: 'POST',
        body: JSON.stringify({
            dischargeSummary: '治療完成，狀況良好',
            followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
    });
    
    if (result.success) {
        window.ui.showMessage('患者出院成功', 'success');
        loadPatients();
    } else {
        window.ui.showMessage(`出院失敗: ${result.error.message}`, 'error');
    }
}

// 刪除患者
async function deletePatient(patientId) {
    if (!confirm('確定要刪除此患者嗎？')) return;
    
    const result = await window.api.apiRequest(`${window.api.API_BASE}/patients/${patientId}`, {
        method: 'DELETE'
    });
    
    if (result.success) {
        window.ui.showMessage('患者刪除成功', 'success');
        loadPatients();
    } else {
        window.ui.showMessage(`刪除失敗: ${result.error.message}`, 'error');
    }
}

// 導出患者模組函數
window.patient = {
    loadPatients,
    displayPatients,
    showPatientDetail,
    admitPatient,
    dischargePatient,
    deletePatient
};