/* ========================================
   SISTEMA DE CONFIGURAÇÕES - NURA
   Arquivo: settings.js
   Funcionalidade: Gerenciar configurações do usuário
   ======================================== */

const API_URL = 'https://basetestenura-3.onrender.com';
let currentUser = null;
let userSettings = {};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('⚙️ Inicializando sistema de configurações...');
    
    // Obter usuário logado
    currentUser = getCurrentUser();
    
    if (!currentUser) {
        console.error('❌ Usuário não está logado!');
        window.location.href = '/login';
        return;
    }
    
    console.log('👤 Usuário logado:', currentUser.username);
    
    // Carregar configurações do usuário
    loadUserSettings();
    
    // Inicializar event listeners
    initializeEventListeners();
});

// ===== CARREGAR CONFIGURAÇÕES DO USUÁRIO =====
async function loadUserSettings() {
    if (!currentUser) return;
    
    try {
        console.log(`📥 Carregando configurações do usuário ${currentUser.id}...`);
        
        const response = await fetch(`${API_URL}/api/settings/${currentUser.id}`, {
            method: 'GET',
            headers: {
                'x-user-id': currentUser.id.toString()
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            userSettings = result.settings;
            console.log('✅ Configurações carregadas:', userSettings);
            
            // Aplicar configurações na interface
            applySettingsToInterface();
        } else {
            console.log('📝 Criando configurações padrão...');
            // Se não existir, criar com valores padrão
            userSettings = createDefaultSettings();
            await saveUserSettings();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar configurações:', error);
        // Usar configurações padrão em caso de erro
        userSettings = createDefaultSettings();
        applySettingsToInterface();
    }
}

// ===== CRIAR CONFIGURAÇÕES PADRÃO =====
function createDefaultSettings() {
    return {
        hideCompleted: true,        // Ocultar tarefas concluídas
        highlightUrgent: true,      // Destacar tarefas urgentes
        autoSuggestions: true,      // Sugestões automáticas da IA
        detailLevel: 'Médio',       // Nível de detalhamento
        darkMode: false,            // Modo escuro
        primaryColor: '#49a09d',    // Cor principal
        currentPlan: 'pro',         // Plano atual
        planRenewalDate: '30 de dezembro de 2025'
    };
}

// ===== APLICAR CONFIGURAÇÕES NA INTERFACE =====
function applySettingsToInterface() {
    console.log('🎨 Aplicando configurações na interface...');
    
    // 1. Toggle switches
    const toggles = {
        'hide-completed': userSettings.hideCompleted,
        'highlight-urgent': userSettings.highlightUrgent,
        'auto-suggestions': userSettings.autoSuggestions,
        'dark-mode': userSettings.darkMode
    };
    
    Object.entries(toggles).forEach(([id, isActive]) => {
        const toggle = document.querySelector(`[data-setting="${id}"]`) || 
                      document.querySelector(`#${id}Toggle`) ||
                      document.getElementById(id);
        
        if (toggle) {
            if (isActive) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    });
    
    // 2. Modo escuro
    if (userSettings.darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // 3. Cor principal
    if (userSettings.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', userSettings.primaryColor);
        
        // Marcar cor ativa
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.color === userSettings.primaryColor) {
                option.classList.add('active');
            }
        });
    }
    
    // 4. Selects
    const selects = {
        'detail-level': userSettings.detailLevel
    };
    
    Object.entries(selects).forEach(([id, value]) => {
        const select = document.querySelector(`[data-setting="${id}"]`) || document.getElementById(id);
        if (select && select.tagName === 'SELECT') {
            select.value = value;
        }
    });
    
    console.log('✅ Interface atualizada com as configurações');
}

// ===== INICIALIZAR EVENT LISTENERS =====
function initializeEventListeners() {
    console.log('🔗 Inicializando event listeners...');
    
    // 1. Toggle switches - Buscar por diferentes seletores
    const allToggles = [
        ...document.querySelectorAll('.toggle-switch'),
        ...document.querySelectorAll('[data-toggle]'),
        ...document.querySelectorAll('.setting-control .toggle-switch')
    ];
    
    allToggles.forEach((toggle, index) => {
        if (!toggle.dataset.listenerAdded) {
            toggle.addEventListener('click', handleToggleClick);
            toggle.dataset.listenerAdded = 'true';
            console.log(`📌 Listener adicionado ao toggle ${index + 1}`);
        }
    });
    
    // 2. Cores
    document.querySelectorAll('.color-option').forEach(color => {
        if (!color.dataset.listenerAdded) {
            color.addEventListener('click', () => handleColorChange(color.dataset.color));
            color.dataset.listenerAdded = 'true';
        }
    });
    
    // 3. Selects
    document.querySelectorAll('select').forEach(select => {
        if (!select.dataset.listenerAdded) {
            select.addEventListener('change', handleSelectChange);
            select.dataset.listenerAdded = 'true';
        }
    });
    
    // 4. Navegação entre seções
    document.querySelectorAll('.nav-item').forEach(item => {
        if (!item.dataset.navListenerAdded) {
            item.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                item.classList.add('active');
                document.getElementById(item.dataset.section).classList.add('active');
            });
            item.dataset.navListenerAdded = 'true';
        }
    });
    
    console.log('✅ Event listeners inicializados');
}

// ===== MANIPULAR TOGGLE CLICKS =====
async function handleToggleClick(event) {
    const toggle = event.target.closest('.toggle-switch');
    if (!toggle) return;
    
    const isActive = toggle.classList.contains('active');
    const newValue = !isActive;
    
    // Determinar qual configuração está sendo alterada
    let settingKey = null;
    let settingName = '';
    
    // Buscar pelo contexto da configuração
    const parentRow = toggle.closest('.setting-row');
    if (parentRow) {
        const label = parentRow.querySelector('.setting-label');
        if (label) {
            const labelText = label.textContent.trim().toLowerCase();
            
            if (labelText.includes('ocultar tarefas concluídas')) {
                settingKey = 'hideCompleted';
                settingName = 'Ocultar tarefas concluídas';
            } else if (labelText.includes('destacar tarefas urgentes')) {
                settingKey = 'highlightUrgent';
                settingName = 'Destacar tarefas urgentes';
            } else if (labelText.includes('sugestões automáticas')) {
                settingKey = 'autoSuggestions';
                settingName = 'Sugestões automáticas';
            } else if (labelText.includes('modo escuro')) {
                settingKey = 'darkMode';
                settingName = 'Modo escuro';
            }
        }
    }
    
    // Se não conseguiu identificar pelo contexto, tentar por ID
    if (!settingKey && toggle.id) {
        if (toggle.id.includes('darkMode')) {
            settingKey = 'darkMode';
            settingName = 'Modo escuro';
        }
    }
    
    if (!settingKey) {
        console.warn('⚠️ Não foi possível identificar a configuração do toggle');
        return;
    }
    
    console.log(`🔄 Alterando ${settingName}: ${isActive} → ${newValue}`);
    
    try {
        // Atualizar visualmente primeiro (feedback imediato)
        if (newValue) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
        
        // Aplicar mudanças específicas
        if (settingKey === 'darkMode') {
            if (newValue) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
        
        // Salvar no backend
        await updateSetting(settingKey, newValue);
        
        // Atualizar configurações locais
        userSettings[settingKey] = newValue;
        
        // Aplicar mudanças nas outras telas (se necessário)
        applySettingToOtherPages(settingKey, newValue);
        
        showNotification(`✅ ${settingName} ${newValue ? 'ativado' : 'desativado'}!`);
        
    } catch (error) {
        console.error('❌ Erro ao salvar configuração:', error);
        
        // Reverter mudança visual em caso de erro
        if (newValue) {
            toggle.classList.remove('active');
        } else {
            toggle.classList.add('active');
        }
        
        if (settingKey === 'darkMode') {
            document.body.classList.toggle('dark-mode');
        }
        
        showNotification('❌ Erro ao salvar configuração');
    }
}

// ===== MANIPULAR MUDANÇAS DE COR =====
async function handleColorChange(color) {
    console.log(`🎨 Alterando cor principal para: ${color}`);
    
    try {
        // Atualizar visualmente
        document.querySelectorAll('.color-option').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-color="${color}"]`).classList.add('active');
        
        // Aplicar cor
        document.documentElement.style.setProperty('--primary-color', color);
        
        // Salvar no backend
        await updateSetting('primaryColor', color);
        
        // Atualizar configurações locais
        userSettings.primaryColor = color;
        
        showNotification('✅ Cor alterada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao salvar cor:', error);
        showNotification('❌ Erro ao salvar cor');
    }
}

// ===== MANIPULAR SELECTS =====
async function handleSelectChange(event) {
    const select = event.target;
    const value = select.value;
    
    let settingKey = null;
    let settingName = '';
    
    // Identificar qual select
    const parentRow = select.closest('.setting-row');
    if (parentRow) {
        const label = parentRow.querySelector('.setting-label');
        if (label) {
            const labelText = label.textContent.trim().toLowerCase();
            
            if (labelText.includes('nível de detalhamento')) {
                settingKey = 'detailLevel';
                settingName = 'Nível de detalhamento';
            }
        }
    }
    
    if (!settingKey) return;
    
    console.log(`📋 Alterando ${settingName} para: ${value}`);
    
    try {
        await updateSetting(settingKey, value);
        userSettings[settingKey] = value;
        showNotification(`✅ ${settingName} alterado para "${value}"!`);
    } catch (error) {
        console.error('❌ Erro ao salvar configuração:', error);
        showNotification('❌ Erro ao salvar configuração');
    }
}

// ===== ATUALIZAR CONFIGURAÇÃO NO BACKEND =====
async function updateSetting(key, value) {
    if (!currentUser) {
        throw new Error('Usuário não identificado');
    }
    
    try {
        const response = await fetch(`${API_URL}/api/settings/${currentUser.id}/${key}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': currentUser.id.toString()
            },
            body: JSON.stringify({ value })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erro desconhecido');
        }
        
        console.log(`✅ Configuração ${key} salva no servidor`);
        return result;
        
    } catch (error) {
        console.error('❌ Erro ao comunicar com servidor:', error);
        throw error;
    }
}

// ===== SALVAR TODAS AS CONFIGURAÇÕES =====
async function saveUserSettings() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/api/settings/${currentUser.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': currentUser.id.toString()
            },
            body: JSON.stringify({ settings: userSettings })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Todas as configurações salvas');
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar configurações:', error);
    }
}

// ===== APLICAR CONFIGURAÇÕES EM OUTRAS PÁGINAS =====
function applySettingToOtherPages(settingKey, value) {
    // Salvar no localStorage para outras páginas acessarem
    const settingsForOtherPages = JSON.parse(localStorage.getItem('nura_settings') || '{}');
    settingsForOtherPages[settingKey] = value;
    localStorage.setItem('nura_settings', JSON.stringify(settingsForOtherPages));
    
    console.log(`💾 Configuração ${settingKey} salva no localStorage para outras páginas`);
}

// ===== OBTER USUÁRIO ATUAL =====
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// ===== MOSTRAR NOTIFICAÇÃO =====
function showNotification(message) {
    // Remover notificação existente
    const existing = document.querySelector('.settings-notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'settings-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #49a09d;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        font-size: 0.9rem;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== EXPORTAR FUNÇÕES GLOBAIS =====
window.loadUserSettings = loadUserSettings;
window.applySettingsToInterface = applySettingsToInterface;
window.updateSetting = updateSetting;

console.log('✅ settings.js carregado!');