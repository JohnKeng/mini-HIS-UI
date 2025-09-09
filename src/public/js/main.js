// 主應用模組 - 處理初始化和導航

// 表單處理
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化應用
    await window.patient.loadPatients();
    window.ui.showPanel('patient');
    
    // 患者表單處理
    document.getElementById('patientForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const patientData = {
            id: `p-${Date.now()}`,
            name: document.getElementById('patientName').value,
            birthDate: document.getElementById('patientBirthDate').value,
            gender: document.querySelector('input[name="gender"]:checked').value,
            contactNumber: document.getElementById('patientPhone').value,
            address: {
                street: document.getElementById('patientAddress').value,
                city: '台北市',
                zipCode: '100'
            }
        };
        
        const result = await window.api.apiRequest(`${window.api.API_BASE}/patients`, {
            method: 'POST',
            body: JSON.stringify(patientData)
        });
        
        if (result.success) {
            window.ui.showMessage('患者建立成功', 'success');
            document.getElementById('patientForm').reset();
            window.patient.loadPatients();
        } else {
            window.ui.showMessage(`建立失敗: ${result.error.message}`, 'error');
        }
    });

    // 預約表單處理
    document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const appointmentData = {
            id: `a-${Date.now()}`,
            patientId: document.getElementById('appointmentPatientId').value,
            doctorId: document.getElementById('appointmentDoctorId').value,
            department: document.getElementById('appointmentDepartment').value,
            timeSlot: {
                start: new Date(document.getElementById('appointmentTime').value).toISOString(),
                end: new Date(new Date(document.getElementById('appointmentTime').value).getTime() + 30 * 60000).toISOString()
            }
        };
        
        const result = await window.api.apiRequest(`${window.api.API_BASE}/appointments`, {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
        
        if (result.success) {
            window.ui.showMessage('預約建立成功', 'success');
            document.getElementById('appointmentForm').reset();
            window.appointment.loadAppointments();
        } else {
            window.ui.showMessage(`預約失敗: ${result.error.message}`, 'error');
        }
    });

    // 處方表單處理
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
        
        const result = await window.api.apiRequest(`${window.api.API_BASE}/prescriptions`, {
            method: 'POST',
            body: JSON.stringify(prescriptionData)
        });
        
        if (result.success) {
            window.ui.showMessage('處方開立成功', 'success');
            document.getElementById('prescriptionForm').reset();
            window.prescription.loadPrescriptions();
        } else {
            window.ui.showMessage(`開立失敗: ${result.error.message}`, 'error');
        }
    });

    // 醫療服務表單處理
    document.getElementById('serviceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const serviceData = {
            patientId: document.getElementById('servicePatientId').value,
            serviceType: document.getElementById('serviceType').value,
            description: document.getElementById('serviceName').value,
            priority: document.getElementById('servicePriority').value,
            estimatedDuration: parseInt(document.getElementById('serviceDuration').value),
            requestedBy: document.getElementById('serviceRequestedBy').value,
            requiredResources: ['X光機', '技術人員'],
            notes: document.getElementById('serviceNotes').value
        };
        
        const result = await window.api.apiRequest(`${window.api.API_BASE}/services`, {
            method: 'POST',
            body: JSON.stringify(serviceData)
        });
        
        if (result.success) {
            window.ui.showMessage('服務請求成功', 'success');
            document.getElementById('serviceForm').reset();
            window.service.loadServices();
        } else {
            window.ui.showMessage(`請求失敗: ${result.error.message}`, 'error');
        }
    });
});

// 導航按鈕事件處理
const patientBtn = document.getElementById('patientBtn');
const appointmentBtn = document.getElementById('appointmentBtn');
const prescriptionBtn = document.getElementById('prescriptionBtn');
const serviceBtn = document.getElementById('serviceBtn');

if (patientBtn) {
    patientBtn.addEventListener('click', async () => {
        window.ui.showPanel('patient');
        await window.patient.loadPatients();
    });
}

if (appointmentBtn) {
    appointmentBtn.addEventListener('click', async () => {
        window.ui.showPanel('appointment');
        await window.patient.loadPatients();
        window.appointment.loadAppointments();
        window.utils.loadPatientOptions('appointmentPatientList');
    });
}

if (prescriptionBtn) {
    prescriptionBtn.addEventListener('click', async () => {
        window.ui.showPanel('prescription');
        await window.patient.loadPatients();
        window.prescription.loadPrescriptions();
        window.utils.loadPatientOptions('prescriptionPatientList');
    });
}

if (serviceBtn) {
    serviceBtn.addEventListener('click', async () => {
        window.ui.showPanel('service');
        await window.patient.loadPatients();
        window.service.loadServices();
        window.utils.loadPatientOptions('servicePatientList');
    });
}