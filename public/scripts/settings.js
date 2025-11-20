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
            currentUserId = JSON.parse(userData).id;
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
                console.log('✅ Configurações carregadas do banco');
                applySettings();
                return true;
            }
        } else if (response.status === 404) {
            console.log('📝 Criando configurações padrão...');
            await saveSettingsToDatabase();
            return true;
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
            console.log('✅ Configurações salvas no banco');
            return true;
        } else {
            console.error('❌ Erro ao salvar configurações');
            return false;
        }
    } catch (err) {
        console.error('❌ Erro de conexão:', err);
        return false;
    }
}

// ===== ATUALIZAR CONFIGURAÇÃO ESPECÍFICA =====
async function updateSetting(key, value) {
    nuraSettings[key] = value;
    
    // Salvar no banco
    const saved = await saveSettingsToDatabase();
    
    if (saved) {
        console.log(`✅ ${key} = ${value}`);
    } else {
        console.warn(`⚠️ Erro ao salvar ${key}, usando localStorage`);
        localStorage.setItem(`nura_${key}`, value);
    }
    
    return saved;
}

// ===== APLICAR CONFIGURAÇÕES NA INTERFACE =====
function applySettings() {
    // Aplicar modo escuro
    if (nuraSettings.darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Aplicar cor primária
    document.documentElement.style.setProperty('--primary-color', nuraSettings.primaryColor);
    
    // Aplicar filtros
    if (nuraSettings.hideCompleted) {
        applyHideCompleted();
    }
    
    if (nuraSettings.highlightUrgent) {
        applyHighlightUrgent();
    }
    
    console.log('🎨 Configurações aplicadas');
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
            task.style.display = 'block';
        });
    }
    
    showNotification(enabled ? 'Tarefas concluídas ocultadas' : 'Tarefas concluídas visíveis');
    return enabled;
}

// ===== APLICAR HIDE COMPLETED =====
function applyHideCompleted() {
    document.querySelectorAll('[data-task-status="completed"]').forEach(task => {
        task.style.display = 'none';
    });
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
            task.style.order = '';
        });
        showNotification('➡️ Tarefas normalizadas');
    }
    
    return enabled;
}

// ===== APLICAR HIGHLIGHT URGENT =====
function applyHighlightUrgent() {
    const taskContainer = document.querySelector('[data-tasks-container]') || 
                        document.querySelector('.tasks-list') ||
                        document.querySelector('#tasks-container');
    
    if (taskContainer) {
        const tasks = Array.from(taskContainer.querySelectorAll('[data-task-priority]'));
        
        tasks.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const priorityA = a.getAttribute('data-task-priority') || 'low';
            const priorityB = b.getAttribute('data-task-priority') || 'low';
            
            return priorityOrder[priorityA] - priorityOrder[priorityB];
        });
        
        tasks.forEach(task => {
            const priority = task.getAttribute('data-task-priority') || 'low';
            
            if (priority === 'high') {
                task.style.borderLeft = '5px solid #e74c3c';
                task.style.backgroundColor = '#ffe8e8';
                task.style.order = '-1';
            } else if (priority === 'medium') {
                task.style.borderLeft = '5px solid #f39c12';
            } else {
                task.style.borderLeft = '5px solid #2ecc71';
            }
            
            taskContainer.appendChild(task);
        });
    }
}

// ===== ASSISTENTE IA: SUGESTÕES AUTOMÁTICAS =====
async function toggleAutoSuggestions(enabled) {
    const saved = await updateSetting('autoSuggestions', enabled);
    
    if (enabled) {
        console.log('💡 Sugestões automáticas ativadas');
        showNotification('Sugestões de IA ativadas!');
        monitorTasksForSuggestions();
    } else {
        console.log('🔕 Sugestões automáticas desativadas');
        showNotification('Sugestões de IA desativadas');
    }
    
    return enabled;
}

// ===== ASSISTENTE IA: MONITORAR TAREFAS =====
function monitorTasksForSuggestions() {
    if (!nuraSettings.autoSuggestions) return;
    
    const tasks = document.querySelectorAll('[data-task]');
    
    if (tasks.length > 10) {
        showNotification('💡 Dica: Você tem muitas tarefas. Considere priorizar!');
    }
    
    const now = new Date();
    tasks.forEach(task => {
        const dueDate = task.getAttribute('data-task-duedate');
        if (dueDate) {
            const taskDate = new Date(dueDate);
            if (taskDate < now && task.getAttribute('data-task-status') !== 'completed') {
                showNotification('⏰ Alerta: Você tem tarefas vencidas!');
            }
        }
    });
}

// ===== ASSISTENTE IA: NÍVEL DE DETALHAMENTO =====
async function setDetailLevel(level) {
    const saved = await updateSetting('detailLevel', level);
    
    const descriptions = {
        'Básico': 'Informações essenciais',
        'Médio': 'Informações balanceadas',
        'Detalhado': 'Informações completas',
        'Ultra Detalhado': 'Muito detalhado'
    };
    
    showNotification(`Detalhamento: ${level}`);
    return level;
}

// ===== PLANOS: OBTER INFORMAÇÕES =====
function getPlanInfo() {
    const plans = {
        'free': {
            name: 'Gratuito',
            price: 'R$ 0',
            tasks: 10,
            routinesPerWeek: 1,
            features: ['Até 10 tarefas', '1 rotina/semana', 'Sincronização básica']
        },
        'pro': {
            name: 'Pro',
            price: 'R$ 29/mês',
            tasks: 'Ilimitado',
            routinesPerWeek: 5,
            features: ['Tarefas ilimitadas', '5 rotinas/semana', 'Sincronização real-time', 'Sugestões IA']
        },
        'premium': {
            name: 'Premium',
            price: 'R$ 99/mês',
            tasks: 'Ilimitado',
            routinesPerWeek: 'Ilimitado',
            features: ['Tudo no Pro', 'Rotinas ilimitadas', 'IA avançada', 'Suporte 24/7']
        }
    };
    
    return plans[nuraSettings.currentPlan] || plans['pro'];
}

// ===== PLANOS: SELECIONAR PLANO =====
async function selectPlan(planName) {
    if (planName === 'premium') {
        showNotification('🚀 Redirecionando para pagamento...');
        alert('Upgrade para Premium\n\nValor: R$ 99/mês\n\n(Simulado para teste)');
        await updateSetting('currentPlan', 'premium');
    } else if (planName === 'free') {
        if (confirm('⚠️ Você perderá acesso aos recursos Pro')) {
            await updateSetting('currentPlan', 'free');
            showNotification('Downgrade realizado');
        }
    }
}

// ===== PLANOS: GERENCIAR =====
function managePlan() {
    const planInfo = getPlanInfo();
    alert(`Plano Atual: ${planInfo.name}\nPreço: ${planInfo.price}\nRenovação: ${nuraSettings.planRenewalDate}`);
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
    
    return enabled;
}

// ===== APARÊNCIA: TROCAR COR =====
async function setPrimaryColor(hexColor) {
    const saved = await updateSetting('primaryColor', hexColor);
    document.documentElement.style.setProperty('--primary-color', hexColor);
    showNotification(`🎨 Cor atualizada: ${hexColor}`);
}

// ===== NOTIFICAÇÃO =====
function showNotification(message) {
    console.log(`📢 ${message}`);
    const notif = document.getElementById('notification') || 
                 document.querySelector('.notification');
    
    if (notif) {
        notif.textContent = message;
        notif.style.display = 'block';
        setTimeout(() => { notif.style.display = 'none'; }, 3000);
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('⚙️ Carregando configurações...');
    loadSettingsFromDatabase();
});

// ===== EXPORTAR FUNÇÕES =====
window.nuraSettingsFunctions = {
    toggleHideCompleted,
    toggleHighlightUrgent,
    toggleAutoSuggestions,
    setDetailLevel,
    getPlanInfo,
    selectPlan,
    managePlan,
    cancelPlan,
    toggleDarkMode,
    setPrimaryColor,
    getSettings: () => nuraSettings,
    loadSettingsFromDatabase
};

console.log('✅ settings.js carregado!');