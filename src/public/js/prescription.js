// 處方模組 - 處理處方相關功能

// 載入處方資料
async function loadPrescriptions() {
    if (window.utils?.ensureDoctorsLoaded) await window.utils.ensureDoctorsLoaded();
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
        const firstItem = (prescription.info.items && prescription.info.items[0]) || null;
        const mainMedication = firstItem ? firstItem.medication.name : '未設定';
        const dosageFreq = firstItem ? `${firstItem.dosage || '-'} × ${firstItem.frequency || '-'}` : '-';
        const createdTime = new Date(prescription.createdAt).toLocaleString('zh-TW');
        const doctor = window.utils.getDoctorDisplay(prescription.info.doctorId);
        const duration = firstItem?.duration || '-';
        const refill = '-';
        const dispensed = prescription.tag === 'Prepared' || prescription.tag === 'Dispensed' ? '是' : '否';
        const notes = prescription.info.notes || '-';
        const count = Array.isArray(prescription.info.items) ? prescription.info.items.length : 0;
        
        row.innerHTML = `
            <td class="px-4 py-2 sticky left-0 bg-white z-10 w-[260px]">
                <div class="font-medium cursor-pointer hover:text-blue-600" onclick="window.prescription.showPrescriptionDetail('${prescription.info.id}')">${patientName}</div>
                <div class="text-xs text-slate-500 font-mono cursor-pointer hover:text-blue-600" onclick="window.prescription.showPrescriptionDetail('${prescription.info.id}')">${prescription.info.patientId}</div>
            </td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm w-[260px]" onclick="window.prescription.showPrescriptionDetail('${prescription.info.id}')">${mainMedication}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm w-[200px]" onclick="window.prescription.showPrescriptionDetail('${prescription.info.id}')">${dosageFreq}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm w-[220px] whitespace-nowrap" onclick="window.prescription.showPrescriptionDetail('${prescription.info.id}')">${createdTime}</td>
            <td class="px-4 py-2 w-[140px]">
                <span class="px-2 py-1 rounded-full text-xs ${statusColor}">${prescription.tag}</span>
            </td>
            <td class="px-4 py-2 w-[200px]">${doctor}</td>
            <td class="px-4 py-2 w-[160px]">${duration}</td>
            <td class="px-4 py-2 w-[160px]">${refill}</td>
            <td class="px-4 py-2 w-[140px]">${dispensed}</td>
            <td class="px-4 py-2 w-[200px] truncate" title="${notes}">${notes}</td>
            <td class="px-4 py-2 w-[140px]">${count}</td>
            <td class="px-4 py-2 sticky right-0 bg-white z-10 w-[180px]">${getPrescriptionActions(prescription)}</td>
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
    if (window.utils?.ensureDoctorsLoaded) await window.utils.ensureDoctorsLoaded();
    const prescription = window.utils.allPrescriptions.find(p => p.info.id === prescriptionId);
    if (!prescription) return;

    const patientName = window.utils.getPatientName(prescription.info.patientId);
    const doctorDisplay = window.utils.getDoctorDisplay(prescription.info.doctorId);
    
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
                    <div><span class="font-medium">開立醫師:</span> ${doctorDisplay}</div>
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
            
            <div class="mt-6 flex justify-end">
                <button onclick="window.prescription.deletePrescription('${prescription.info.id}'); window.ui.hideModal();" class="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold">
                    刪除
                </button>
            </div>
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
        method: 'POST',
        body: JSON.stringify({ pharmacistId: 'pharm-001' })
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
        method: 'POST',
        body: JSON.stringify({ dispensedBy: 'pharm-001', instructions: '請按時服用' })
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
    deletePrescription,
    openCreateModal
};

// 以彈窗方式開立新處方
function openCreateModal() {
    const content = `
        <form id="prescriptionCreateForm" class="space-y-4" aria-label="開立新處方表單">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="newPrescriptionPatientId" class="block text-sm font-medium mb-1">選擇患者</label>
                    <input id="newPrescriptionPatientId" type="text" list="newPrescriptionPatientList" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <datalist id="newPrescriptionPatientList"></datalist>
                </div>
                <div>
                    <label for="newPrescriptionDoctorId" class="block text-sm font-medium mb-1">選擇醫師</label>
                    <input id="newPrescriptionDoctorId" type="text" list="newPrescriptionDoctorList" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <datalist id="newPrescriptionDoctorList"></datalist>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium mb-1">主要藥物</label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input id="newMedicationName" type="text" placeholder="藥名" class="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        <input id="newMedicationCode" type="text" placeholder="代碼" class="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        <input id="newMedicationStrength" type="text" placeholder="強度" class="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                </div>
                <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input id="newMedicationForm" type="text" placeholder="劑型" class="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <input id="newMedicationDosage" type="text" placeholder="劑量" class="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <input id="newMedicationFrequency" type="text" placeholder="頻率" class="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input id="newMedicationRoute" type="text" placeholder="途徑" class="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <input id="newMedicationDuration" type="text" placeholder="療程" class="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <input id="newPrescriptionNotes" type="text" placeholder="備註" class="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>
            <div class="flex justify-end space-x-3 pt-2">
                <button type="button" class="px-4 py-2 rounded border" onclick="window.ui.hideModal()">取消</button>
                <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">開立</button>
            </div>
        </form>
    `;
    window.ui.showModal('開立新處方', content);
    if (window.utils?.loadPatientOptions) window.utils.loadPatientOptions('newPrescriptionPatientList');
    if (window.utils?.loadDoctorOptions) window.utils.loadDoctorOptions('newPrescriptionDoctorList');

    const form = document.getElementById('prescriptionCreateForm');
    const docInput = document.getElementById('newPrescriptionDoctorId');
    const docList = document.getElementById('newPrescriptionDoctorList');
    if (docInput && docList) {
        docInput.addEventListener('change', () => {
            const opt = docList.querySelector(`option[value="${docInput.value}"]`);
            if (opt) docInput.value = opt.getAttribute('data-id') || docInput.value;
        });
    }
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            patientId: document.getElementById('newPrescriptionPatientId').value,
            doctorId: document.getElementById('newPrescriptionDoctorId').value,
            items: [
                {
                    medication: {
                        id: `m-${Date.now()}`,
                        name: document.getElementById('newMedicationName').value,
                        code: document.getElementById('newMedicationCode').value,
                        dosageForm: document.getElementById('newMedicationForm').value,
                        strength: document.getElementById('newMedicationStrength').value
                    },
                    dosage: document.getElementById('newMedicationDosage').value,
                    frequency: document.getElementById('newMedicationFrequency').value,
                    route: document.getElementById('newMedicationRoute').value,
                    duration: document.getElementById('newMedicationDuration').value,
                    instructions: '依醫囑使用'
                }
            ],
            notes: document.getElementById('newPrescriptionNotes').value
        };
        const result = await window.api.apiRequest(`${window.api.API_BASE}/prescriptions`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (result.success) {
            window.ui.showMessage('處方開立成功', 'success');
            window.ui.hideModal();
            loadPrescriptions();
        } else {
            window.ui.showMessage(`開立失敗: ${result.error.message}`, 'error');
        }
    });
}
