// API 基礎 URL
const API_BASE = '/api';

// DOM 元素
const patientBtn = document.getElementById('patientBtn');
const appointmentBtn = document.getElementById('appointmentBtn');
const prescriptionBtn = document.getElementById('prescriptionBtn');
const serviceBtn = document.getElementById('serviceBtn');

const panels = {
    welcome: document.getElementById('welcomePanel'),
    patient: document.getElementById('patientPanel'),
    appointment: document.getElementById('appointmentPanel'),
    prescription: document.getElementById('prescriptionPanel'),
    service: document.getElementById('servicePanel')
};

// 顯示指定面板
function showPanel(panelName) {
    // 隱藏所有面板
    Object.values(panels).forEach(panel => {
        if (panel) panel.classList.add('hidden');
    });
    
    // 顯示指定面板
    if (panels[panelName]) {
        panels[panelName].classList.remove('hidden');
    }
    
    // 更新按鈕狀態
    document.querySelectorAll('nav button, .grid button').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-offset-2');
    });
}

// 顯示訊息
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    const messageDiv = document.createElement('div');
    
    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    }[type] || 'bg-blue-500';
    
    messageDiv.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg mb-2 transition-all duration-300`;
    messageDiv.textContent = message;
    
    messageContainer.appendChild(messageDiv);
    
    // 3 秒後自動移除
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// API 請求函數
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API 請求錯誤:', error);
        showMessage('網路請求失敗', 'error');
        return { success: false, error: { message: '網路請求失敗' } };
    }
}

// ========== 彈窗控制 ==========
function showModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('detailModal').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

// 關閉彈窗事件
document.getElementById('closeModal').addEventListener('click', hideModal);
document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
        hideModal();
    }
});

// ========== 通用函數 ==========
async function loadPatientOptions(selectElementId) {
    const result = await apiRequest(`${API_BASE}/patients`);
    if (result.success) {
        const selectElement = document.getElementById(selectElementId);
        // 清空現有選項（保留第一個預設選項）
        selectElement.innerHTML = '<option value="">請選擇病患</option>';
        
        // 添加病患選項
        result.data.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.info.id;
            option.textContent = `${patient.info.name} (${patient.info.id})`;
            selectElement.appendChild(option);
        });
    }
}

// ========== 詳細信息顯示 ==========
let allPatients = [];
let allAppointments = [];
let allPrescriptions = [];
let allServices = [];

async function showPatientDetail(patientId) {
    const patient = allPatients.find(p => p.info.id === patientId);
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
                    <div class="mb-2"><span class="font-medium">當前狀態:</span> <span class="px-2 py-1 rounded text-xs bg-blue-200">${patient.tag}</span></div>
                    <div><span class="font-medium">註冊時間:</span> ${new Date(patient.registeredAt).toLocaleString()}</div>
                </div>
            </div>
            
            ${admissionInfo}
            ${dischargeInfo}
            
            <div class="mt-6 pt-4 border-t border-gray-200">
                <button onclick="deletePatient('${patient.info.id}')" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
                    刪除患者
                </button>
            </div>
        </div>
    `;

    showModal(`患者詳細信息 - ${patient.info.name}`, content);
}

async function showAppointmentDetail(appointmentId) {
    const appointment = allAppointments.find(a => a.info.id === appointmentId);
    if (!appointment) return;

    const patient = allPatients.find(p => p.info.id === appointment.info.patientId);
    const patientName = patient ? patient.info.name : '未知';

    const content = `
        <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">預約信息</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><span class="font-medium">預約 ID:</span> ${appointment.info.id}</div>
                    <div><span class="font-medium">患者:</span> ${patientName} (${appointment.info.patientId})</div>
                    <div><span class="font-medium">醫師 ID:</span> ${appointment.info.doctorId}</div>
                    <div><span class="font-medium">科別:</span> ${appointment.info.department}</div>
                    <div><span class="font-medium">預約時間:</span> ${new Date(appointment.info.appointmentTime).toLocaleString()}</div>
                    <div><span class="font-medium">目的:</span> ${appointment.info.purpose}</div>
                </div>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">狀態信息</h4>
                <div class="text-sm">
                    <div class="mb-2"><span class="font-medium">當前狀態:</span> <span class="px-2 py-1 rounded text-xs bg-green-200">${appointment.tag}</span></div>
                    <div><span class="font-medium">建立時間:</span> ${new Date(appointment.requestedAt).toLocaleString()}</div>
                    ${appointment.confirmedAt ? `<div><span class="font-medium">確認時間:</span> ${new Date(appointment.confirmedAt).toLocaleString()}</div>` : ''}
                    ${appointment.checkedInAt ? `<div><span class="font-medium">報到時間:</span> ${new Date(appointment.checkedInAt).toLocaleString()}</div>` : ''}
                </div>
            </div>
            
            <div class="mt-6 pt-4 border-t border-gray-200">
                <button onclick="deleteAppointment('${appointment.info.id}')" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
                    刪除預約
                </button>
            </div>
        </div>
    `;

    showModal(`預約詳細信息 - ${appointmentId}`, content);
}

async function showPrescriptionDetail(prescriptionId) {
    const prescription = allPrescriptions.find(p => p.info.id === prescriptionId);
    if (!prescription) return;

    const patient = allPatients.find(p => p.info.id === prescription.info.patientId);
    const patientName = patient ? patient.info.name : '未知';

    const content = `
        <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">處方信息</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><span class="font-medium">處方 ID:</span> ${prescription.info.id}</div>
                    <div><span class="font-medium">患者:</span> ${patientName} (${prescription.info.patientId})</div>
                    <div><span class="font-medium">醫師 ID:</span> ${prescription.info.doctorId}</div>
                    <div><span class="font-medium">開立時間:</span> ${new Date(prescription.createdAt).toLocaleString()}</div>
                </div>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">藥物信息</h4>
                <div class="space-y-3">
                    ${prescription.info.items.map(item => `
                        <div class="border-l-4 border-yellow-400 pl-3">
                            <div class="font-medium">${item.medication.name}</div>
                            <div class="text-sm text-gray-600">劑量: ${item.dosage} | 頻率: ${item.frequency} | 療程: ${item.duration}</div>
                            <div class="text-sm text-gray-600">用法: ${item.route} | 指示: ${item.instructions}</div>
                        </div>
                    `).join('')}
                    ${prescription.info.notes ? `<div class="text-sm text-gray-500 mt-2">備註: ${prescription.info.notes}</div>` : ''}
                </div>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">狀態信息</h4>
                <div class="text-sm">
                    <div class="mb-2"><span class="font-medium">當前狀態:</span> <span class="px-2 py-1 rounded text-xs bg-blue-200">${prescription.tag}</span></div>
                    ${prescription.submittedAt ? `<div><span class="font-medium">送出時間:</span> ${new Date(prescription.submittedAt).toLocaleString()}</div>` : ''}
                    ${prescription.preparationStartedAt ? `<div><span class="font-medium">調劑開始:</span> ${new Date(prescription.preparationStartedAt).toLocaleString()}</div>` : ''}
                    ${prescription.preparedAt ? `<div><span class="font-medium">調劑完成:</span> ${new Date(prescription.preparedAt).toLocaleString()}</div>` : ''}
                    ${prescription.dispensedAt ? `<div><span class="font-medium">發藥時間:</span> ${new Date(prescription.dispensedAt).toLocaleString()}</div>` : ''}
                </div>
            </div>
            
            <div class="mt-6 pt-4 border-t border-gray-200">
                <button onclick="deletePrescription('${prescription.info.id}')" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
                    刪除處方
                </button>
            </div>
        </div>
    `;

    showModal(`處方詳細信息 - ${prescriptionId}`, content);
}

async function showServiceDetail(serviceId) {
    const service = allServices.find(s => s.info.id === serviceId);
    if (!service) return;

    const patient = allPatients.find(p => p.info.id === service.info.patientId);
    const patientName = patient ? patient.info.name : '未知';

    const content = `
        <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">服務信息</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><span class="font-medium">服務 ID:</span> ${service.info.id}</div>
                    <div><span class="font-medium">患者:</span> ${patientName} (${service.info.patientId})</div>
                    <div><span class="font-medium">服務名稱:</span> ${service.info.serviceName}</div>
                    <div><span class="font-medium">服務類型:</span> ${service.info.serviceType}</div>
                    <div><span class="font-medium">優先度:</span> ${service.info.priority}</div>
                    <div><span class="font-medium">預估時間:</span> ${service.info.estimatedDuration} 分鐘</div>
                    <div><span class="font-medium">請求者:</span> ${service.info.requestedBy}</div>
                    <div><span class="font-medium">備註:</span> ${service.info.notes}</div>
                </div>
            </div>
            
            <div class="bg-purple-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">狀態信息</h4>
                <div class="text-sm">
                    <div class="mb-2"><span class="font-medium">當前狀態:</span> <span class="px-2 py-1 rounded text-xs bg-purple-200">${service.tag}</span></div>
                    <div><span class="font-medium">請求時間:</span> ${new Date(service.requestedAt).toLocaleString()}</div>
                    ${service.scheduledAt ? `<div><span class="font-medium">排程時間:</span> ${new Date(service.scheduledAt).toLocaleString()}</div>` : ''}
                    ${service.preparationStartedAt ? `<div><span class="font-medium">準備開始:</span> ${new Date(service.preparationStartedAt).toLocaleString()}</div>` : ''}
                    ${service.startedAt ? `<div><span class="font-medium">服務開始:</span> ${new Date(service.startedAt).toLocaleString()}</div>` : ''}
                    ${service.completedAt ? `<div><span class="font-medium">服務完成:</span> ${new Date(service.completedAt).toLocaleString()}</div>` : ''}
                </div>
            </div>
            
            ${service.results ? `
                <div class="bg-green-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-3">服務結果</h4>
                    <div class="text-sm">
                        <div class="mb-2"><span class="font-medium">檢查結果:</span> ${service.results}</div>
                        ${service.actualDuration ? `<div class="mb-2"><span class="font-medium">實際用時:</span> ${service.actualDuration} 分鐘</div>` : ''}
                        ${service.followUpInstructions ? `<div><span class="font-medium">後續指示:</span> ${service.followUpInstructions}</div>` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div class="mt-6 pt-4 border-t border-gray-200">
                <button onclick="deleteService('${service.info.id}')" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
                    刪除服務
                </button>
            </div>
        </div>
    `;

    showModal(`醫療服務詳細信息 - ${service.info.serviceName}`, content);
}

// ========== 病患管理 ==========
async function loadPatients() {
    const result = await apiRequest(`${API_BASE}/patients`);
    if (result.success) {
        allPatients = result.data;
        displayPatients(result.data);
    }
}

function displayPatients(patients) {
    const tbody = document.getElementById('patientTableBody');
    tbody.innerHTML = '';
    
    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const statusColor = {
            'Registered': 'bg-blue-100 text-blue-800',
            'Admitted': 'bg-green-100 text-green-800',
            'Discharged': 'bg-gray-100 text-gray-800'
        }[patient.tag] || 'bg-gray-100 text-gray-800';
        
        row.innerHTML = `
            <td class="px-4 py-2 font-mono text-sm cursor-pointer hover:text-blue-600" onclick="showPatientDetail('${patient.info.id}')">${patient.info.id}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600" onclick="showPatientDetail('${patient.info.id}')">${patient.info.name}</td>
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

function getPatientActions(patient) {
    const actions = [];
    
    if (patient.tag === 'Registered') {
        actions.push(`<button onclick="admitPatient('${patient.info.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">入院</button>`);
    }
    
    if (patient.tag === 'Admitted') {
        actions.push(`<button onclick="dischargePatient('${patient.info.id}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">出院</button>`);
    }
    
    return actions.join(' ');
}

async function admitPatient(patientId) {
    const wardNumber = prompt('病房號碼:', 'ward-101');
    const bedNumber = prompt('床位號碼:', 'bed-05');
    const doctorId = prompt('主治醫師 ID:', 'doc-001');
    
    if (wardNumber && bedNumber && doctorId) {
        const result = await apiRequest(`${API_BASE}/patients/${patientId}/admit`, {
            method: 'POST',
            body: JSON.stringify({
                wardNumber,
                bedNumber,
                attendingDoctorId: doctorId
            })
        });
        
        if (result.success) {
            showMessage('病患入院成功', 'success');
            loadPatients();
        } else {
            showMessage(`入院失敗: ${result.error.message}`, 'error');
        }
    }
}

async function dischargePatient(patientId) {
    const summary = prompt('出院摘要:', '病情穩定，可以出院');
    const followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    if (summary) {
        const result = await apiRequest(`${API_BASE}/patients/${patientId}/discharge`, {
            method: 'POST',
            body: JSON.stringify({
                summary,
                followUpDate
            })
        });
        
        if (result.success) {
            showMessage('病患出院成功', 'success');
            loadPatients();
        } else {
            showMessage(`出院失敗: ${result.error.message}`, 'error');
        }
    }
}

// ========== 預約系統 ==========
async function loadAppointments() {
    const result = await apiRequest(`${API_BASE}/appointments`);
    if (result.success) {
        allAppointments = result.data;
        displayAppointments(result.data);
    }
}

function displayAppointments(appointments) {
    const tbody = document.getElementById('appointmentTableBody');
    tbody.innerHTML = '';
    
    appointments.forEach(appointment => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const statusColor = {
            'Requested': 'bg-yellow-100 text-yellow-800',
            'Confirmed': 'bg-blue-100 text-blue-800',
            'CheckedIn': 'bg-green-100 text-green-800',
            'InProgress': 'bg-purple-100 text-purple-800',
            'Completed': 'bg-gray-100 text-gray-800'
        }[appointment.tag] || 'bg-gray-100 text-gray-800';
        
        row.innerHTML = `
            <td class="px-4 py-2 font-mono text-sm cursor-pointer hover:text-blue-600" onclick="showAppointmentDetail('${appointment.info.id}')">${appointment.info.id}</td>
            <td class="px-4 py-2 font-mono text-sm cursor-pointer hover:text-blue-600" onclick="showAppointmentDetail('${appointment.info.id}')">${appointment.info.patientId}</td>
            <td class="px-4 py-2">
                <span class="px-2 py-1 rounded-full text-xs ${statusColor}">
                    ${appointment.tag}
                </span>
            </td>
            <td class="px-4 py-2">
                ${getAppointmentActions(appointment)}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function getAppointmentActions(appointment) {
    const actions = [];
    
    if (appointment.tag === 'Requested') {
        actions.push(`<button onclick="confirmAppointment('${appointment.info.id}')" class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">確認</button>`);
    }
    
    if (appointment.tag === 'Confirmed') {
        actions.push(`<button onclick="checkinAppointment('${appointment.info.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">報到</button>`);
    }
    
    if (appointment.tag === 'CheckedIn') {
        actions.push(`<button onclick="startAppointment('${appointment.info.id}')" class="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600">開始</button>`);
    }
    
    if (appointment.tag === 'InProgress') {
        actions.push(`<button onclick="completeAppointment('${appointment.info.id}')" class="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600">完成</button>`);
    }
    
    return actions.join(' ');
}

async function confirmAppointment(appointmentId) {
    const confirmationNumber = `CONF-${Date.now()}`;
    
    const result = await apiRequest(`${API_BASE}/appointments/${appointmentId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ confirmationNumber })
    });
    
    if (result.success) {
        showMessage('預約確認成功', 'success');
        loadAppointments();
    } else {
        showMessage(`確認失敗: ${result.error.message}`, 'error');
    }
}

async function checkinAppointment(appointmentId) {
    const result = await apiRequest(`${API_BASE}/appointments/${appointmentId}/checkin`, {
        method: 'POST'
    });
    
    if (result.success) {
        showMessage('報到成功', 'success');
        loadAppointments();
    } else {
        showMessage(`報到失敗: ${result.error.message}`, 'error');
    }
}

async function startAppointment(appointmentId) {
    const result = await apiRequest(`${API_BASE}/appointments/${appointmentId}/start`, {
        method: 'POST'
    });
    
    if (result.success) {
        showMessage('預約開始', 'success');
        loadAppointments();
    } else {
        showMessage(`開始失敗: ${result.error.message}`, 'error');
    }
}

async function completeAppointment(appointmentId) {
    const followUpNeeded = confirm('是否需要後續追蹤？');
    const notes = prompt('備註:', '病患已完成所有檢查和治療');
    
    const result = await apiRequest(`${API_BASE}/appointments/${appointmentId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
            followUpNeeded,
            notes
        })
    });
    
    if (result.success) {
        showMessage('預約完成', 'success');
        loadAppointments();
    } else {
        showMessage(`完成失敗: ${result.error.message}`, 'error');
    }
}

// ========== 處方管理 ==========
async function loadPrescriptions() {
    const result = await apiRequest(`${API_BASE}/prescriptions`);
    if (result.success) {
        allPrescriptions = result.data;
        displayPrescriptions(result.data);
    }
}

function displayPrescriptions(prescriptions) {
    const tbody = document.getElementById('prescriptionTableBody');
    tbody.innerHTML = '';
    
    prescriptions.forEach(prescription => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const statusColor = {
            'Created': 'bg-yellow-100 text-yellow-800',
            'Submitted': 'bg-blue-100 text-blue-800',
            'InPreparation': 'bg-purple-100 text-purple-800',
            'Prepared': 'bg-green-100 text-green-800',
            'Dispensed': 'bg-gray-100 text-gray-800'
        }[prescription.tag] || 'bg-gray-100 text-gray-800';
        
        row.innerHTML = `
            <td class="px-4 py-2 font-mono text-sm cursor-pointer hover:text-blue-600" onclick="showPrescriptionDetail('${prescription.info.id}')">${prescription.info.id}</td>
            <td class="px-4 py-2 font-mono text-sm cursor-pointer hover:text-blue-600" onclick="showPrescriptionDetail('${prescription.info.id}')">${prescription.info.patientId}</td>
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

function getPrescriptionActions(prescription) {
    const actions = [];
    
    if (prescription.tag === 'Created') {
        actions.push(`<button onclick="submitPrescription('${prescription.info.id}')" class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">送出</button>`);
    }
    
    if (prescription.tag === 'Submitted') {
        actions.push(`<button onclick="startPreparingPrescription('${prescription.info.id}')" class="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600">調劑</button>`);
    }
    
    if (prescription.tag === 'InPreparation') {
        actions.push(`<button onclick="completePreparingPrescription('${prescription.info.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">完成</button>`);
    }
    
    if (prescription.tag === 'Prepared') {
        actions.push(`<button onclick="dispensePrescription('${prescription.info.id}')" class="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600">發藥</button>`);
    }
    
    return actions.join(' ');
}

async function submitPrescription(prescriptionId) {
    const result = await apiRequest(`${API_BASE}/prescriptions/${prescriptionId}/submit`, {
        method: 'POST'
    });
    
    if (result.success) {
        showMessage('處方送出成功', 'success');
        loadPrescriptions();
    } else {
        showMessage(`送出失敗: ${result.error.message}`, 'error');
    }
}

async function startPreparingPrescription(prescriptionId) {
    const pharmacistId = prompt('藥師 ID:', 'pharm-001');
    
    if (pharmacistId) {
        const result = await apiRequest(`${API_BASE}/prescriptions/${prescriptionId}/start-preparation`, {
            method: 'POST',
            body: JSON.stringify({ pharmacistId })
        });
        
        if (result.success) {
            showMessage('開始調劑', 'success');
            loadPrescriptions();
        } else {
            showMessage(`調劑失敗: ${result.error.message}`, 'error');
        }
    }
}

async function completePreparingPrescription(prescriptionId) {
    const preparationNotes = prompt('調劑備註:', '已確認藥物劑量和交互作用');
    
    if (preparationNotes) {
        const result = await apiRequest(`${API_BASE}/prescriptions/${prescriptionId}/complete-preparing`, {
            method: 'POST',
            body: JSON.stringify({ preparationNotes })
        });
        
        if (result.success) {
            showMessage('調劑完成', 'success');
            loadPrescriptions();
        } else {
            showMessage(`完成失敗: ${result.error.message}`, 'error');
        }
    }
}

async function dispensePrescription(prescriptionId) {
    const dispensedBy = prompt('發藥人員 ID:', 'pharm-001');
    const instructions = prompt('發藥指示:', '請按照指示服用藥物，如有不適請立即聯繫醫生');
    
    if (dispensedBy && instructions) {
        const result = await apiRequest(`${API_BASE}/prescriptions/${prescriptionId}/dispense`, {
            method: 'POST',
            body: JSON.stringify({
                dispensedBy,
                instructions
            })
        });
        
        if (result.success) {
            showMessage('發藥完成', 'success');
            loadPrescriptions();
        } else {
            showMessage(`發藥失敗: ${result.error.message}`, 'error');
        }
    }
}

// ========== 刪除功能 ==========
async function deletePatient(patientId) {
    if (!confirm('確定要刪除此患者嗎？此操作無法撤銷。')) {
        return;
    }
    
    const result = await apiRequest(`${API_BASE}/patients/${patientId}`, {
        method: 'DELETE'
    });
    
    if (result.success) {
        showMessage('患者已刪除', 'success');
        hideModal();
        loadPatients();
    } else {
        showMessage(`刪除失敗: ${result.error.message}`, 'error');
    }
}

async function deleteAppointment(appointmentId) {
    if (!confirm('確定要刪除此預約嗎？此操作無法撤銷。')) {
        return;
    }
    
    const result = await apiRequest(`${API_BASE}/appointments/${appointmentId}`, {
        method: 'DELETE'
    });
    
    if (result.success) {
        showMessage('預約已刪除', 'success');
        hideModal();
        loadAppointments();
    } else {
        showMessage(`刪除失敗: ${result.error.message}`, 'error');
    }
}

async function deletePrescription(prescriptionId) {
    if (!confirm('確定要刪除此處方嗎？此操作無法撤銷。')) {
        return;
    }
    
    const result = await apiRequest(`${API_BASE}/prescriptions/${prescriptionId}`, {
        method: 'DELETE'
    });
    
    if (result.success) {
        showMessage('處方已刪除', 'success');
        hideModal();
        loadPrescriptions();
    } else {
        showMessage(`刪除失敗: ${result.error.message}`, 'error');
    }
}

async function deleteService(serviceId) {
    if (!confirm('確定要刪除此醫療服務嗎？此操作無法撤銷。')) {
        return;
    }
    
    const result = await apiRequest(`${API_BASE}/services/${serviceId}`, {
        method: 'DELETE'
    });
    
    if (result.success) {
        showMessage('醫療服務已刪除', 'success');
        hideModal();
        loadServices();
    } else {
        showMessage(`刪除失敗: ${result.error.message}`, 'error');
    }
}

// ========== 醫療服務 ==========
async function loadServices() {
    const result = await apiRequest(`${API_BASE}/services`);
    if (result.success) {
        allServices = result.data;
        displayServices(result.data);
    }
}

function displayServices(services) {
    const tbody = document.getElementById('serviceTableBody');
    tbody.innerHTML = '';
    
    services.forEach(service => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const statusColor = {
            'Requested': 'bg-yellow-100 text-yellow-800',
            'Scheduled': 'bg-blue-100 text-blue-800',
            'InPreparation': 'bg-purple-100 text-purple-800',
            'InProgress': 'bg-green-100 text-green-800',
            'Completed': 'bg-gray-100 text-gray-800'
        }[service.tag] || 'bg-gray-100 text-gray-800';
        
        row.innerHTML = `
            <td class="px-4 py-2 font-mono text-sm cursor-pointer hover:text-blue-600" onclick="showServiceDetail('${service.info.id}')">${service.info.id}</td>
            <td class="px-4 py-2 font-mono text-sm cursor-pointer hover:text-blue-600" onclick="showServiceDetail('${service.info.id}')">${service.info.patientId}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600" onclick="showServiceDetail('${service.info.id}')">${service.info.serviceName}</td>
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

function getServiceActions(service) {
    const actions = [];
    
    if (service.tag === 'Requested') {
        actions.push(`<button onclick="scheduleService('${service.info.id}')" class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">排程</button>`);
    }
    
    if (service.tag === 'Scheduled') {
        actions.push(`<button onclick="startPreparingService('${service.info.id}')" class="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600">準備</button>`);
    }
    
    if (service.tag === 'InPreparation') {
        actions.push(`<button onclick="startService('${service.info.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">開始</button>`);
    }
    
    if (service.tag === 'InProgress') {
        actions.push(`<button onclick="completeService('${service.info.id}')" class="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600">完成</button>`);
    }
    
    return actions.join(' ');
}

async function scheduleService(serviceId) {
    const scheduledTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const scheduledBy = prompt('排程人員 ID:', 'staff-001');
    const location = prompt('地點:', 'Room 305');
    
    if (scheduledBy && location) {
        const result = await apiRequest(`${API_BASE}/services/${serviceId}/schedule`, {
            method: 'POST',
            body: JSON.stringify({
                scheduledTime,
                scheduledBy,
                location,
                staff: [
                    {
                        id: 'staff-002',
                        name: '張醫師',
                        birthDate: '1980-01-01',
                        gender: 'Male',
                        contactNumber: '0900000000',
                        staffType: 'Doctor',
                        department: 'Radiology',
                        specialization: 'Radiology',
                        licenseNumber: 'LIC-DOCTOR-002'
                    }
                ]
            })
        });
        
        if (result.success) {
            showMessage('服務排程成功', 'success');
            loadServices();
        } else {
            showMessage(`排程失敗: ${result.error.message}`, 'error');
        }
    }
}

async function startPreparingService(serviceId) {
    const location = prompt('準備地點:', 'Room 305');
    const preparationNotes = prompt('準備備註:', '準備 X 光設備');
    
    if (location && preparationNotes) {
        const result = await apiRequest(`${API_BASE}/services/${serviceId}/start-preparation`, {
            method: 'POST',
            body: JSON.stringify({
                location,
                preparationNotes,
                staff: [
                    {
                        id: 'staff-003',
                        name: '李技師',
                        birthDate: '1988-02-02',
                        gender: 'Female',
                        contactNumber: '0900000001',
                        staffType: 'LabTechnician',
                        department: 'Radiology',
                        specialization: 'Imaging',
                        licenseNumber: 'LIC-TECH-003'
                    }
                ]
            })
        });
        
        if (result.success) {
            showMessage('開始準備服務', 'success');
            loadServices();
        } else {
            showMessage(`準備失敗: ${result.error.message}`, 'error');
        }
    }
}

async function startService(serviceId) {
    const serviceNotes = ['病患已就位', '開始檢查'];
    
    const result = await apiRequest(`${API_BASE}/services/${serviceId}/start`, {
        method: 'POST',
        body: JSON.stringify({
            serviceNotes,
            performingStaff: [
                {
                    id: 'staff-002',
                    name: '張醫師',
                    birthDate: '1980-01-01',
                    gender: 'Male',
                    contactNumber: '0900000000',
                    staffType: 'Doctor',
                    department: 'Radiology',
                    specialization: 'Radiology',
                    licenseNumber: 'LIC-DOCTOR-002'
                }
            ]
        })
    });
    
    if (result.success) {
        showMessage('服務開始', 'success');
        loadServices();
    } else {
        showMessage(`開始失敗: ${result.error.message}`, 'error');
    }
}

async function completeService(serviceId) {
    const results = prompt('檢查結果:', 'X 光檢查完成，未發現異常');
    const actualDuration = parseInt(prompt('實際用時 (分鐘):', '40'));
    const followUpInstructions = prompt('後續指示:', '建議一週後複查');
    
    if (results && actualDuration && followUpInstructions) {
        const result = await apiRequest(`${API_BASE}/services/${serviceId}/complete`, {
            method: 'POST',
            body: JSON.stringify({
                results,
                actualDuration,
                followUpInstructions
            })
        });
        
        if (result.success) {
            showMessage('服務完成', 'success');
            loadServices();
        } else {
            showMessage(`完成失敗: ${result.error.message}`, 'error');
        }
    }
}

// ========== 事件監聽器 ==========
patientBtn.addEventListener('click', () => {
    showPanel('patient');
    loadPatients();
});

appointmentBtn.addEventListener('click', () => {
    showPanel('appointment');
    loadAppointments();
    loadPatientOptions('appointmentPatientId');
});

prescriptionBtn.addEventListener('click', () => {
    showPanel('prescription');
    loadPrescriptions();
    loadPatientOptions('prescriptionPatientId');
});

serviceBtn.addEventListener('click', () => {
    showPanel('service');
    loadServices();
    loadPatientOptions('servicePatientId');
});

// 表單提交處理
document.getElementById('patientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const patientInfo = {
        id: `pt-${Date.now()}`,
        name: document.getElementById('patientName').value,
        birthDate: document.getElementById('patientBirthDate').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        contactNumber: document.getElementById('patientPhone').value,
        address: {
            street: document.getElementById('patientAddress').value,
            city: '台北市',
            state: '信義區',
            postalCode: '110',
            country: '台灣'
        }
    };
    
    const result = await apiRequest(`${API_BASE}/patients`, {
        method: 'POST',
        body: JSON.stringify({ patientInfo })
    });
    
    if (result.success) {
        showMessage('病患註冊成功', 'success');
        document.getElementById('patientForm').reset();
        loadPatients();
    } else {
        showMessage(`註冊失敗: ${result.error.message}`, 'error');
    }
});

document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const appointmentTime = new Date(document.getElementById('appointmentTime').value);
    const endTime = new Date(appointmentTime.getTime() + 30 * 60 * 1000);
    
    const appointmentData = {
        patientId: document.getElementById('appointmentPatientId').value,
        doctorId: document.getElementById('appointmentDoctorId').value,
        department: document.getElementById('appointmentDepartment').value,
        timeSlot: {
            start: appointmentTime.toISOString(),
            end: endTime.toISOString()
        },
        purpose: document.getElementById('appointmentPurpose').value
    };
    
    const result = await apiRequest(`${API_BASE}/appointments`, {
        method: 'POST',
        body: JSON.stringify(appointmentData)
    });
    
    if (result.success) {
        showMessage('預約建立成功', 'success');
        document.getElementById('appointmentForm').reset();
        loadAppointments();
    } else {
        showMessage(`預約失敗: ${result.error.message}`, 'error');
    }
});

document.getElementById('prescriptionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prescriptionData = {
        patientId: document.getElementById('prescriptionPatientId').value,
        doctorId: document.getElementById('prescriptionDoctorId').value,
        items: [
            {
                medicationId: 'med-001',
                medication: {
                    id: 'med-001',
                    name: document.getElementById('medicationName').value,
                    code: 'ASPIRIN',
                    dosageForm: '錠劑',
                    strength: '100mg'
                },
                dosage: document.getElementById('medicationDosage').value,
                frequency: document.getElementById('medicationFrequency').value,
                route: '口服',
                duration: document.getElementById('medicationDuration').value,
                instructions: '飯後服用'
            }
        ],
        notes: document.getElementById('prescriptionNotes').value
    };
    
    const result = await apiRequest(`${API_BASE}/prescriptions`, {
        method: 'POST',
        body: JSON.stringify(prescriptionData)
    });
    
    if (result.success) {
        showMessage('處方開立成功', 'success');
        document.getElementById('prescriptionForm').reset();
        loadPrescriptions();
    } else {
        showMessage(`開立失敗: ${result.error.message}`, 'error');
    }
});

document.getElementById('serviceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const serviceData = {
        patientId: document.getElementById('servicePatientId').value,
        serviceType: document.getElementById('serviceType').value,
        serviceName: document.getElementById('serviceName').value,
        priority: document.getElementById('servicePriority').value,
        estimatedDuration: parseInt(document.getElementById('serviceDuration').value),
        requestedBy: document.getElementById('serviceRequestedBy').value,
        requiredResources: ['X光機', '技術人員'],
        notes: document.getElementById('serviceNotes').value
    };
    
    const result = await apiRequest(`${API_BASE}/services`, {
        method: 'POST',
        body: JSON.stringify(serviceData)
    });
    
    if (result.success) {
        showMessage('服務請求成功', 'success');
        document.getElementById('serviceForm').reset();
        loadServices();
    } else {
        showMessage(`請求失敗: ${result.error.message}`, 'error');
    }
});

// 頁面載入時顯示歡迎面板
document.addEventListener('DOMContentLoaded', () => {
    showPanel('welcome');
});