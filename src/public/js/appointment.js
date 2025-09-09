// 預約模組 - 處理預約/Dashboard相關功能

// 載入預約資料
async function loadAppointments() {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/appointments`);
    if (result.success) {
        window.utils.allAppointments = result.data;
        displayAppointments(result.data);
    }
}

// 顯示預約列表
function displayAppointments(appointments) {
    const checkedInTbody = document.getElementById('checkedInTableBody');
    const appointmentTbody = document.getElementById('appointmentTableBody');
    
    // 清空兩個表格
    checkedInTbody.innerHTML = '';
    appointmentTbody.innerHTML = '';
    
    // 根據狀態分類預約
    const checkedInStatuses = ['CheckedIn', 'InProgress', 'Completed'];
    const appointmentStatuses = ['Requested', 'Confirmed'];
    
    appointments.forEach(appointment => {
        const row = document.createElement('tr');
        
        const statusColor = {
            'Requested': 'bg-blue-100 text-blue-700 border border-blue-300',
            'Confirmed': 'bg-blue-200 text-blue-800 border border-blue-400',
            'CheckedIn': 'bg-blue-500 text-white border border-blue-500',
            'InProgress': 'bg-blue-700 text-white border border-blue-700',
            'Completed': 'bg-blue-900 text-white border border-blue-900'
        }[appointment.tag] || 'bg-blue-100 text-blue-800 border border-blue-300';
        
        const patientName = window.utils.getPatientName(appointment.info.patientId);
        const appointmentTime = appointment.info.timeSlot ? 
            new Date(appointment.info.timeSlot.start).toLocaleString('zh-TW') : '未設定';
        
        row.innerHTML = `
            <td class="px-4 py-2 font-mono text-sm cursor-pointer hover:text-blue-600" onclick="window.appointment.showAppointmentDetail('${appointment.info.id}')">${appointment.info.patientId}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 font-medium" onclick="window.appointment.showAppointmentDetail('${appointment.info.id}')">${patientName}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm" onclick="window.appointment.showAppointmentDetail('${appointment.info.id}')">${appointment.info.department || '未設定'}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm" onclick="window.appointment.showAppointmentDetail('${appointment.info.id}')">${appointmentTime}</td>
            <td class="px-4 py-2">
                <span class="px-2 py-1 rounded-full text-xs ${statusColor}">
                    ${appointment.tag}
                </span>
            </td>
            <td class="px-4 py-2">
                ${getAppointmentActions(appointment)}
            </td>
        `;
        
        // 根據狀態決定添加到哪個表格
        if (checkedInStatuses.includes(appointment.tag)) {
            row.className = 'border-b hover:bg-blue-50';
            checkedInTbody.appendChild(row);
        } else if (appointmentStatuses.includes(appointment.tag)) {
            row.className = 'border-b hover:bg-gray-50';
            appointmentTbody.appendChild(row);
        }
    });
}

// 獲取預約操作按鈕
function getAppointmentActions(appointment) {
    const actions = [];
    
    if (appointment.tag === 'Requested') {
        actions.push(`<button onclick="window.appointment.confirmAppointment('${appointment.info.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">確認</button>`);
    }
    
    if (appointment.tag === 'Confirmed') {
        actions.push(`<button onclick="window.appointment.checkinAppointment('${appointment.info.id}')" class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">報到</button>`);
    }
    
    if (appointment.tag === 'CheckedIn') {
        actions.push(`<button onclick="window.appointment.startAppointment('${appointment.info.id}')" class="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600">開始</button>`);
    }
    
    if (appointment.tag === 'InProgress') {
        actions.push(`<button onclick="window.appointment.completeAppointment('${appointment.info.id}')" class="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600">完成</button>`);
    }
    
    return actions.join(' ');
}

// 顯示預約詳細資訊
async function showAppointmentDetail(appointmentId) {
    const appointment = window.utils.allAppointments.find(a => a.info.id === appointmentId);
    if (!appointment) return;

    const patientName = window.utils.getPatientName(appointment.info.patientId);
    const timeSlot = appointment.info.timeSlot ? {
        start: new Date(appointment.info.timeSlot.start).toLocaleString(),
        end: new Date(appointment.info.timeSlot.end).toLocaleString()
    } : { start: '未設定', end: '未設定' };

    const statusHistory = appointment.statusHistory?.map(status => 
        `<div class="mb-1"><span class="font-medium">${status.status}:</span> ${new Date(status.timestamp).toLocaleString()}</div>`
    ).join('') || '<div>無狀態歷史</div>';

    const content = `
        <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">預約信息</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><span class="font-medium">預約 ID:</span> ${appointment.info.id}</div>
                    <div><span class="font-medium">患者 ID:</span> ${appointment.info.patientId}</div>
                    <div><span class="font-medium">患者姓名:</span> ${patientName}</div>
                    <div><span class="font-medium">醫生 ID:</span> ${appointment.info.doctorId}</div>
                    <div><span class="font-medium">科別:</span> ${appointment.info.department}</div>
                    <div><span class="font-medium">當前狀態:</span> ${appointment.tag}</div>
                </div>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">時間信息</h4>
                <div class="text-sm space-y-2">
                    <div><span class="font-medium">開始時間:</span> ${timeSlot.start}</div>
                    <div><span class="font-medium">結束時間:</span> ${timeSlot.end}</div>
                    <div><span class="font-medium">建立時間:</span> ${new Date(appointment.createdAt).toLocaleString()}</div>
                </div>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3">狀態歷史</h4>
                <div class="text-sm">
                    ${statusHistory}
                </div>
            </div>
            <div class="mt-6 flex justify-end">
                <button onclick="window.appointment.deleteAppointment('${appointment.info.id}'); window.ui.hideModal();" class="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold">
                    刪除預約
                </button>
            </div>
        </div>
    `;

    window.ui.showModal('預約詳細資訊', content);
}

// 確認預約
async function confirmAppointment(appointmentId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/appointments/${appointmentId}/confirm`, {
        method: 'POST'
    });
    
    if (result.success) {
        window.ui.showMessage('預約確認成功', 'success');
        loadAppointments();
    } else {
        window.ui.showMessage(`確認失敗: ${result.error.message}`, 'error');
    }
}

// 預約報到
async function checkinAppointment(appointmentId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/appointments/${appointmentId}/checkin`, {
        method: 'POST'
    });
    
    if (result.success) {
        window.ui.showMessage('報到成功', 'success');
        loadAppointments();
    } else {
        window.ui.showMessage(`報到失敗: ${result.error.message}`, 'error');
    }
}

// 開始預約
async function startAppointment(appointmentId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/appointments/${appointmentId}/start`, {
        method: 'POST'
    });
    
    if (result.success) {
        window.ui.showMessage('預約開始', 'success');
        loadAppointments();
    } else {
        window.ui.showMessage(`開始失敗: ${result.error.message}`, 'error');
    }
}

// 完成預約
async function completeAppointment(appointmentId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/appointments/${appointmentId}/complete`, {
        method: 'POST'
    });
    
    if (result.success) {
        window.ui.showMessage('預約完成', 'success');
        loadAppointments();
    } else {
        window.ui.showMessage(`完成失敗: ${result.error.message}`, 'error');
    }
}

// 刪除預約
async function deleteAppointment(appointmentId) {
    if (!confirm('確定要刪除此預約嗎？')) return;
    
    const result = await window.api.apiRequest(`${window.api.API_BASE}/appointments/${appointmentId}`, {
        method: 'DELETE'
    });
    
    if (result.success) {
        window.ui.showMessage('預約刪除成功', 'success');
        loadAppointments();
    } else {
        window.ui.showMessage(`刪除失敗: ${result.error.message}`, 'error');
    }
}

// 導出預約模組函數
window.appointment = {
    loadAppointments,
    displayAppointments,
    showAppointmentDetail,
    confirmAppointment,
    checkinAppointment,
    startAppointment,
    completeAppointment,
    deleteAppointment
};