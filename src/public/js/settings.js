// 設定模組 - 醫師管理
(function() {
  async function loadDoctors() {
    const res = await window.api.apiRequest(`${window.api.API_BASE}/doctors`);
    if (res.success) {
      displayDoctors(res.data || []);
    } else {
      window.ui.showMessage(`載入醫師失敗: ${res.error?.message || ''}`, 'error');
    }
  }

  function displayDoctors(doctors) {
    const tbody = document.getElementById('doctorTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    doctors.forEach(doc => {
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-gray-50';
      tr.innerHTML = `
        <td class="px-6 py-3 font-mono text-sm">${doc.id}</td>
        <td class="px-6 py-3">${doc.name}</td>
        <td class="px-6 py-3 sticky right-0 bg-white">
          <button class="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600 mr-2" onclick="window.settings.editDoctor('${doc.id}')">編輯</button>
          <button class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600" onclick="window.settings.deleteDoctor('${doc.id}')">刪除</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  function openCreateDoctorModal() {
    const content = `
      <form id="doctorCreateForm" class="space-y-4" aria-label="新增醫師表單">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1" for="newDoctorName">姓名</label>
            <input id="newDoctorName" type="text" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
        </div>
        <div class="flex justify-end space-x-3 pt-2">
          <button type="button" class="px-4 py-2 rounded border" onclick="window.ui.hideModal()">取消</button>
          <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">新增</button>
        </div>
      </form>`;
    window.ui.showModal('新增醫師', content);
    document.getElementById('doctorCreateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('newDoctorName');
      const payload = { name: nameInput && 'value' in nameInput ? nameInput.value.trim() : '' };
      const res = await window.api.apiRequest(`${window.api.API_BASE}/doctors`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        window.ui.showMessage('醫師已新增', 'success');
        window.ui.hideModal();
        loadDoctors();
      } else {
        window.ui.showMessage(`新增失敗: ${res.error?.message || ''}`, 'error');
      }
    });
  }

  async function editDoctor(oldId) {
    const res = await window.api.apiRequest(`${window.api.API_BASE}/doctors/${oldId}`);
    if (!res.success) {
      window.ui.showMessage('讀取醫師資料失敗', 'error');
      return;
    }
    const doc = res.data;
    const content = `
      <form id="doctorEditForm" class="space-y-4" aria-label="編輯醫師表單">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">醫師ID</label>
            <div class="px-3 py-2 border rounded bg-slate-50 text-slate-600 font-mono text-sm">${doc.id}</div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" for="editDoctorName">姓名</label>
            <input id="editDoctorName" type="text" value="${doc.name}" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
        </div>
        <div class="flex justify-end space-x-3 pt-2">
          <button type="button" class="px-4 py-2 rounded border" onclick="window.ui.hideModal()">取消</button>
          <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">儲存</button>
        </div>
      </form>`;
    window.ui.showModal('編輯醫師', content);
    document.getElementById('doctorEditForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('editDoctorName');
      const payload = { name: nameInput && 'value' in nameInput ? nameInput.value.trim() : '' };
      const up = await window.api.apiRequest(`${window.api.API_BASE}/doctors/${oldId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (up.success) {
        window.ui.showMessage('醫師已更新', 'success');
        window.ui.hideModal();
        loadDoctors();
      } else {
        window.ui.showMessage(`更新失敗: ${up.error?.message || ''}`, 'error');
      }
    });
  }

  async function deleteDoctor(id) {
    if (!confirm('確定刪除此醫師？')) return;
    const res = await window.api.apiRequest(`${window.api.API_BASE}/doctors/${id}`, { method: 'DELETE' });
    if (res.success) {
      window.ui.showMessage('醫師已刪除', 'success');
      loadDoctors();
    } else {
      window.ui.showMessage(`刪除失敗: ${res.error?.message || ''}`, 'error');
    }
  }

  // 導出
  window.settings = {
    loadDoctors,
    displayDoctors,
    openCreateDoctorModal,
    editDoctor,
    deleteDoctor
  };

  // 當 settings 面板顯示時載入資料（在 showPanel 中觸發會更好；這裡簡單處理）
  document.addEventListener('DOMContentLoaded', () => {
    // 若預設顯示 appointment，使用者切換到 settings 後再載入
    const aside = document.querySelector('aside');
    if (aside) {
      aside.addEventListener('click', (e) => {
        const t = e.target;
        if (t && t.matches && t.matches('[data-panel="settings"], [data-panel="settings"] *')) {
          setTimeout(() => loadDoctors(), 0);
        }
      });
    }
  });
})();
