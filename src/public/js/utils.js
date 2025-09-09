// 工具模組 - 共用工具函數和全域變數

// 全域資料儲存
let allPatients = [];
let allAppointments = [];
let allPrescriptions = [];
let allServices = [];
let allDoctors = [];

// 根據患者ID獲取患者姓名
function getPatientName(patientId) {
    const patient = allPatients.find(p => p.info && p.info.id === patientId);
    return patient ? patient.info.name : '未知患者';
}

// 根據醫師ID獲取醫師姓名
function getDoctorName(doctorId) {
    if (!doctorId) return '';
    const doc = allDoctors.find(d => d && d.id === doctorId);
    if (doc) return doc.name;
    // 兼容舊資料：若 doctorId 實際是姓名
    const byName = allDoctors.find(d => d && d.name === doctorId);
    return byName ? byName.name : '';
}

// 顯示醫師為 "id name"（若找不到姓名，回傳 id 或 '-'）
function getDoctorDisplay(doctorId) {
    if (!doctorId) return '-';
    // 先以 ID 尋找
    let doc = allDoctors.find(d => d && d.id === doctorId);
    if (doc) return `${doc.id} ${doc.name}`;
    // 兼容舊資料：doctorId 其實存的是姓名
    doc = allDoctors.find(d => d && d.name === doctorId);
    if (doc) return `${doc.id} ${doc.name}`;
    // 找不到時回傳原值
    return doctorId;
}

// 載入患者選項到datalist
async function loadPatientOptions(datalistId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/patients`);
    if (result.success) {
        const datalistElement = document.getElementById(datalistId);
        // 清空現有選項
        datalistElement.innerHTML = '';
        
        // 添加病患選項
        result.data.forEach(patient => {
            // 確保患者資料結構完整
            if (!patient || !patient.info || !patient.info.id) {
                console.warn('跳過無效的患者資料:', patient);
                return;
            }
            
            const option = document.createElement('option');
            option.value = patient.info.id;
            option.textContent = `${patient.info.id} ${patient.info.name}`;
            option.setAttribute('data-name', patient.info.name);
            option.setAttribute('data-id', patient.info.id);
            datalistElement.appendChild(option);
        });
    }
}

// 載入醫師選項到 datalist
async function loadDoctorOptions(datalistId) {
    const result = await window.api.apiRequest(`${window.api.API_BASE}/doctors`);
    if (result.success) {
        const datalistElement = document.getElementById(datalistId);
        if (!datalistElement) return;
        // 清空現有選項
        datalistElement.innerHTML = '';

        // 添加醫師選項
        const list = result.data || [];
        // 更新快取
        allDoctors = list;
        list.forEach(doctor => {
            if (!doctor || !doctor.id) return;
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = `${doctor.id} ${doctor.name}`;
            option.setAttribute('data-name', doctor.name || '');
            option.setAttribute('data-id', doctor.id);
            datalistElement.appendChild(option);
        });
    }
}

// 確保已載入醫師清單（供列表渲染前呼叫）
async function ensureDoctorsLoaded() {
    if (allDoctors && allDoctors.length > 0) return;
    const result = await window.api.apiRequest(`${window.api.API_BASE}/doctors`);
    if (result.success) {
        allDoctors = result.data || [];
    }
}

// 導出工具函數和變數
window.utils = {
    getPatientName,
    getDoctorName,
    getDoctorDisplay,
    loadPatientOptions,
    loadDoctorOptions,
    ensureDoctorsLoaded,
    get allPatients() { return allPatients; },
    set allPatients(value) { allPatients = value; },
    get allAppointments() { return allAppointments; },
    set allAppointments(value) { allAppointments = value; },
    get allPrescriptions() { return allPrescriptions; },
    set allPrescriptions(value) { allPrescriptions = value; },
    get allServices() { return allServices; },
    set allServices(value) { allServices = value; },
    get allDoctors() { return allDoctors; },
    set allDoctors(value) { allDoctors = value; }
};
