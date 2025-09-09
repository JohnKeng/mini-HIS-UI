// 預約模組 - 處理預約/Dashboard相關功能

// 載入預約資料
async function loadAppointments() {
    if (window.utils?.ensureDoctorsLoaded) await window.utils.ensureDoctorsLoaded();
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
        
        const statusText = appointment.tag === 'Completed' ? '病歷' : appointment.tag;

        // 額外欄位（滑動查看更多）
        const doctor = window.utils.getDoctorDisplay(appointment.info?.doctorId);
        const purpose = appointment.info?.purpose || '-';
        const numberOrQueue = appointment.confirmationNumber || '-';
        const checkedInAt = appointment.checkedInAt ? new Date(appointment.checkedInAt).toLocaleString('zh-TW') : '-';
        const room = appointment.roomNumber || appointment.clinicRoom || '-';
        const createdAt = appointment.requestedAt ? new Date(appointment.requestedAt).toLocaleString('zh-TW') : '-';
        const notes = appointment.info?.notes || '-';
        const calledAt = appointment.startedAt ? new Date(appointment.startedAt).toLocaleString('zh-TW') : '-';

        const patientName = window.utils.getPatientName(appointment.info.patientId);
        const appointmentTime = appointment.info.timeSlot ? new Date(appointment.info.timeSlot.start).toLocaleString('zh-TW') : '未設定';

        // 不同表格的列模板
        const htmlCheckedIn = `
            <td class="px-4 py-2 sticky left-0 bg-white z-10 w-[260px]">
                <div class="font-medium cursor-pointer hover:text-blue-600" onclick="window.appointment.showAppointmentDetail('${appointment.info.id}')">${patientName}</div>
                <div class="text-xs text-slate-500 font-mono cursor-pointer hover:text-blue-600" onclick="window.appointment.showAppointmentDetail('${appointment.info.id}')">${appointment.info.patientId}</div>
            </td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm w-[140px]" onclick="window.appointment.showAppointmentDetail('${appointment.info.id}')">${appointment.info.department || '未設定'}</td>
            <td class="px-4 py-2 w-[140px]"><span class="px-2 py-1 rounded-full text-xs ${statusColor}">${statusText}</span></td>
            <td class="px-4 py-2 w-[180px]">${doctor}</td>
            <td class="px-4 py-2 w-[240px] truncate" title="${purpose}">${purpose}</td>
            <td class="px-4 py-2 w-[200px]">${calledAt}</td>
            <td class="px-4 py-2 w-[160px]">${room}</td>
            <td class="px-4 py-2 w-[200px]">${checkedInAt}</td>
            <td class="px-4 py-2 w-[220px] whitespace-nowrap">${appointmentTime}</td>
            <td class="px-4 py-2 w-[220px]">${createdAt}</td>
            <td class="px-4 py-2 w-[200px] truncate" title="${notes}">${notes}</td>
            <td class="px-4 py-2 sticky right-0 bg-white z-10 w-[180px]">${getAppointmentActions(appointment)}</td>`;

        const htmlAppointments = `
            <td class="px-4 py-2 sticky left-0 bg-white z-10 w-[260px]">
                <div class="font-medium cursor-pointer hover:text-blue-600" onclick="window.appointment.showAppointmentDetail('${appointment.info.id}')">${patientName}</div>
                <div class="text-xs text-slate-500 font-mono cursor-pointer hover:text-blue-600" onclick="window.appointment.showAppointmentDetail('${appointment.info.id}')">${appointment.info.patientId}</div>
            </td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm w-[140px]" onclick="window.appointment.showAppointmentDetail('${appointment.info.id}')">${appointment.info.department || '未設定'}</td>
            <td class="px-4 py-2 cursor-pointer hover:text-blue-600 text-sm w-[220px] whitespace-nowrap" onclick="window.appointment.showAppointmentDetail('${appointment.info.id}')">${appointmentTime}</td>
            <td class="px-4 py-2 w-[140px]"><span class="px-2 py-1 rounded-full text-xs ${statusColor}">${statusText}</span></td>
            <td class="px-4 py-2 w-[200px]">${doctor}</td>
            <td class="px-4 py-2 w-[240px] truncate" title="${purpose}">${purpose}</td>
            <td class="px-4 py-2 w-[220px]">${createdAt}</td>
            <td class="px-4 py-2 w-[200px] truncate" title="${notes}">${notes}</td>
            <td class="px-4 py-2 sticky right-0 bg-white z-10 w-[180px]">${getAppointmentActions(appointment)}</td>`;

        // 根據狀態決定添加到哪個表格
        if (checkedInStatuses.includes(appointment.tag)) {
            row.className = 'border-b hover:bg-blue-50';
            row.innerHTML = htmlCheckedIn;
            checkedInTbody.appendChild(row);
        } else if (appointmentStatuses.includes(appointment.tag)) {
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = htmlAppointments;
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
        actions.push(`<button onclick="window.appointment.startAppointment('${appointment.info.id}')" class="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600">叫號</button>`);
    }
    
    if (appointment.tag === 'InProgress') {
        actions.push(`<button onclick="window.appointment.openMedicalRecordAfterComplete('${appointment.info.id}')" class="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600">病歷</button>`);
    }
    
    if (appointment.tag === 'Completed') {
        actions.push(`<button onclick="window.appointment.openMedicalRecord('${appointment.info.patientId}', '${appointment.info.id}')" class="bg-gray-700 text-white px-3 py-1 rounded text-xs hover:bg-gray-800">病歷</button>`);
    }
    
    return actions.join(' ');
}

// 顯示預約詳細資訊
async function showAppointmentDetail(appointmentId) {
    if (window.utils?.ensureDoctorsLoaded) await window.utils.ensureDoctorsLoaded();
    const appointment = window.utils.allAppointments.find(a => a.info.id === appointmentId);
    if (!appointment) return;

    const patientName = window.utils.getPatientName(appointment.info.patientId);
    const doctorDisplay = window.utils.getDoctorDisplay(appointment.info.doctorId);
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
                    <div><span class="font-medium">醫師:</span> ${doctorDisplay}</div>
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
                    刪除
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

// 完成預約後開啟病歷頁
async function openMedicalRecordAfterComplete(appointmentId) {
    const appt = window.utils.allAppointments.find(a => a.info.id === appointmentId);
    const patientId = appt?.info?.patientId;
    const result = await window.api.apiRequest(`${window.api.API_BASE}/appointments/${appointmentId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ followUpNeeded: false, notes: '' })
    });
    if (result.success) {
        window.ui.showMessage('預約完成，開啟病歷', 'success');
        window.appointment.openMedicalRecord(patientId, appointmentId);
        loadAppointments();
    } else {
        window.ui.showMessage(`完成失敗: ${result.error.message}`, 'error');
    }
}

// 直接開啟病歷頁
function openMedicalRecord(patientId, appointmentId) {
    const url = `medical-record.html?patientId=${encodeURIComponent(patientId)}&appointmentId=${encodeURIComponent(appointmentId)}`;
    window.location.href = url;
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
    deleteAppointment,
    openCreateModal,
    openMedicalRecord,
    openMedicalRecordAfterComplete
};

// 以彈窗方式新增預約
function openCreateModal() {
    const startValue = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0,16);
    const content = `
        <form id="appointmentCreateForm" class="space-y-4" aria-label="新增預約表單">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="newAppointmentPatientId" class="block text-sm font-medium mb-1">選擇患者</label>
                    <input type="text" id="newAppointmentPatientId" list="newAppointmentPatientList" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <datalist id="newAppointmentPatientList"></datalist>
                </div>
                <div>
                    <label for="newAppointmentDoctorId" class="block text-sm font-medium mb-1">選擇醫師</label>
                    <input id="newAppointmentDoctorId" type="text" list="newAppointmentDoctorList" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <datalist id="newAppointmentDoctorList"></datalist>
                </div>
                <div>
                    <label for="newAppointmentDepartment" class="block text-sm font-medium mb-1">科別</label>
                    <select id="newAppointmentDepartment" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                        <option value="">請選擇</option>
                        <option value="General">一般科</option>
                        <option value="Cardiology">心臟科</option>
                        <option value="Neurology">神經科</option>
                        <option value="Orthopedics">骨科</option>
                    </select>
                </div>
                <div>
                    <label for="newAppointmentTime" class="block text-sm font-medium mb-1">預約時間</label>
                    <input id="newAppointmentTime" type="datetime-local" value="${startValue}" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div class="md:col-span-2">
                    <label for="newAppointmentPurpose" class="block text-sm font-medium mb-1">目的</label>
                    <input id="newAppointmentPurpose" type="text" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
            </div>
            <div class="flex justify-end space-x-3 pt-2">
                <button type="button" class="px-4 py-2 rounded border" onclick="window.ui.hideModal()">取消</button>
                <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">新增</button>
            </div>
        </form>
    `;
    window.ui.showModal('新增預約', content);
    if (window.utils?.loadPatientOptions) window.utils.loadPatientOptions('newAppointmentPatientList');
    if (window.utils?.loadDoctorOptions) window.utils.loadDoctorOptions('newAppointmentDoctorList');

    const input = document.getElementById('newAppointmentPatientId');
    const datalist = document.getElementById('newAppointmentPatientList');
    if (input && datalist) {
        input.addEventListener('change', () => {
            const opt = datalist.querySelector(`option[value="${input.value}"]`);
            if (opt) input.value = opt.getAttribute('data-id') || input.value;
        });
    }
    const docInput = document.getElementById('newAppointmentDoctorId');
    const docList = document.getElementById('newAppointmentDoctorList');
    if (docInput && docList) {
        docInput.addEventListener('change', () => {
            const opt = docList.querySelector(`option[value="${docInput.value}"]`);
            if (opt) docInput.value = opt.getAttribute('data-id') || docInput.value;
        });
    }

    document.getElementById('appointmentCreateForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const startISO = new Date(document.getElementById('newAppointmentTime').value).toISOString();
        const endISO = new Date(new Date(document.getElementById('newAppointmentTime').value).getTime() + 30 * 60000).toISOString();
        const payload = {
            patientId: input.value,
            doctorId: document.getElementById('newAppointmentDoctorId').value,
            department: document.getElementById('newAppointmentDepartment').value,
            timeSlot: { start: startISO, end: endISO },
            purpose: document.getElementById('newAppointmentPurpose').value
        };
        const result = await window.api.apiRequest(`${window.api.API_BASE}/appointments`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (result.success) {
            window.ui.showMessage('預約建立成功', 'success');
            window.ui.hideModal();
            loadAppointments();
        } else {
            window.ui.showMessage(`預約失敗: ${result.error.message}`, 'error');
        }
    });
}
