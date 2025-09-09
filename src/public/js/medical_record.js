// 病歷頁面腳本
(function() {
  let currentRecordId = '';
  let patientId = '';
  let appointmentId = '';

  function getQS(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name) || '';
  }

  function fillPatientInfo(p) {
    const el = document.getElementById('patientInfo');
    if (!p) {
      el.innerHTML = '<div class="text-red-600">找不到患者資料</div>';
      return;
    }
    el.innerHTML = `
      <div><span class="font-medium">患者ID:</span> ${p.info.id}</div>
      <div><span class="font-medium">姓名:</span> ${p.info.name}</div>
      <div><span class="font-medium">生日:</span> ${p.info.birthDate || ''}</div>
      <div><span class="font-medium">性別:</span> ${p.info.gender || ''}</div>
      <div><span class="font-medium">電話:</span> ${p.info.contactNumber || ''}</div>
      <div><span class="font-medium">地址:</span> ${p.info.address?.street || ''}</div>
    `;
  }

  function setForm(record) {
    document.getElementById('chiefComplaint').value = record?.data?.chiefComplaint || '';
    document.getElementById('hpi').value = record?.data?.historyOfPresentIllness || '';
    document.getElementById('pmh').value = record?.data?.pastMedicalHistory || '';
    document.getElementById('pe').value = record?.data?.physicalExam || '';
    document.getElementById('dx').value = record?.data?.diagnosis || '';
    document.getElementById('plan').value = record?.data?.treatmentPlan || '';
    const meta = document.getElementById('recordMeta');
    if (record) {
      meta.textContent = `建立於 ${new Date(record.info.createdAt).toLocaleString()}，更新於 ${new Date(record.info.updatedAt).toLocaleString()}`;
    } else {
      meta.textContent = '';
    }
  }

  async function loadPatientAndRecords() {
    patientId = getQS('patientId');
    appointmentId = getQS('appointmentId');
    if (!patientId) {
      window.ui.showMessage('缺少患者ID', 'error');
      return;
    }
    // 患者
    const p = await window.api.apiRequest(`${window.api.API_BASE}/patients/${patientId}`);
    if (p.success) fillPatientInfo(p.data);
    // 病歷列表
    const r = await window.api.apiRequest(`${window.api.API_BASE}/medical-records?patientId=${encodeURIComponent(patientId)}`);
    const select = document.getElementById('recordSelect');
    select.innerHTML = '<option value="">選擇既有病歷...</option>';
    if (r.success && Array.isArray(r.data)) {
      r.data.forEach(rec => {
        const opt = document.createElement('option');
        opt.value = rec.info.id;
        opt.textContent = `${new Date(rec.info.createdAt).toLocaleString()} - ${rec.data.diagnosis || '未填診斷'}`;
        opt.dataset.json = JSON.stringify(rec);
        select.appendChild(opt);
      });
    }
  }

  function newRecord() {
    currentRecordId = '';
    document.getElementById('recordSelect').value = '';
    setForm(null);
  }

  async function saveRecord(e) {
    e.preventDefault();
    const payload = {
      patientId,
      appointmentId: appointmentId || undefined,
      data: {
        chiefComplaint: document.getElementById('chiefComplaint').value.trim(),
        historyOfPresentIllness: document.getElementById('hpi').value.trim(),
        pastMedicalHistory: document.getElementById('pmh').value.trim(),
        physicalExam: document.getElementById('pe').value.trim(),
        diagnosis: document.getElementById('dx').value.trim(),
        treatmentPlan: document.getElementById('plan').value.trim(),
      }
    };

    if (!currentRecordId) {
      const res = await window.api.apiRequest(`${window.api.API_BASE}/medical-records`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        window.ui.showMessage('病歷已建立', 'success');
        currentRecordId = res.data.info.id;
        setForm(res.data);
        loadPatientAndRecords();
      } else {
        window.ui.showMessage(`儲存失敗: ${res.error.message}`, 'error');
      }
    } else {
      const res = await window.api.apiRequest(`${window.api.API_BASE}/medical-records/${currentRecordId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: payload.data })
      });
      if (res.success) {
        window.ui.showMessage('病歷已更新', 'success');
        setForm(res.data);
        loadPatientAndRecords();
      } else {
        window.ui.showMessage(`更新失敗: ${res.error.message}`, 'error');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadPatientAndRecords();
    document.getElementById('newRecordBtn').addEventListener('click', newRecord);
    document.getElementById('recordForm').addEventListener('submit', saveRecord);
    document.getElementById('recordSelect').addEventListener('change', (e) => {
      const id = e.target.value;
      if (!id) { newRecord(); return; }
      currentRecordId = id;
      const opt = e.target.options[e.target.selectedIndex];
      const rec = opt?.dataset?.json ? JSON.parse(opt.dataset.json) : null;
      setForm(rec);
    });
  });
})();

