// UI 模組 - 處理所有UI相關功能

// 面板管理
const panels = {
    patient: document.getElementById('patientPanel'),
    appointment: document.getElementById('appointmentPanel'),
    prescription: document.getElementById('prescriptionPanel'),
    service: document.getElementById('servicePanel'),
    settings: document.getElementById('settingsPanel')
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
    
    // 更新側邊導航樣式（符合參考風格）
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(btn => {
        const isActive = btn.getAttribute('data-panel') === panelName;
        if (isActive) {
            btn.classList.add('bg-slate-200', 'text-slate-900', 'font-medium');
            btn.classList.remove('text-slate-700');
        } else {
            btn.classList.remove('bg-slate-200', 'text-slate-900', 'font-medium');
            btn.classList.add('text-slate-700');
        }
    });

    // 控制右側操作按鈕顯示
    const actionMap = {
        appointment: '.panel-action-appointment',
        patient: '.panel-action-patient',
        prescription: '.panel-action-prescription',
        service: '.panel-action-service',
        settings: '.panel-action-settings'
    };
    document.querySelectorAll('.panel-action-appointment, .panel-action-patient, .panel-action-prescription, .panel-action-service, .panel-action-settings')
        .forEach(el => el.classList.add('hidden'));
    const selector = actionMap[panelName];
    if (selector) {
        document.querySelectorAll(selector).forEach(el => el.classList.remove('hidden'));
    }
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
    const overlay = document.getElementById('detailModal');
    if (!overlay) return; // 某些頁面沒有 modal 元素
    const card = overlay.querySelector('div');
    const titleEl = document.getElementById('modalTitle');
    const contentEl = document.getElementById('modalContent');

    // A11y attributes
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'modalTitle');

    titleEl.textContent = title;
    contentEl.innerHTML = content;

    // Initial animation state
    overlay.classList.remove('hidden');
    overlay.classList.add('opacity-0');
    overlay.classList.add('transition-opacity', 'duration-200');
    card.classList.add('transform', 'transition-all', 'duration-200', 'opacity-0', 'translate-y-4');

    // Animate in
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        card.classList.remove('opacity-0', 'translate-y-4');
    });

    // Focus first form control if available
    setTimeout(() => {
        const firstInput = contentEl.querySelector('input, select, textarea, button');
        if (firstInput) firstInput.focus();
    }, 150);
}

function hideModal() {
    const overlay = document.getElementById('detailModal');
    if (!overlay) return; // 某些頁面沒有 modal 元素
    const card = overlay.querySelector('div');
    // Animate out
    overlay.classList.add('opacity-0');
    card.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('opacity-0');
        card.classList.remove('opacity-0', 'translate-y-4');
    }, 180);
}

// 關閉彈窗事件（容錯：頁面可能沒有這些元素）
const closeBtnEl = document.getElementById('closeModal');
if (closeBtnEl) {
    closeBtnEl.addEventListener('click', hideModal);
}

const overlayEl = document.getElementById('detailModal');
if (overlayEl) {
    overlayEl.addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') {
            hideModal();
        }
    });
}

// 導出 UI 函數
window.ui = {
    toggleForm,
    showPanel,
    showMessage,
    showModal,
    hideModal
};
