import express from 'express';
import path from 'path';

// Import hospital system modules
import {
  registerPatient
} from './models/Patient.ts';
import type { PatientState } from './models/Patient.ts';

import {
  requestAppointment,
  confirmAppointment,
  checkInAppointment,
  startAppointment,
  completeAppointment
} from './models/Appointment.ts';
import type { AppointmentState } from './models/Appointment.ts';

import {
  createPrescription,
  submitPrescription,
  startPreparation as startPrescriptionPreparation,
  completePreparing,
  dispensePrescription
} from './models/Prescription.ts';
import type { PrescriptionState } from './models/Prescription.ts';

import {
  requestService,
  scheduleService,
  startPreparation as startServicePreparation,
  startService,
  completeService
} from './models/MedicalService.ts';
import type { ServiceState } from './models/MedicalService.ts';
import type { MedicalStaff, Doctor } from './types/common.ts';
import { isSuccess } from './types/results.ts';
import { database } from './database/index.ts';
import type { MedicalRecordState } from './models/MedicalRecord.ts';
import { createMedicalRecord, updateMedicalRecord } from './models/MedicalRecord.ts';

const app = express();
const port = 5000;

// 中介軟體
app.use(express.json());
app.use(express.static('src/public'));

// 使用資料庫抽象層 (可輕鬆切換不同資料庫)
// const patients = new Map<string, PatientState>();
// const appointments = new Map<string, AppointmentState>();
// const prescriptions = new Map<string, PrescriptionState>();
// const services = new Map<string, ServiceState>();

// 輔助函式：從實體中提取 ID
function getEntityId(entity: PatientState | AppointmentState | PrescriptionState | ServiceState): string {
  if ('info' in entity && entity.info && typeof entity.info === 'object' && 'id' in entity.info) {
    return entity.info.id as string;
  }
  return '';
}

// Patient API 端點
app.post('/api/patients', async (req, res) => {
  const { patientInfo } = req.body;
  const patientId = `pt-${Date.now()}`;
  
  const result = registerPatient(patientInfo, patientId);
  if (isSuccess(result)) {
    const saved = await database.createPatient(patientId, result.data);
    if (saved) {
      return res.json({ success: true, data: result.data });
    } else {
      return res.status(500).json({ success: false, error: { message: 'Failed to save patient' } });
    }
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await database.readPatient(req.params.id);
    if (patient) {
      res.json({ success: true, data: patient });
    } else {
      res.status(404).json({ success: false, error: { message: 'Patient not found' } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch patient' } });
  }
});

app.get('/api/patients', async (_req, res) => {
  try {
    const allPatients = await database.findAllPatients();
    res.json({ success: true, data: allPatients });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch patients' } });
  }
});

// 更新患者資訊（不允許修改患者 ID 與狀態）
app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = await database.readPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: { message: 'Patient not found' } });
    }

    const { name, birthDate, gender, contactNumber, address } = req.body;

    // 僅更新 info 內的可編輯欄位
    const updated = {
      ...patient,
      info: {
        ...patient.info,
        name: name ?? patient.info.name,
        birthDate: birthDate ?? patient.info.birthDate,
        gender: gender ?? patient.info.gender,
        contactNumber: contactNumber ?? patient.info.contactNumber,
        address: {
          ...patient.info.address,
          ...(address || {})
        }
      }
    } as PatientState;

    const ok = await database.updatePatient(req.params.id, updated);
    if (!ok) {
      return res.status(500).json({ success: false, error: { message: 'Failed to update patient' } });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update patient' } });
  }
});

// 開始準備處方
app.post('/api/prescriptions/:id/start-preparing', async (req, res) => {
  try {
    const prescription = await database.readPrescription(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, error: { message: 'Prescription not found' } });
    }
    
    if (prescription.tag !== 'Submitted') {
      return res.status(400).json({ success: false, error: { message: 'Prescription must be submitted first' } });
    }
    
    const result = startPrescriptionPreparation(prescription, 'prep-001');
    
    if (isSuccess(result)) {
      const saved = await database.updatePrescription(req.params.id, result.data);
      if (saved) {
        return res.json({ success: true, data: result.data });
      } else {
        return res.status(500).json({ success: false, error: { message: 'Failed to update prescription' } });
      }
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to start preparing prescription' } });
  }
});

// 開始準備醫療服務
app.post('/api/services/:id/start-preparing', async (req, res) => {
  try {
    const service = await database.readService(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, error: { message: 'Service not found' } });
    }
    
    if (service.tag !== 'Scheduled') {
      return res.status(400).json({ success: false, error: { message: 'Service must be scheduled first' } });
    }
    
    const sampleStaff: MedicalStaff[] = [{
      id: 'staff-001',
      name: '醫護人員',
      birthDate: new Date().toISOString(),
      gender: 'other',
      staffType: 'labTechnician',
      department: '檢驗科',
      licenseNumber: 'LIC-0001'
    }];
    const result = startServicePreparation(service, sampleStaff, '檢驗室', '準備器材');
    
    if (isSuccess(result)) {
      const saved = await database.updateService(req.params.id, result.data);
      if (saved) {
        return res.json({ success: true, data: result.data });
      } else {
        return res.status(500).json({ success: false, error: { message: 'Failed to update service' } });
      }
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to start preparing service' } });
  }
});

// 移除患者入院API端點

// 移除患者出院API端點

// Appointment API 端點
app.post('/api/appointments', async (req, res) => {
  const { patientId, doctorId, department, timeSlot, purpose } = req.body;
  const result = requestAppointment(patientId, doctorId, department, timeSlot, purpose);
  
  if (isSuccess(result)) {
    const appointmentId = getEntityId(result.data);
    const saved = await database.createAppointment(appointmentId, result.data);
    if (saved) {
      return res.json({ success: true, data: result.data });
    } else {
      return res.status(500).json({ success: false, error: { message: 'Failed to save appointment' } });
    }
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

// Medical Record API 端點
app.get('/api/medical-records', async (req, res) => {
  try {
    const patientId = (req.query.patientId as string) || '';
    if (patientId) {
      const records = await database.findMedicalRecordsByPatient(patientId);
      return res.json({ success: true, data: records });
    }
    // 無 patientId 時不回傳全部，避免洩漏；回空陣列
    return res.json({ success: true, data: [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch medical records' } });
  }
});

app.get('/api/medical-records/:id', async (req, res) => {
  try {
    const record = await database.readMedicalRecord(req.params.id);
    if (!record) return res.status(404).json({ success: false, error: { message: 'Medical record not found' } });
    return res.json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch medical record' } });
  }
});

// Doctors（設定）API 端點
app.get('/api/doctors', async (_req, res) => {
  try {
    const doctors = await database.findAllDoctors();
    return res.json({ success: true, data: doctors });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch doctors' } });
  }
});

app.get('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await database.readDoctor(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, error: { message: 'Doctor not found' } });
    return res.json({ success: true, data: doctor });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch doctor' } });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const { name } = req.body as Partial<Doctor>;
    if (!name) return res.status(400).json({ success: false, error: { message: 'Missing name' } });
    // 產生 dr-XX 流水號
    const list = await database.findAllDoctors();
    const maxNum = list
      .map(d => (d.id || '').match(/^dr-(\d{2,})$/))
      .filter(Boolean)
      .map(m => parseInt((m as RegExpMatchArray)[1], 10))
      .reduce((a, b) => Math.max(a, b), 0);
    const nextNum = (maxNum + 1).toString().padStart(2, '0');
    const newId = `dr-${nextNum}`;
    const ok = await database.createDoctor(newId, { id: newId, name });
    if (!ok) return res.status(400).json({ success: false, error: { message: 'Doctor save failed' } });
    return res.json({ success: true, data: { id: newId, name } });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to create doctor' } });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const oldId = req.params.id;
    const { name } = req.body as Partial<Doctor>;
    if (!name) return res.status(400).json({ success: false, error: { message: 'Missing name' } });
    // 僅允許更新姓名，ID 不可修改
    const ok = await database.updateDoctor(oldId, { id: oldId, name });
    if (!ok) return res.status(400).json({ success: false, error: { message: 'Doctor update failed (not found)' } });
    return res.json({ success: true, data: { id: oldId, name } });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update doctor' } });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const ok = await database.deleteDoctor(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: { message: 'Doctor not found' } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to delete doctor' } });
  }
});

app.post('/api/medical-records', async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId, data } = req.body as {
      patientId: string; doctorId?: string; appointmentId?: string; data: MedicalRecordState['data'];
    };
    if (!patientId || !data) {
      return res.status(400).json({ success: false, error: { message: 'Missing required fields' } });
    }
    const patient = await database.readPatient(patientId);
    if (!patient) {
      return res.status(400).json({ success: false, error: { message: 'Invalid patientId' } });
    }
    const record = createMedicalRecord(patientId, doctorId, appointmentId, {
      chiefComplaint: data.chiefComplaint || '',
      historyOfPresentIllness: data.historyOfPresentIllness || '',
      pastMedicalHistory: data.pastMedicalHistory || '',
      physicalExam: data.physicalExam || '',
      diagnosis: data.diagnosis || '',
      treatmentPlan: data.treatmentPlan || ''
    });
    const saved = await database.createMedicalRecord(record.info.id, record);
    if (!saved) return res.status(500).json({ success: false, error: { message: 'Failed to save medical record' } });
    return res.json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to create medical record' } });
  }
});

app.put('/api/medical-records/:id', async (req, res) => {
  try {
    const record = await database.readMedicalRecord(req.params.id);
    if (!record) return res.status(404).json({ success: false, error: { message: 'Medical record not found' } });
    const updates = req.body?.data || {};
    const updated = updateMedicalRecord(record, updates);
    const ok = await database.updateMedicalRecord(updated.info.id, updated);
    if (!ok) return res.status(500).json({ success: false, error: { message: 'Failed to update medical record' } });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update medical record' } });
  }
});

app.get('/api/appointments', async (_req, res) => {
  try {
    const allAppointments = await database.findAllAppointments();
    res.json({ success: true, data: allAppointments });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch appointments' } });
  }
});

app.post('/api/appointments/:id/confirm', async (req, res) => {
  const appointment = await database.readAppointment(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, error: { message: 'Appointment not found' } });
  }
  
  if (appointment.tag !== 'Requested') {
    return res.status(400).json({ success: false, error: { message: 'Appointment must be in Requested state' } });
  }
  
  const { confirmationNumber } = req.body;
  const result = confirmAppointment(appointment, confirmationNumber);
  
  if (isSuccess(result)) {
    await database.updateAppointment(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/appointments/:id/checkin', async (req, res) => {
  const appointment = await database.readAppointment(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, error: { message: 'Appointment not found' } });
  }
  
  if (appointment.tag !== 'Confirmed') {
    return res.status(400).json({ success: false, error: { message: 'Appointment must be in Confirmed state' } });
  }
  
  const result = checkInAppointment(appointment);
  
  if (isSuccess(result)) {
    await database.updateAppointment(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/appointments/:id/start', async (req, res) => {
  const appointment = await database.readAppointment(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, error: { message: 'Appointment not found' } });
  }
  
  if (appointment.tag !== 'CheckedIn') {
    return res.status(400).json({ success: false, error: { message: 'Appointment must be in CheckedIn state' } });
  }
  
  const result = startAppointment(appointment);
  
  if (isSuccess(result)) {
    await database.updateAppointment(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/appointments/:id/complete', async (req, res) => {
  const appointment = await database.readAppointment(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, error: { message: 'Appointment not found' } });
  }
  
  if (appointment.tag !== 'InProgress') {
    return res.status(400).json({ success: false, error: { message: 'Appointment must be in InProgress state' } });
  }
  
  const { followUpNeeded, notes } = req.body;
  const result = completeAppointment(appointment, followUpNeeded, notes);
  
  if (isSuccess(result)) {
    await database.updateAppointment(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

// Prescription API 端點
app.post('/api/prescriptions', async (req, res) => {
  const { patientId, doctorId, items, notes } = req.body;
  const result = createPrescription(patientId, doctorId, items, notes);
  
  if (isSuccess(result)) {
    await database.createPrescription(getEntityId(result.data), result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.get('/api/prescriptions', async (_req, res) => {
  try {
    const allPrescriptions = await database.findAllPrescriptions();
    res.json({ success: true, data: allPrescriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch prescriptions' } });
  }
});

app.post('/api/prescriptions/:id/submit', async (req, res) => {
  const prescription = await database.readPrescription(req.params.id);
  if (!prescription) {
    return res.status(404).json({ success: false, error: { message: 'Prescription not found' } });
  }
  
  if (prescription.tag !== 'Created') {
    return res.status(400).json({ success: false, error: { message: 'Prescription must be in Created state' } });
  }
  
  const result = submitPrescription(prescription);
  
  if (isSuccess(result)) {
    await database.updatePrescription(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/prescriptions/:id/start-preparation', async (req, res) => {
  const prescription = await database.readPrescription(req.params.id);
  if (!prescription) {
    return res.status(404).json({ success: false, error: { message: 'Prescription not found' } });
  }
  
  if (prescription.tag !== 'Submitted') {
    return res.status(400).json({ success: false, error: { message: 'Prescription must be in Submitted state' } });
  }
  
  const { pharmacistId } = req.body;
  const result = startPrescriptionPreparation(prescription, pharmacistId);
  
  if (isSuccess(result)) {
    await database.updatePrescription(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/prescriptions/:id/complete-preparing', async (req, res) => {
  const prescription = await database.readPrescription(req.params.id);
  if (!prescription) {
    return res.status(404).json({ success: false, error: { message: 'Prescription not found' } });
  }
  
  if (prescription.tag !== 'InPreparation') {
    return res.status(400).json({ success: false, error: { message: 'Prescription must be in InPreparation state' } });
  }
  
  const { preparationNotes } = req.body;
  const result = completePreparing(prescription, preparationNotes);
  
  if (isSuccess(result)) {
    await database.updatePrescription(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/prescriptions/:id/dispense', async (req, res) => {
  const prescription = await database.readPrescription(req.params.id);
  if (!prescription) {
    return res.status(404).json({ success: false, error: { message: 'Prescription not found' } });
  }
  
  if (prescription.tag !== 'Prepared') {
    return res.status(400).json({ success: false, error: { message: 'Prescription must be in Prepared state' } });
  }
  
  const { dispensedBy, instructions } = req.body;
  const result = dispensePrescription(prescription, dispensedBy, instructions);
  
  if (isSuccess(result)) {
    await database.updatePrescription(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

// Medical Service API 端點
app.post('/api/services', async (req, res) => {
  // 前端目前傳遞的是 description；為相容也接受 serviceName
  const { patientId, serviceType, serviceName, description, priority, estimatedDuration, requestedBy, requiredResources, notes } = req.body;
  const serviceDescription = description ?? serviceName; // 後端模型使用 description 欄位
  const result = requestService(patientId, serviceType, serviceDescription, priority, estimatedDuration, requestedBy, requiredResources, notes);
  
  if (isSuccess(result)) {
    await database.createService(getEntityId(result.data), result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.get('/api/services', async (_req, res) => {
  try {
    const allServices = await database.findAllServices();
    res.json({ success: true, data: allServices });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch services' } });
  }
});

app.post('/api/services/:id/schedule', async (req, res) => {
  const service = await database.readService(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: { message: 'Service not found' } });
  }
  
  if (service.tag !== 'Requested') {
    return res.status(400).json({ success: false, error: { message: 'Service must be in Requested state' } });
  }
  
  const { scheduledTime, scheduledBy, staff, location } = req.body;
  const result = scheduleService(service, scheduledTime, scheduledBy, staff, location);
  
  if (isSuccess(result)) {
    await database.updateService(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/services/:id/start-preparation', async (req, res) => {
  const service = await database.readService(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: { message: 'Service not found' } });
  }
  
  if (service.tag !== 'Scheduled') {
    return res.status(400).json({ success: false, error: { message: 'Service must be in Scheduled state' } });
  }
  
  const { staff, location, preparationNotes } = req.body;
  const result = startServicePreparation(service, staff, location, preparationNotes);
  
  if (isSuccess(result)) {
    await database.updateService(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/services/:id/start', async (req, res) => {
  const service = await database.readService(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: { message: 'Service not found' } });
  }
  
  if (service.tag !== 'InPreparation') {
    return res.status(400).json({ success: false, error: { message: 'Service must be in InPreparation state' } });
  }
  
  const body = req.body || {};
  const performingStaff = Array.isArray(body.performingStaff) && body.performingStaff.length > 0
    ? body.performingStaff
    : service.assignedStaff; // 預設使用已指派的人員
  const serviceNotes = Array.isArray(body.serviceNotes) ? body.serviceNotes : [];

  const result = startService(service, performingStaff, serviceNotes);
  
  if (isSuccess(result)) {
    await database.updateService(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/services/:id/complete', async (req, res) => {
  const service = await database.readService(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: { message: 'Service not found' } });
  }
  
  if (service.tag !== 'InProgress') {
    return res.status(400).json({ success: false, error: { message: 'Service must be in InProgress state' } });
  }
  
  const { results, actualDuration, followUpInstructions } = req.body;
  const result = completeService(service, results, actualDuration, followUpInstructions);
  
  if (isSuccess(result)) {
    await database.updateService(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

// ========== 刪除端點 ==========

// 刪除患者
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const success = await database.deletePatient(req.params.id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: { message: 'Patient not found' } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete patient' } });
  }
});

// 刪除預約
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const success = await database.deleteAppointment(req.params.id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: { message: 'Appointment not found' } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete appointment' } });
  }
});

// 刪除處方
app.delete('/api/prescriptions/:id', async (req, res) => {
  try {
    const success = await database.deletePrescription(req.params.id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: { message: 'Prescription not found' } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete prescription' } });
  }
});

// 刪除醫療服務
app.delete('/api/services/:id', async (req, res) => {
  try {
    const success = await database.deleteService(req.params.id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: { message: 'Service not found' } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete service' } });
  }
});

// 首頁路由
app.get('/', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'src', 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`mini-HIS 服務器運行於 http://0.0.0.0:${port}`);
});
