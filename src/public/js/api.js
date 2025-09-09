// API 模組 - 處理所有網路請求
const API_BASE = '/api';

// API 請求函數（更健壯的 JSON 解析與錯誤處理）
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        const contentType = response.headers.get('content-type') || '';
        let parsed;

        if (contentType.includes('application/json')) {
            parsed = await response.json();
        } else {
            // 非 JSON，讀取文字內容並轉成錯誤物件
            const text = await response.text();
            if (!response.ok) {
                return { success: false, error: { message: `${response.status} ${response.statusText}`, raw: text } };
            }
            // 200 但非 JSON 的情況（理論上不該發生），回傳標準格式
            return { success: true, data: text };
        }

        // 若後端已回傳標準格式，直接回傳；否則包裝一層
        if (typeof parsed === 'object' && parsed && ('success' in parsed)) {
            return parsed;
        }
        if (response.ok) {
            return { success: true, data: parsed };
        }
        return { success: false, error: { message: `${response.status} ${response.statusText}`, raw: parsed } };
    } catch (error) {
        console.error('API 請求錯誤:', error);
        if (window.ui && typeof window.ui.showMessage === 'function') {
            window.ui.showMessage('網路請求失敗', 'error');
        }
        return { success: false, error: { message: '網路請求失敗' } };
    }
}

// 導出 API 函數
window.api = {
    apiRequest,
    API_BASE
};
