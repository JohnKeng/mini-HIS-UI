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
    return `
        <button onclick="window.patient.editPatient('${patient.info.id}')" class="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600 mr-2">編輯</button>
        <button onclick="window.patient.deletePatient('${patient.info.id}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">刪除</button>
    `;
}

// 顯示患者詳細資訊
async function showPatientDetail(patientId) {
    const patient = window.utils.allPatients.find(p => p.info && p.info.id === patientId);
    if (!patient) return;

    // 移除入院出院相關信息顯示

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
                    <div class="mb-2"><span class="font-medium">建立時間:</span> ${patient.registeredAt ? new Date(patient.registeredAt).toLocaleString() : 'N/A'}</div>
                    <div><span class="font-medium">最後更新:</span> ${patient.updatedAt ? new Date(patient.updatedAt).toLocaleString() : patient.registeredAt ? new Date(patient.registeredAt).toLocaleString() : 'N/A'}</div>
                </div>
            </div>
            
            
            <div class="mt-6 flex justify-end">
                <button onclick="window.patient.deletePatient('${patient.info.id}'); window.ui.hideModal();" class="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold">
                    🗑️ 刪除患者
                </button>
            </div>
        </div>
    `;

    window.ui.showModal('患者詳細資訊', content);
}

// 編輯患者
async function editPatient(patientId) {
    const patient = window.utils.allPatients.find(p => p.info && p.info.id === patientId);
    if (!patient) return;

    const p = patient.info;

    const content = `
        <form id="editPatientForm" class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div><span class="font-medium">患者 ID:</span> ${p.id}</div>
                <div></div>
                <div>
                    <label class="block text-sm font-medium mb-1">姓名</label>
                    <input type="text" id="editName" class="w-full px-3 py-2 border rounded" value="${p.name || ''}" required />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">生日</label>
                    <input type="date" id="editBirthDate" class="w-full px-3 py-2 border rounded" value="${p.birthDate || ''}" required />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">性別</label>
                    <select id="editGender" class="w-full px-3 py-2 border rounded">
                        <option value="Male" ${p.gender === 'Male' ? 'selected' : ''}>男</option>
                        <option value="Female" ${p.gender === 'Female' ? 'selected' : ''}>女</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">電話</label>
                    <input type="text" id="editPhone" class="w-full px-3 py-2 border rounded" value="${p.contactNumber || ''}" />
                </div>
                <div class="col-span-2">
                    <label class="block text-sm font-medium mb-1">地址</label>
                    <input type="text" id="editAddressStreet" class="w-full px-3 py-2 border rounded mb-2" placeholder="街道" value="${p.address?.street || ''}" />
                    <div class="grid grid-cols-3 gap-2">
                        <input type="text" id="editAddressCity" class="px-3 py-2 border rounded" placeholder="城市" value="${p.address?.city || ''}" />
                        <input type="text" id="editAddressState" class="px-3 py-2 border rounded" placeholder="州/區" value="${p.address?.state || ''}" />
                        <input type="text" id="editAddressPostal" class="px-3 py-2 border rounded" placeholder="郵遞區號" value="${p.address?.postalCode || p.address?.zipCode || ''}" />
                    </div>
                </div>
            </div>
            <div class="mt-6 flex justify-end space-x-3">
                <button type="button" id="cancelEdit" class="px-4 py-2 rounded border">取消</button>
                <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">儲存</button>
            </div>
        </form>
    `;

    window.ui.showModal('編輯患者', content);

    document.getElementById('cancelEdit').addEventListener('click', window.ui.hideModal);
    document.getElementById('editPatientForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('editName').value,
            birthDate: document.getElementById('editBirthDate').value,
            gender: document.getElementById('editGender').value,
            contactNumber: document.getElementById('editPhone').value,
            address: {
                street: document.getElementById('editAddressStreet').value,
                city: document.getElementById('editAddressCity').value,
                state: document.getElementById('editAddressState').value,
                postalCode: document.getElementById('editAddressPostal').value,
                country: (patient.info.address && patient.info.address.country) || '台灣'
            }
        };

        const result = await window.api.apiRequest(`${window.api.API_BASE}/patients/${patientId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (result.success) {
            window.ui.showMessage('患者更新成功', 'success');
            window.ui.hideModal();
            await loadPatients();
        } else {
            window.ui.showMessage(`更新失敗: ${result.error.message}`, 'error');
        }
    });
}

// 移除入院出院相關函數

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
    editPatient,
    deletePatient
};
