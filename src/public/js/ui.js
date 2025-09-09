// UI 模組 - 處理所有UI相關功能

// 面板管理
const panels = {
    patient: document.getElementById('patientPanel'),
    appointment: document.getElementById('appointmentPanel'),
    prescription: document.getElementById('prescriptionPanel'),
    service: document.getElementById('servicePanel')
};

// 切換表單顯示/隱藏
function toggleForm(containerId, button) {
    const container = document.getElementById(containerId);
    const arrow = button.querySelector('span');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        arrow.textContent = '▲';
    } else {
        container.style.display = 'none';
        arrow.textContent = '▼';
    }
}

// 顯示指定面板 + 更新導航樣式
function showPanel(panelName) {
    // 隱藏所有面板
    Object.values(panels).forEach(panel => {
        if (panel) panel.classList.add('hidden');
    });
    
    // 顯示指定面板
    if (panels[panelName]) {
        panels[panelName].classList.remove('hidden');
    }
    
    // 更新 segmented 導覽按鈕的 active 樣式
    const tabs = document.querySelectorAll('#topNav .nav-tab');
    tabs.forEach(btn => {
        if (btn.getAttribute('data-panel') === panelName) {
            btn.classList.add('bg-white', 'text-blue-700');
            btn.classList.remove('bg-blue-50');
        } else {
            btn.classList.remove('bg-white', 'text-blue-700');
            btn.classList.add('bg-blue-50');
        }
    });
}

// 顯示訊息提示
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    const messageDiv = document.createElement('div');
    
    const bgColor = {
        success: 'bg-gray-800',
        error: 'bg-black',
        info: 'bg-gray-700',
        warning: 'bg-gray-600'
    }[type] || 'bg-gray-700';
    
    messageDiv.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-lg mb-3 transition-all duration-300 border border-gray-300`;
    messageDiv.textContent = message;
    
    messageContainer.appendChild(messageDiv);
    
    // 3 秒後自動移除
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// 彈窗管理
function showModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('detailModal').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

// 關閉彈窗事件
document.getElementById('closeModal').addEventListener('click', hideModal);
document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
        hideModal();
    }
});

// 導出 UI 函數
window.ui = {
    toggleForm,
    showPanel,
    showMessage,
    showModal,
    hideModal
};
