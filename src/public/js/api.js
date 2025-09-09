// API 模組 - 處理所有網路請求
const API_BASE = '/api';

// API 請求函數
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API 請求錯誤:', error);
        showMessage('網路請求失敗', 'error');
        return { success: false, error: { message: '網路請求失敗' } };
    }
}

// 導出 API 函數
window.api = {
    apiRequest,
    API_BASE
};