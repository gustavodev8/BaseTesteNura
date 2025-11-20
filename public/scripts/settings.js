// ===== SISTEMA DE CONFIGURAÇÕES NURA COM BANCO DE DADOS =====
// Arquivo: public/scripts/settings.js

const API_URL = window.location.hostname === 'localhost' 
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

        const response = await fetch(`${API_URL}/api/settings/${userId}`, {
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

        const response = await fetch(`${API_URL}/api/settings/${userId}`, {
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

// ===== ATUALIZAR CONFIGURAÇÃO ESPECÍFICA =====
async function updateSetting(key, value) {
    nuraSettings[key] = value;
    const saved = await saveSettingsToDatabase();
    
    if (saved) {
        console.log(`✅ ${key} = ${value}`);
    } else {
        console.warn(`⚠️ Erro ao salvar ${key}`);
    }
    
    return saved;
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
    // Atualizar toggle do modo escuro
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        if (nuraSettings.darkMode) {
            darkModeToggle.classList.add('active');
        } else {
            darkModeToggle.classList.remove('active');
        }
    }
    
    // Atualizar cor ativa
    document.querySelectorAll('.color-option').forEach(color => {
        if (color.getAttribute('data-color') === nuraSettings.primaryColor) {
            color.classList.add('active');
        } else {
            color.classList.remove('active');
        }
    });
    
    // Atualizar toggles
    const toggles = document.querySelectorAll('.toggle-switch');
    toggles.forEach(toggle => {
        const key = toggle.textContent.toLowerCase();
        if (key.includes('escuro') || key.includes('dark')) {
            if (nuraSettings.darkMode) toggle.classList.add('active');
        } else if (key.includes('concluída') || key.includes('completed')) {
            if (nuraSettings.hideCompleted) toggle.classList.add('active');
        } else if (key.includes('urgente') || key.includes('urgent')) {
            if (nuraSettings.highlightUrgent) toggle.classList.add('active');
        } else if (key.includes('sugestão') || key.includes('suggestion')) {
            if (nuraSettings.autoSuggestions) toggle.classList.add('active');
        }
    });
}

// ===== FILTRO: OCULTAR TAREFAS CONCLUÍDAS =====
async function toggleHideCompleted(enabled) {
    const saved = await updateSetting('hideCompleted', enabled);
    
    if (enabled) {
        console.log('🙈 Tarefas concluídas ocultadas');
        document.querySelectorAll('[data-task-status="completed"]').forEach(task => {
            task.style.display = 'none';
        });
    } else {
        console.log('👁️ Tarefas concluídas visíveis');
        document.querySelectorAll('[data-task-status="completed"]').forEach(task => {
            task.style.display = '';
        });
    }
    
    showNotification(enabled ? '👁️ Tarefas concluídas ocultadas' : '👁️ Tarefas concluídas visíveis');
    return saved;
}

// ===== FILTRO: DESTACAR TAREFAS URGENTES =====
async function toggleHighlightUrgent(enabled) {
    const saved = await updateSetting('highlightUrgent', enabled);
    
    if (enabled) {
        applyHighlightUrgent();
        showNotification('🚨 Tarefas urgentes destacadas');
    } else {
        document.querySelectorAll('[data-task-priority]').forEach(task => {
            task.style.borderLeft = '';
            task.style.backgroundColor = '';
        });
        showNotification('➡️ Tarefas normalizadas');
    }
    
    return saved;
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
    const saved = await updateSetting('autoSuggestions', enabled);
    
    if (enabled) {
        console.log('💡 Sugestões automáticas ativadas');
        showNotification('💡 Sugestões de IA ativadas!');
    } else {
        console.log('🔕 Sugestões automáticas desativadas');
        showNotification('🔕 Sugestões de IA desativadas');
    }
    
    return saved;
}

// ===== ASSISTENTE IA: NÍVEL DE DETALHAMENTO =====
async function setDetailLevel(level) {
    const saved = await updateSetting('detailLevel', level);
    showNotification(`📊 Detalhamento: ${level}`);
    return saved;
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
            await updateSetting('currentPlan', 'premium');
            showNotification('🚀 Upgrade realizado!');
        }
    } else if (planName === 'free') {
        if (confirm('⚠️ Você perderá acesso aos recursos Pro. Tem certeza?')) {
            await updateSetting('currentPlan', 'free');
            showNotification('📉 Downgrade realizado');
        }
    }
}

// ===== PLANOS: CANCELAR =====
async function cancelPlan() {
    if (confirm('⚠️ Cancelar assinatura? Você será downgrade em 30 dias')) {
        await updateSetting('currentPlan', 'free');
        showNotification('❌ Assinatura cancelada');
    }
}

// ===== APARÊNCIA: MODO ESCURO =====
async function toggleDarkMode(enabled) {
    const saved = await updateSetting('darkMode', enabled);
    
    if (enabled) {
        document.body.classList.add('dark-mode');
        showNotification('🌙 Modo escuro ativado');
    } else {
        document.body.classList.remove('dark-mode');
        showNotification('☀️ Modo claro ativado');
    }
    
    return saved;
}

// ===== APARÊNCIA: TROCAR COR =====
async function setPrimaryColor(hexColor) {
    const saved = await updateSetting('primaryColor', hexColor);
    document.documentElement.style.setProperty('--primary-color', hexColor);
    showNotification(`🎨 Cor atualizada`);
    return saved;
}

// ===== NOTIFICAÇÃO =====
function showNotification(message) {
    console.log(`📢 ${message}`);
    
    // Tentar encontrar elemento de notificação
    let notif = document.getElementById('notification');
    
    if (!notif) {
        // Criar elemento se não existir
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
// Os eventos já existem no HTML inline, apenas garantindo que funcionem

// Dark Mode Toggle
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            const newState = !nuraSettings.darkMode;
            toggleDarkMode(newState);
            this.classList.toggle('active');
        });
    }
    
    // Cores - mantendo o comportamento original
    document.querySelectorAll('.color-option').forEach(color => {
        color.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const hexColor = this.getAttribute('data-color');
            setPrimaryColor(hexColor);
        });
    });
    
    // Toggle switches - mantendo comportamento original
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Identificar qual toggle foi clicado pelo contexto
            const parent = this.closest('.setting-row') || this.closest('[class*="setting"]');
            if (parent) {
                const text = parent.textContent.toLowerCase();
                
                if (text.includes('escuro') || text.includes('dark mode')) {
                    toggleDarkMode(!nuraSettings.darkMode);
                } else if (text.includes('concluída') || text.includes('hide completed')) {
                    toggleHideCompleted(!nuraSettings.hideCompleted);
                } else if (text.includes('urgente') || text.includes('highlight urgent')) {
                    toggleHighlightUrgent(!nuraSettings.highlightUrgent);
                } else if (text.includes('sugestão') || text.includes('auto suggestion')) {
                    toggleAutoSuggestions(!nuraSettings.autoSuggestions);
                }
            }
        });
    });
});

// ===== EXPORTAR FUNÇÕES =====
window.nuraSettingsFunctions = {
    loadSettingsFromDatabase,
    saveSettingsToDatabase,
    updateSetting,
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