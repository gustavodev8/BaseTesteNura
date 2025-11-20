// ===== SISTEMA DE CONFIGURAÇÕES NURA COM BANCO DE DADOS =====
// Arquivo: public/scripts/settings.js

const SETTINGS_API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://basetestenura-3.onrender.com';

let currentUserId = null;

// ===== OBJETO DE CONFIGURAÇÕES =====
const nuraSettings = {
    hideCompleted: false,
    highlightUrgent: true,
    autoSuggestions: true,
    detailLevel: 'Médio',
    darkMode: false,
    primaryColor: '#49a09d',
    currentPlan: 'pro',
    planRenewalDate: '30 de dezembro de 2025'
};

// ===== OBTER ID DO USUÁRIO =====
function getCurrentUserId() {
    if (!currentUserId) {
        const userData = localStorage.getItem('nura_user');
        if (userData) {
            try {
                currentUserId = JSON.parse(userData).id;
            } catch (e) {
                console.error('❌ Erro ao parsear usuário:', e);
                return null;
            }
        }
    }
    return currentUserId;
}

// ===== CARREGAR CONFIGURAÇÕES DO BANCO =====
async function loadSettingsFromDatabase() {
    try {
        const userId = getCurrentUserId();
        
        if (!userId) {
            console.warn('⚠️ Usuário não identificado');
            return false;
        }

        const response = await fetch(`${SETTINGS_API_URL}/api/settings/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.settings) {
                Object.assign(nuraSettings, data.settings);
                console.log('✅ Configurações carregadas do banco:', nuraSettings);
                applySettings();
                updateUIWithSettings();
                return true;
            }
        } else if (response.status === 404) {
            console.log('📝 Criando configurações padrão...');
            await saveSettingsToDatabase();
            updateUIWithSettings();
            return true;
        } else {
            console.error('❌ Erro:', response.status);
            return false;
        }
    } catch (err) {
        console.error('❌ Erro ao carregar configurações:', err);
        return false;
    }
}

// ===== SALVAR CONFIGURAÇÕES NO BANCO =====
async function saveSettingsToDatabase() {
    try {
        const userId = getCurrentUserId();
        
        if (!userId) {
            console.warn('⚠️ Usuário não identificado');
            return false;
        }

        const response = await fetch(`${SETTINGS_API_URL}/api/settings/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            },
            body: JSON.stringify({
                user_id: userId,
                settings: nuraSettings
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                console.log('✅ Configurações salvas no banco');
                return true;
            }
        }
        
        console.error('❌ Erro ao salvar configurações');
        return false;
    } catch (err) {
        console.error('❌ Erro de conexão:', err);
        return false;
    }
}

// ===== APLICAR CONFIGURAÇÕES NA INTERFACE =====
function applySettings() {
    // Aplicar modo escuro
    if (nuraSettings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Aplicar cor primária
    document.documentElement.style.setProperty('--primary-color', nuraSettings.primaryColor);
    
    console.log('🎨 Configurações aplicadas');
}

// ===== ATUALIZAR INTERFACE COM AS CONFIGURAÇÕES =====
function updateUIWithSettings() {
    console.log('🔄 Atualizando interface com:', nuraSettings);
    
    // Atualizar toggle do modo escuro
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        if (nuraSettings.darkMode) {
            darkModeToggle.classList.add('active');
        } else {
            darkModeToggle.classList.remove('active');
        }
    }
    
    // Atualizar TODOS os toggles
    document.querySelectorAll('.setting-row').forEach(row => {
        const toggle = row.querySelector('.toggle-switch');
        if (!toggle) return;
        
        const label = row.querySelector('.setting-label');
        if (!label) return;
        
        const text = label.textContent.toLowerCase();
        
        // Mapear cada toggle para sua configuração
        if (text.includes('modo escuro')) {
            toggle.classList.toggle('active', nuraSettings.darkMode);
        } else if (text.includes('ocultar tarefas') || text.includes('concluídas')) {
            toggle.classList.toggle('active', nuraSettings.hideCompleted);
        } else if (text.includes('destacar') || text.includes('urgentes')) {
            toggle.classList.toggle('active', nuraSettings.highlightUrgent);
        } else if (text.includes('sugestões')) {
            toggle.classList.toggle('active', nuraSettings.autoSuggestions);
        }
    });
    
    // Atualizar cor ativa
    document.querySelectorAll('.color-option').forEach(color => {
        const colorValue = color.getAttribute('data-color');
        if (colorValue === nuraSettings.primaryColor) {
            color.classList.add('active');
        } else {
            color.classList.remove('active');
        }
    });
    
    // Atualizar select de detalhamento
    const detailSelect = document.querySelector('select');
    if (detailSelect) {
        detailSelect.value = nuraSettings.detailLevel;
    }
    
    console.log('✅ Interface atualizada!');
}

// ===== FILTRO: OCULTAR TAREFAS CONCLUÍDAS =====
async function toggleHideCompleted(enabled) {
    nuraSettings.hideCompleted = enabled;
    
    // Atualizar UI imediatamente
    const toggle = Array.from(document.querySelectorAll('.toggle-switch')).find(t => {
        const row = t.closest('.setting-row');
        return row?.textContent.toLowerCase().includes('ocultar tarefas');
    });
    if (toggle) toggle.classList.toggle('active', enabled);
    
    document.querySelectorAll('[data-task-status="completed"]').forEach(task => {
        task.style.display = enabled ? 'none' : '';
    });
    
    await saveSettingsToDatabase();
    showNotification(enabled ? '👁️ Tarefas concluídas ocultadas' : '👁️ Tarefas concluídas visíveis');
}

// ===== FILTRO: DESTACAR TAREFAS URGENTES =====
async function toggleHighlightUrgent(enabled) {
    nuraSettings.highlightUrgent = enabled;
    
    const toggle = Array.from(document.querySelectorAll('.toggle-switch')).find(t => {
        const row = t.closest('.setting-row');
        return row?.textContent.toLowerCase().includes('destacar');
    });
    if (toggle) toggle.classList.toggle('active', enabled);
    
    if (enabled) {
        applyHighlightUrgent();
    } else {
        document.querySelectorAll('[data-task-priority]').forEach(task => {
            task.style.borderLeft = '';
            task.style.backgroundColor = '';
        });
    }
    
    await saveSettingsToDatabase();
    showNotification(enabled ? '🚨 Tarefas urgentes destacadas' : '➡️ Tarefas normalizadas');
}

// ===== APLICAR HIGHLIGHT URGENT =====
function applyHighlightUrgent() {
    const tasks = document.querySelectorAll('[data-task-priority]');
    
    tasks.forEach(task => {
        const priority = task.getAttribute('data-task-priority') || 'low';
        
        if (priority === 'high') {
            task.style.borderLeft = '5px solid #e74c3c';
            task.style.backgroundColor = '#ffe8e8';
        } else if (priority === 'medium') {
            task.style.borderLeft = '5px solid #f39c12';
            task.style.backgroundColor = '#fff5e6';
        } else {
            task.style.borderLeft = '5px solid #2ecc71';
            task.style.backgroundColor = '#f0fdf4';
        }
    });
}

// ===== ASSISTENTE IA: SUGESTÕES AUTOMÁTICAS =====
async function toggleAutoSuggestions(enabled) {
    nuraSettings.autoSuggestions = enabled;
    
    const toggle = Array.from(document.querySelectorAll('.toggle-switch')).find(t => {
        const row = t.closest('.setting-row');
        return row?.textContent.toLowerCase().includes('sugestões');
    });
    if (toggle) toggle.classList.toggle('active', enabled);
    
    await saveSettingsToDatabase();
    showNotification(enabled ? '💡 Sugestões de IA ativadas!' : '🔕 Sugestões de IA desativadas');
}

// ===== ASSISTENTE IA: NÍVEL DE DETALHAMENTO =====
async function setDetailLevel(level) {
    nuraSettings.detailLevel = level;
    await saveSettingsToDatabase();
    showNotification(`📊 Detalhamento: ${level}`);
}

// ===== PLANOS: OBTER INFORMAÇÕES =====
function getPlanInfo() {
    const plans = {
        'free': {
            name: 'Gratuito',
            price: 'R$ 0',
            tasks: 10,
            features: ['Até 10 tarefas', '1 rotina/semana', 'Sincronização básica']
        },
        'pro': {
            name: 'Pro',
            price: 'R$ 29/mês',
            tasks: 'Ilimitado',
            features: ['Tarefas ilimitadas', '5 rotinas/semana', 'Sincronização real-time', 'Sugestões IA']
        },
        'premium': {
            name: 'Premium',
            price: 'R$ 99/mês',
            tasks: 'Ilimitado',
            features: ['Tudo no Pro', 'Rotinas ilimitadas', 'IA avançada', 'Suporte 24/7']
        }
    };
    
    return plans[nuraSettings.currentPlan] || plans['pro'];
}

// ===== PLANOS: SELECIONAR PLANO =====
async function selectPlan(planName) {
    if (planName === 'premium') {
        if (confirm('🚀 Upgrade para Premium - R$ 99/mês?\n\n(Simulado para teste)')) {
            nuraSettings.currentPlan = 'premium';
            await saveSettingsToDatabase();
            showNotification('🚀 Upgrade realizado!');
        }
    } else if (planName === 'free') {
        if (confirm('⚠️ Você perderá acesso aos recursos Pro. Tem certeza?')) {
            nuraSettings.currentPlan = 'free';
            await saveSettingsToDatabase();
            showNotification('📉 Downgrade realizado');
        }
    }
}

// ===== PLANOS: CANCELAR =====
async function cancelPlan() {
    if (confirm('⚠️ Cancelar assinatura? Você será downgrade em 30 dias')) {
        nuraSettings.currentPlan = 'free';
        await saveSettingsToDatabase();
        showNotification('❌ Assinatura cancelada');
    }
}

// ===== APARÊNCIA: MODO ESCURO =====
async function toggleDarkMode(enabled) {
    nuraSettings.darkMode = enabled;
    
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.classList.toggle('active', enabled);
    
    document.body.classList.toggle('dark-mode', enabled);
    
    await saveSettingsToDatabase();
    showNotification(enabled ? '🌙 Modo escuro ativado' : '☀️ Modo claro ativado');
}

// ===== APARÊNCIA: TROCAR COR =====
async function setPrimaryColor(hexColor) {
    nuraSettings.primaryColor = hexColor;
    
    document.querySelectorAll('.color-option').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-color') === hexColor);
    });
    
    document.documentElement.style.setProperty('--primary-color', hexColor);
    
    await saveSettingsToDatabase();
    showNotification('🎨 Cor atualizada');
}

// ===== NOTIFICAÇÃO =====
function showNotification(message) {
    console.log(`📢 ${message}`);
    
    let notif = document.getElementById('notification');
    
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'notification';
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #49a09d;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 9999;
            font-size: 14px;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notif);
    }
    
    notif.textContent = message;
    notif.style.display = 'block';
    notif.style.opacity = '1';
    
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => {
            notif.style.display = 'none';
        }, 300);
    }, 3000);
}

// ===== INICIALIZAR - CARREGAR CONFIGURAÇÕES =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('⚙️ Carregando sistema de configurações...');
    loadSettingsFromDatabase();
});

// ===== EVENTOS DO HTML ORIGINAL =====
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            const newState = !nuraSettings.darkMode;
            toggleDarkMode(newState);
        });
    }
    
    // Cores
    document.querySelectorAll('.color-option').forEach(color => {
        color.addEventListener('click', function() {
            const hexColor = this.getAttribute('data-color');
            setPrimaryColor(hexColor);
        });
    });
    
    // Toggle switches
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('click', function() {
            const row = this.closest('.setting-row');
            if (!row) return;
            
            const label = row.querySelector('.setting-label');
            if (!label) return;
            
            const text = label.textContent.toLowerCase();
            
            if (text.includes('modo escuro')) {
                toggleDarkMode(!nuraSettings.darkMode);
            } else if (text.includes('ocultar tarefas') || text.includes('concluídas')) {
                toggleHideCompleted(!nuraSettings.hideCompleted);
            } else if (text.includes('destacar') || text.includes('urgentes')) {
                toggleHighlightUrgent(!nuraSettings.highlightUrgent);
            } else if (text.includes('sugestões')) {
                toggleAutoSuggestions(!nuraSettings.autoSuggestions);
            }
        });
    });
});

// ===== EXPORTAR FUNÇÕES =====
window.nuraSettingsFunctions = {
    loadSettingsFromDatabase,
    saveSettingsToDatabase,
    toggleHideCompleted,
    toggleHighlightUrgent,
    toggleAutoSuggestions,
    setDetailLevel,
    getPlanInfo,
    selectPlan,
    cancelPlan,
    toggleDarkMode,
    setPrimaryColor,
    showNotification,
    getSettings: () => ({ ...nuraSettings })
};

console.log('✅ settings.js carregado e pronto!');