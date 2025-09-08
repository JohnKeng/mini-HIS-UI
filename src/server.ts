import express from 'express';
import path from 'path';

// Import hospital system modules
import {
  registerPatient,
  admitPatient,
  dischargePatient,
  isRegistered,
  isAdmitted
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

import { isSuccess } from './types/results.ts';
import { database } from './database/index.ts';

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

app.post('/api/patients/:id/admit', async (req, res) => {
  try {
    const patient = await database.readPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: { message: 'Patient not found' } });
    }
    
    if (!isRegistered(patient)) {
      return res.status(400).json({ success: false, error: { message: 'Patient must be registered first' } });
    }
    
    const { wardNumber, bedNumber, attendingDoctorId } = req.body;
    const result = admitPatient(patient, wardNumber, bedNumber, attendingDoctorId);
    
    if (isSuccess(result)) {
      const saved = await database.updatePatient(req.params.id, result.data);
      if (saved) {
        return res.json({ success: true, data: result.data });
      } else {
        return res.status(500).json({ success: false, error: { message: 'Failed to update patient' } });
      }
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to admit patient' } });
  }
});

app.post('/api/patients/:id/discharge', async (req, res) => {
  try {
    const patient = await database.readPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: { message: 'Patient not found' } });
    }
    
    if (!isAdmitted(patient)) {
      return res.status(400).json({ success: false, error: { message: 'Patient must be admitted first' } });
    }
    
    const { summary, followUpDate } = req.body;
    const result = dischargePatient(patient, summary, followUpDate);
    
    if (isSuccess(result)) {
      const saved = await database.updatePatient(req.params.id, result.data);
      if (saved) {
        return res.json({ success: true, data: result.data });
      } else {
        return res.status(500).json({ success: false, error: { message: 'Failed to update patient' } });
      }
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to discharge patient' } });
  }
});

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
  const { patientId, serviceType, serviceName, priority, estimatedDuration, requestedBy, requiredResources, notes } = req.body;
  const result = requestService(patientId, serviceType, serviceName, priority, estimatedDuration, requestedBy, requiredResources, notes);
  
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
  
  const { performingStaff, serviceNotes } = req.body;
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

// 首頁路由
app.get('/', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'src', 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`mini-HIS 服務器運行於 http://0.0.0.0:${port}`);
});