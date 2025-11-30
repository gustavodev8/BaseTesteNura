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
    planRenewalDate: '30 de dezembro de 2025',
    viewMode: 'lista',
    emailNotifications: true,
    whatsappNotifications: false,
    whatsappNumber: ''
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

// ===== OBTER USUÁRIO COMPLETO =====
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('nura_user');
        if (!userStr) return null;
        
        const user = JSON.parse(userStr);
        return user && user.id ? user : null;
    } catch (error) {
        console.error('❌ Erro ao buscar usuário:', error);
        return null;
    }
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
        } else if (text.includes('resumo diário') || text.includes('email')) {
            toggle.classList.toggle('active', nuraSettings.emailNotifications);
        }
    });
    
    // Atualizar toggle de WhatsApp
    const whatsappToggle = document.getElementById('whatsapp-notifications');
    if (whatsappToggle) {
        whatsappToggle.checked = nuraSettings.whatsappNotifications;
    }
    
    // Atualizar campo de número de WhatsApp
    const whatsappInput = document.getElementById('whatsapp-number');
    if (whatsappInput) {
        whatsappInput.value = nuraSettings.whatsappNumber || '';
    }
    
    // Atualizar cor ativa
    document.querySelectorAll('.color-option').forEach(color => {
        const colorValue = color.getAttribute('data-color');
        if (colorValue === nuraSettings.primaryColor) {
            color.classList.add('active');
        } else {
            color.classList.remove('active');
        }
    });
    
    // Atualizar selects
    document.querySelectorAll('.setting-row').forEach(row => {
        const select = row.querySelector('select');
        if (!select) return;
        
        const label = row.querySelector('.setting-label');
        if (!label) return;
        
        const text = label.textContent.toLowerCase();
        
        if (text.includes('detalhamento')) {
            select.value = nuraSettings.detailLevel;
        } else if (text.includes('exibição')) {
            select.value = nuraSettings.viewMode || 'Lista';
        }
    });
    
    console.log('✅ Interface atualizada!');
}

// ===== MODO DE VISUALIZAÇÃO =====
async function setViewMode(mode) {
    const modeLower = mode.toLowerCase();
    nuraSettings.viewMode = modeLower;
    
    await saveSettingsToDatabase();
    showNotification(`📊 Modo de visualização: ${mode}`);
    
    // Atualizar visualização se estiver na página de tarefas
    if (window.renderAllTasks) {
        window.renderAllTasks();
    }
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
    
    // Ocultar coluna de concluídos no Kanban
    const completedColumn = document.querySelector('[data-kanban-column="completed"]');
    if (completedColumn) {
        completedColumn.style.display = enabled ? 'none' : '';
    }
    
    await saveSettingsToDatabase();
    showNotification(enabled ? '👁️ Tarefas concluídas ocultadas' : '👁️ Tarefas concluídas visíveis');
}

// ===== FILTRO: DESTACAR TAREFAS URGENTES =====
async function toggleHighlightUrgent(enabled) {
    nuraSettings.highlightUrgent = enabled;
    
    // Atualizar toggle visual
    const toggle = Array.from(document.querySelectorAll('.toggle-switch')).find(t => {
        const row = t.closest('.setting-row');
        return row?.textContent.toLowerCase().includes('destacar');
    });
    if (toggle) toggle.classList.toggle('active', enabled);
    
    console.log('🎨 Destacar urgentes:', enabled);
    
    if (enabled) {
        // Aplicar destaques
        console.log('✅ Aplicando destaques...');
        
        // Para cards do Kanban
        document.querySelectorAll('.kanban-card[data-task-priority="high"]').forEach(task => {
            console.log('🔴 Card HIGH encontrado');
            task.style.borderLeft = '4px solid #e74c3c';
            task.style.boxShadow = '0 2px 8px rgba(231, 76, 60, 0.3)';
        });
        
        document.querySelectorAll('.kanban-card[data-task-priority="medium"]').forEach(task => {
            console.log('🟡 Card MEDIUM encontrado');
            task.style.borderLeft = '4px solid #f39c12';
            task.style.boxShadow = '0 2px 8px rgba(243, 156, 18, 0.2)';
        });
        
        document.querySelectorAll('.kanban-card[data-task-priority="low"]').forEach(task => {
            console.log('🟢 Card LOW encontrado');
            task.style.borderLeft = '4px solid #2ecc71';
            task.style.boxShadow = '0 2px 8px rgba(46, 204, 113, 0.2)';
        });
        
        // Para lista
        document.querySelectorAll('.list-group-item[data-task-priority="high"]').forEach(task => {
            console.log('🔴 Lista HIGH encontrado');
            task.style.borderLeft = '5px solid #e74c3c';
            task.style.backgroundColor = '#ffe8e8';
        });
        
        document.querySelectorAll('.list-group-item[data-task-priority="medium"]').forEach(task => {
            console.log('🟡 Lista MEDIUM encontrado');
            task.style.borderLeft = '5px solid #f39c12';
            task.style.backgroundColor = '#fff5e6';
        });
        
        document.querySelectorAll('.list-group-item[data-task-priority="low"]').forEach(task => {
            console.log('🟢 Lista LOW encontrado');
            task.style.borderLeft = '5px solid #2ecc71';
            task.style.backgroundColor = '#f0fdf4';
        });
        
    } else {
        // Remover destaques
        console.log('❌ Removendo destaques...');
        
        document.querySelectorAll('[data-task-priority]').forEach(task => {
            if (task.classList.contains('kanban-card')) {
                task.style.borderLeft = '';
                task.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            } else {
                task.style.borderLeft = '';
                task.style.backgroundColor = '';
            }
        });
    }
    
    await saveSettingsToDatabase();
    showNotification(enabled ? '🚨 Tarefas urgentes destacadas' : '➡️ Tarefas normalizadas');
}

// ===== APLICAR HIGHLIGHT URGENT =====
function applyHighlightUrgent() {
    console.log('🎨 Aplicando destaques nas tarefas...');
    
    const tasks = document.querySelectorAll('[data-task-priority]');
    console.log('📊 Total de tarefas encontradas:', tasks.length);
    
    tasks.forEach(task => {
        const priority = task.getAttribute('data-task-priority') || 'medium';
        console.log('Tarefa com prioridade:', priority);
        
        if (task.classList.contains('kanban-card')) {
            // Estilo para cards Kanban
            if (priority === 'high') {
                task.style.borderLeft = '4px solid #e74c3c';
                task.style.boxShadow = '0 2px 8px rgba(231, 76, 60, 0.3)';
            } else if (priority === 'medium') {
                task.style.borderLeft = '4px solid #f39c12';
                task.style.boxShadow = '0 2px 8px rgba(243, 156, 18, 0.2)';
            } else {
                task.style.borderLeft = '4px solid #2ecc71';
                task.style.boxShadow = '0 2px 8px rgba(46, 204, 113, 0.2)';
            }
        } else {
            // Estilo para lista
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

// ===== NOTIFICAÇÕES POR EMAIL =====
async function toggleEmailNotifications(enabled) {
    nuraSettings.emailNotifications = enabled;
    
    // Atualizar toggle visual
    const toggle = Array.from(document.querySelectorAll('.toggle-switch')).find(t => {
        const row = t.closest('.setting-row');
        const text = row?.textContent.toLowerCase();
        return text && (text.includes('resumo diário') || text.includes('email'));
    });
    
    if (toggle) {
        toggle.classList.toggle('active', enabled);
    }
    
    await saveSettingsToDatabase();
    
    if (enabled) {
        showNotification('📧 Resumo diário por email ATIVADO - Você receberá emails às 07:58 com suas tarefas pendentes');
    } else {
        showNotification('📪 Resumo diário por email DESATIVADO - Você não receberá mais emails automáticos');
    }
}

// ===== NOTIFICAÇÕES POR WHATSAPP =====
async function toggleWhatsappNotifications(enabled) {
    nuraSettings.whatsappNotifications = enabled;
    
    // Verificar se tem número cadastrado
    if (enabled && !nuraSettings.whatsappNumber) {
        showNotification('⚠️ Por favor, cadastre seu número de WhatsApp primeiro!');
        
        // Desativar toggle
        const toggle = document.getElementById('whatsapp-notifications');
        if (toggle) toggle.checked = false;
        
        nuraSettings.whatsappNotifications = false;
        return;
    }
    
    await saveSettingsToDatabase();
    
    if (enabled) {
        showNotification('📱 Notificações por WhatsApp ATIVADAS - Você receberá mensagens às 07:58 com suas tarefas pendentes');
    } else {
        showNotification('📴 Notificações por WhatsApp DESATIVADAS');
    }
}

// ===== TESTAR ENVIO DE WHATSAPP =====
async function testarEnvioWhatsApp() {
    try {
        const currentUser = getCurrentUser();
        
        if (!currentUser) {
            showNotification('❌ Usuário não identificado!');
            return;
        }
        
        if (!nuraSettings.whatsappNumber) {
            showNotification('⚠️ Cadastre seu número de WhatsApp primeiro!');
            return;
        }
        
        if (!confirm('📱 Deseja enviar uma mensagem de teste para seu WhatsApp?')) {
            return;
        }
        
        showNotification('📱 Enviando mensagem de teste...');
        
        const response = await fetch(`${SETTINGS_API_URL}/api/whatsapp/enviar-resumo-teste`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': currentUser.id
            },
            body: JSON.stringify({
                user_id: currentUser.id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Mensagem enviada! Verifique seu WhatsApp.');
        } else {
            showNotification('❌ Erro: ' + (result.error || 'Não foi possível enviar'));
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        showNotification('❌ Erro ao enviar mensagem de teste');
    }
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
    
    // Salvar no banco
    await saveSettingsToDatabase();
    
    // Atualizar localStorage para sincronização rápida
    localStorage.setItem('darkMode', enabled);
    
    // Notificar darkMode.js
    window.dispatchEvent(new CustomEvent('darkModeUpdated', { 
        detail: { isDark: enabled } 
    }));
    
    showNotification(enabled ? '🌙 Modo escuro ativado' : '☀️ Modo claro ativado');
}

// ===== SINCRONIZAR COM DARKMMODE.JS =====
function syncDarkMode(isDark) {
    nuraSettings.darkMode = isDark;
    
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) {
        if (isDark) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }
    
    // Salvar no banco (sem notificação para evitar loop)
    saveSettingsToDatabase();
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

// ===== EVENTOS DO HTML - OTIMIZADO =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Inicializando event listeners...');
    
    // ===== MODO ESCURO (Específico) =====
    const darkModeToggle = document.querySelector('#appearance #darkModeToggle');
    if (darkModeToggle) {
        // Remover listeners antigos (evita duplicação)
        const newToggle = darkModeToggle.cloneNode(true);
        darkModeToggle.parentNode.replaceChild(newToggle, darkModeToggle);
        
        // Adicionar listener único
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Prevenir cliques rápidos
            if (this.classList.contains('animating')) return;
            this.classList.add('animating');
            
            const newState = !nuraSettings.darkMode;
            toggleDarkMode(newState);
            
            // Liberar após 500ms
            setTimeout(() => {
                this.classList.remove('animating');
            }, 500);
        });
        console.log('✅ Toggle de modo escuro inicializado');
    }
    
    // ===== CORES =====
    document.querySelectorAll('.color-option').forEach(color => {
        color.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const hexColor = this.getAttribute('data-color');
            setPrimaryColor(hexColor);
        });
    });
    
    // ===== OUTROS TOGGLE SWITCHES (Exceto modo escuro) =====
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        // Pular o toggle de modo escuro (já foi configurado acima)
        if (toggle.id === 'darkModeToggle') {
            console.log('⏭️ Pulando toggle de modo escuro (já configurado)');
            return;
        }
        
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const row = this.closest('.setting-row');
            if (!row) return;
            
            const label = row.querySelector('.setting-label');
            if (!label) return;
            
            const text = label.textContent.toLowerCase();
            
            console.log('🔘 Toggle clicado:', text);
            
            if (text.includes('ocultar tarefas') || text.includes('concluídas')) {
                toggleHideCompleted(!nuraSettings.hideCompleted);
            } else if (text.includes('destacar') || text.includes('urgentes')) {
                toggleHighlightUrgent(!nuraSettings.highlightUrgent);
            } else if (text.includes('sugestões')) {
                toggleAutoSuggestions(!nuraSettings.autoSuggestions);
            } else if (text.includes('resumo diário') || text.includes('email')) {
                toggleEmailNotifications(!nuraSettings.emailNotifications);
            } else {
                // Toggle genérico para outros botões
                this.classList.toggle('active');
                console.log('✅ Toggle genérico ativado');
            }
        });
    });
    
    // ===== TOGGLE DE WHATSAPP =====
    const whatsappToggle = document.getElementById('whatsapp-notifications');
    if (whatsappToggle) {
        whatsappToggle.addEventListener('change', async (e) => {
            await toggleWhatsappNotifications(e.target.checked);
        });
        console.log('✅ Toggle WhatsApp configurado');
    }
    
    // ===== CAMPO DE NÚMERO DE WHATSAPP =====
    const whatsappInput = document.getElementById('whatsapp-number');
    if (whatsappInput) {
        whatsappInput.addEventListener('blur', async () => {
            const numero = whatsappInput.value.trim();
            
            // Validar formato (apenas números)
            if (numero && !/^\d+$/.test(numero)) {
                showNotification('⚠️ Digite apenas números! Exemplo: 5511999887766');
                return;
            }
            
            // Verificar tamanho mínimo
            if (numero && numero.length < 12) {
                showNotification('⚠️ Número muito curto! Use o formato: 5511999887766');
                return;
            }
            
            nuraSettings.whatsappNumber = numero;
            await saveSettingsToDatabase();
            
            if (numero) {
                showNotification('✅ Número de WhatsApp salvo!');
            }
        });
        console.log('✅ Campo WhatsApp configurado');
    }
    
    // Selects
    document.querySelectorAll('.setting-row').forEach(row => {
        const select = row.querySelector('select');
        if (!select) return;
        
        const label = row.querySelector('.setting-label');
        if (!label) return;
        
        const text = label.textContent.toLowerCase();
        
        if (text.includes('exibição')) {
            select.addEventListener('change', function() {
                setViewMode(this.value);
            });
        } else if (text.includes('detalhamento')) {
            select.addEventListener('change', function() {
                setDetailLevel(this.value);
            });
        }
    });
    
    console.log('✅ Event listeners configurados!');
});

// ===== EXPORTAR FUNÇÕES =====
window.nuraSettingsFunctions = {
    loadSettingsFromDatabase,
    saveSettingsToDatabase,
    toggleHideCompleted,
    toggleHighlightUrgent,
    toggleAutoSuggestions,
    toggleEmailNotifications,
    toggleWhatsappNotifications,
    testarEnvioWhatsApp,
    setDetailLevel,
    setViewMode,
    getPlanInfo,
    selectPlan,
    cancelPlan,
    toggleDarkMode,
    syncDarkMode,
    setPrimaryColor,
    showNotification,
    getSettings: () => ({ ...nuraSettings })
};

// Exportar função de teste globalmente
window.testarEnvioWhatsApp = testarEnvioWhatsApp;

console.log('✅ settings.js carregado e pronto com suporte WhatsApp!');