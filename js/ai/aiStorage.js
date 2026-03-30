/**
 * aiStorage.js — Conversation and API key storage for BuildMetrics AI Assistant
 * IIFE module: window.AiStorage
 */

const AiStorage = (() => {
    const KEY_CONVS = 'bcp_ai_conversations';
    const KEY_APIKEY = 'bcp_openai_key';

    // Conversations: array of { id, title, createdAt, messages: [{role, content, timestamp}] }

    function getAll() {
        try { return JSON.parse(localStorage.getItem(KEY_CONVS) || '[]'); }
        catch { return []; }
    }

    function saveAll(convs) {
        localStorage.setItem(KEY_CONVS, JSON.stringify(convs));
    }

    function create(title = 'New Conversation') {
        const conv = {
            id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            title,
            createdAt: new Date().toISOString(),
            messages: [],
        };
        const all = getAll();
        all.unshift(conv);
        saveAll(all);
        return conv;
    }

    function get(id) {
        return getAll().find(c => c.id === id) || null;
    }

    function addMessage(convId, role, content) {
        const all = getAll();
        const conv = all.find(c => c.id === convId);
        if (!conv) return null;
        const msg = { role, content, timestamp: new Date().toISOString() };
        conv.messages.push(msg);
        // Auto-title from first user message
        if (role === 'user' && conv.messages.filter(m => m.role === 'user').length === 1) {
            conv.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        }
        saveAll(all);
        return msg;
    }

    function deleteConv(id) {
        saveAll(getAll().filter(c => c.id !== id));
    }

    function clearAll() {
        localStorage.removeItem(KEY_CONVS);
    }

    function getApiKey() {
        return localStorage.getItem(KEY_APIKEY) || '';
    }

    function setApiKey(key) {
        localStorage.setItem(KEY_APIKEY, key);
    }

    function clearApiKey() {
        localStorage.removeItem(KEY_APIKEY);
    }

    return { getAll, create, get, addMessage, deleteConv, clearAll, getApiKey, setApiKey, clearApiKey };
})();

window.AiStorage = AiStorage;
