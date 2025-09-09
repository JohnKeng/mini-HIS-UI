// 工具模組 - 共用工具函數和全域變數

// 全域資料儲存
let allPatients = [];
let allAppointments = [];
let allPrescriptions = [];
let allServices = [];

// 根據患者ID獲取患者姓名
function getPatientName(patientId) {
    const patient = allPatients.find(p => p.info.id === patientId);
    return patient ? patient.info.name : '未知患者';
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
            option.textContent = `${patient.info.id} + ${patient.info.name}`;
            option.setAttribute('data-name', patient.info.name);
            option.setAttribute('data-id', patient.info.id);
            datalistElement.appendChild(option);
        });
    }
}

// 導出工具函數和變數
window.utils = {
    getPatientName,
    loadPatientOptions,
    get allPatients() { return allPatients; },
    set allPatients(value) { allPatients = value; },
    get allAppointments() { return allAppointments; },
    set allAppointments(value) { allAppointments = value; },
    get allPrescriptions() { return allPrescriptions; },
    set allPrescriptions(value) { allPrescriptions = value; },
    get allServices() { return allServices; },
    set allServices(value) { allServices = value; }
};