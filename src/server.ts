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

const app = express();
const port = 5000;

// 中介軟體
app.use(express.json());
app.use(express.static('public'));

// 記憶體資料儲存 (實際專案應使用資料庫)
const patients = new Map<string, PatientState>();
const appointments = new Map<string, AppointmentState>();
const prescriptions = new Map<string, PrescriptionState>();
const services = new Map<string, ServiceState>();

// Patient API 端點
app.post('/api/patients', (req, res) => {
  const { patientInfo } = req.body;
  const patientId = `pt-${Date.now()}`;
  
  const result = registerPatient(patientInfo, patientId);
  if (isSuccess(result)) {
    patients.set(patientId, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.get('/api/patients/:id', (req, res) => {
  const patient = patients.get(req.params.id);
  if (patient) {
    res.json({ success: true, data: patient });
  } else {
    res.status(404).json({ success: false, error: { message: 'Patient not found' } });
  }
});

app.get('/api/patients', (_req, res) => {
  const allPatients = Array.from(patients.values());
  res.json({ success: true, data: allPatients });
});

app.post('/api/patients/:id/admit', (req, res) => {
  const patient = patients.get(req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, error: { message: 'Patient not found' } });
  }
  
  if (!isRegistered(patient)) {
    return res.status(400).json({ success: false, error: { message: 'Patient must be registered first' } });
  }
  
  const { wardNumber, bedNumber, attendingDoctorId } = req.body;
  const result = admitPatient(patient, wardNumber, bedNumber, attendingDoctorId);
  
  if (isSuccess(result)) {
    patients.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/patients/:id/discharge', (req, res) => {
  const patient = patients.get(req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, error: { message: 'Patient not found' } });
  }
  
  if (!isAdmitted(patient)) {
    return res.status(400).json({ success: false, error: { message: 'Patient must be admitted first' } });
  }
  
  const { summary, followUpDate } = req.body;
  const result = dischargePatient(patient, summary, followUpDate);
  
  if (isSuccess(result)) {
    patients.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

// Appointment API 端點
app.post('/api/appointments', (req, res) => {
  const { patientId, doctorId, department, timeSlot, purpose } = req.body;
  const result = requestAppointment(patientId, doctorId, department, timeSlot, purpose);
  
  if (isSuccess(result)) {
    appointments.set(result.data.info.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.get('/api/appointments', (_req, res) => {
  const allAppointments = Array.from(appointments.values());
  res.json({ success: true, data: allAppointments });
});

app.post('/api/appointments/:id/confirm', (req, res) => {
  const appointment = appointments.get(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, error: { message: 'Appointment not found' } });
  }
  
  if (appointment.tag !== 'Requested') {
    return res.status(400).json({ success: false, error: { message: 'Appointment must be in Requested state' } });
  }
  
  const { confirmationNumber } = req.body;
  const result = confirmAppointment(appointment, confirmationNumber);
  
  if (isSuccess(result)) {
    appointments.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/appointments/:id/checkin', (req, res) => {
  const appointment = appointments.get(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, error: { message: 'Appointment not found' } });
  }
  
  if (appointment.tag !== 'Confirmed') {
    return res.status(400).json({ success: false, error: { message: 'Appointment must be in Confirmed state' } });
  }
  
  const result = checkInAppointment(appointment);
  
  if (isSuccess(result)) {
    appointments.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/appointments/:id/start', (req, res) => {
  const appointment = appointments.get(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, error: { message: 'Appointment not found' } });
  }
  
  if (appointment.tag !== 'CheckedIn') {
    return res.status(400).json({ success: false, error: { message: 'Appointment must be in CheckedIn state' } });
  }
  
  const result = startAppointment(appointment);
  
  if (isSuccess(result)) {
    appointments.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/appointments/:id/complete', (req, res) => {
  const appointment = appointments.get(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, error: { message: 'Appointment not found' } });
  }
  
  if (appointment.tag !== 'InProgress') {
    return res.status(400).json({ success: false, error: { message: 'Appointment must be in InProgress state' } });
  }
  
  const { followUpNeeded, notes } = req.body;
  const result = completeAppointment(appointment, followUpNeeded, notes);
  
  if (isSuccess(result)) {
    appointments.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

// Prescription API 端點
app.post('/api/prescriptions', (req, res) => {
  const { patientId, doctorId, items, notes } = req.body;
  const result = createPrescription(patientId, doctorId, items, notes);
  
  if (isSuccess(result)) {
    prescriptions.set(result.data.info.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.get('/api/prescriptions', (_req, res) => {
  const allPrescriptions = Array.from(prescriptions.values());
  res.json({ success: true, data: allPrescriptions });
});

app.post('/api/prescriptions/:id/submit', (req, res) => {
  const prescription = prescriptions.get(req.params.id);
  if (!prescription) {
    return res.status(404).json({ success: false, error: { message: 'Prescription not found' } });
  }
  
  if (prescription.tag !== 'Created') {
    return res.status(400).json({ success: false, error: { message: 'Prescription must be in Created state' } });
  }
  
  const result = submitPrescription(prescription);
  
  if (isSuccess(result)) {
    prescriptions.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/prescriptions/:id/start-preparation', (req, res) => {
  const prescription = prescriptions.get(req.params.id);
  if (!prescription) {
    return res.status(404).json({ success: false, error: { message: 'Prescription not found' } });
  }
  
  if (prescription.tag !== 'Submitted') {
    return res.status(400).json({ success: false, error: { message: 'Prescription must be in Submitted state' } });
  }
  
  const { pharmacistId } = req.body;
  const result = startPrescriptionPreparation(prescription, pharmacistId);
  
  if (isSuccess(result)) {
    prescriptions.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/prescriptions/:id/complete-preparing', (req, res) => {
  const prescription = prescriptions.get(req.params.id);
  if (!prescription) {
    return res.status(404).json({ success: false, error: { message: 'Prescription not found' } });
  }
  
  if (prescription.tag !== 'InPreparation') {
    return res.status(400).json({ success: false, error: { message: 'Prescription must be in InPreparation state' } });
  }
  
  const { preparationNotes } = req.body;
  const result = completePreparing(prescription, preparationNotes);
  
  if (isSuccess(result)) {
    prescriptions.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/prescriptions/:id/dispense', (req, res) => {
  const prescription = prescriptions.get(req.params.id);
  if (!prescription) {
    return res.status(404).json({ success: false, error: { message: 'Prescription not found' } });
  }
  
  if (prescription.tag !== 'Prepared') {
    return res.status(400).json({ success: false, error: { message: 'Prescription must be in Prepared state' } });
  }
  
  const { dispensedBy, instructions } = req.body;
  const result = dispensePrescription(prescription, dispensedBy, instructions);
  
  if (isSuccess(result)) {
    prescriptions.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

// Medical Service API 端點
app.post('/api/services', (req, res) => {
  const { patientId, serviceType, serviceName, priority, estimatedDuration, requestedBy, requiredResources, notes } = req.body;
  const result = requestService(patientId, serviceType, serviceName, priority, estimatedDuration, requestedBy, requiredResources, notes);
  
  if (isSuccess(result)) {
    services.set(result.data.info.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.get('/api/services', (_req, res) => {
  const allServices = Array.from(services.values());
  res.json({ success: true, data: allServices });
});

app.post('/api/services/:id/schedule', (req, res) => {
  const service = services.get(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: { message: 'Service not found' } });
  }
  
  if (service.tag !== 'Requested') {
    return res.status(400).json({ success: false, error: { message: 'Service must be in Requested state' } });
  }
  
  const { scheduledTime, scheduledBy, staff, location } = req.body;
  const result = scheduleService(service, scheduledTime, scheduledBy, staff, location);
  
  if (isSuccess(result)) {
    services.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/services/:id/start-preparation', (req, res) => {
  const service = services.get(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: { message: 'Service not found' } });
  }
  
  if (service.tag !== 'Scheduled') {
    return res.status(400).json({ success: false, error: { message: 'Service must be in Scheduled state' } });
  }
  
  const { staff, location, preparationNotes } = req.body;
  const result = startServicePreparation(service, staff, location, preparationNotes);
  
  if (isSuccess(result)) {
    services.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/services/:id/start', (req, res) => {
  const service = services.get(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: { message: 'Service not found' } });
  }
  
  if (service.tag !== 'InPreparation') {
    return res.status(400).json({ success: false, error: { message: 'Service must be in InPreparation state' } });
  }
  
  const { performingStaff, serviceNotes } = req.body;
  const result = startService(service, performingStaff, serviceNotes);
  
  if (isSuccess(result)) {
    services.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

app.post('/api/services/:id/complete', (req, res) => {
  const service = services.get(req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, error: { message: 'Service not found' } });
  }
  
  if (service.tag !== 'InProgress') {
    return res.status(400).json({ success: false, error: { message: 'Service must be in InProgress state' } });
  }
  
  const { results, actualDuration, followUpInstructions } = req.body;
  const result = completeService(service, results, actualDuration, followUpInstructions);
  
  if (isSuccess(result)) {
    services.set(req.params.id, result.data);
    return res.json({ success: true, data: result.data });
  } else {
    return res.status(400).json({ success: false, error: result.error });
  }
});

// 首頁路由
app.get('/', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`mini-HIS 服務器運行於 http://0.0.0.0:${port}`);
});