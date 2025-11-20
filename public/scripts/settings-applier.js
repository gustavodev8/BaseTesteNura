/* ========================================
   APLICADOR DE CONFIGURAÇÕES - NURA
   Arquivo: settings-applier.js
   Funcionalidade: Aplicar configurações em todas as páginas
   ======================================== */

let appliedSettings = {};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    // Carregar e aplicar configurações em qualquer página
    loadAndApplyGlobalSettings();
});

// ===== CARREGAR CONFIGURAÇÕES GLOBAIS =====
async function loadAndApplyGlobalSettings() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    try {
        // Tentar buscar do servidor primeiro
        const serverSettings = await fetchSettingsFromServer(currentUser.id);
        
        if (serverSettings) {
            appliedSettings = serverSettings;
        } else {
            // Fallback para localStorage
            const localSettings = JSON.parse(localStorage.getItem('nura_settings') || '{}');
            appliedSettings = localSettings;
        }
        
        // Aplicar configurações na página atual
        applyAllSettings();
        
        console.log('⚙️ Configurações carregadas e aplicadas:', appliedSettings);
        
    } catch (error) {
        console.log('📱 Usando configurações padrão');
        appliedSettings = {
            hideCompleted: true,
            highlightUrgent: true,
            darkMode: false,
            primaryColor: '#49a09d'
        };
        applyAllSettings();
    }
}

// ===== BUSCAR CONFIGURAÇÕES DO SERVIDOR =====
async function fetchSettingsFromServer(userId) {
    try {
        const response = await fetch(`https://basetestenura-3.onrender.com/api/settings/${userId}`, {
            headers: { 'x-user-id': userId.toString() }
        });
        
        const result = await response.json();
        return result.success ? result.settings : null;
    } catch (error) {
        console.log('📡 Erro ao buscar configurações do servidor');
        return null;
    }
}

// ===== APLICAR TODAS AS CONFIGURAÇÕES =====
function applyAllSettings() {
    applyDarkMode();
    applyPrimaryColor();
    applyTaskFiltering();
    applyTaskHighlighting();
}

// ===== APLICAR MODO ESCURO =====
function applyDarkMode() {
    if (appliedSettings.darkMode) {
        document.body.classList.add('dark-mode');
        console.log('🌙 Modo escuro aplicado');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// ===== APLICAR COR PRINCIPAL =====
function applyPrimaryColor() {
    if (appliedSettings.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', appliedSettings.primaryColor);
        console.log('🎨 Cor principal aplicada:', appliedSettings.primaryColor);
    }
}

// ===== APLICAR FILTROS DE TAREFA =====
function applyTaskFiltering() {
    // Aguardar um pouco para garantir que as tarefas foram carregadas
    setTimeout(() => {
        filterTasksBySettings();
    }, 1000);
    
    // Também aplicar sempre que a lista de tarefas for atualizada
    const observer = new MutationObserver(() => {
        filterTasksBySettings();
    });
    
    const taskContainer = document.getElementById('listaTarefas') || 
                         document.getElementById('task-list') ||
                         document.querySelector('.task-list');
    
    if (taskContainer) {
        observer.observe(taskContainer, { childList: true, subtree: true });
        console.log('👀 Observer de tarefas ativado');
    }
}

// ===== FILTRAR TAREFAS PELAS CONFIGURAÇÕES =====
function filterTasksBySettings() {
    const hideCompleted = appliedSettings.hideCompleted;
    const highlightUrgent = appliedSettings.highlightUrgent;
    
    // Buscar tarefas em diferentes possíveis containers
    const taskElements = [
        ...document.querySelectorAll('.list-group-item'),
        ...document.querySelectorAll('.task-item'),
        ...document.querySelectorAll('[data-task-id]')
    ];
    
    if (taskElements.length === 0) return;
    
    console.log(`🎯 Aplicando filtros em ${taskElements.length} tarefas`);
    console.log(`   - Ocultar concluídas: ${hideCompleted}`);
    console.log(`   - Destacar urgentes: ${highlightUrgent}`);
    
    taskElements.forEach(taskElement => {
        // 1. FILTRO: Ocultar tarefas concluídas
        const isCompleted = isTaskCompleted(taskElement);
        
        if (hideCompleted && isCompleted) {
            taskElement.style.display = 'none';
            taskElement.classList.add('hidden-by-filter');
        } else {
            taskElement.style.display = '';
            taskElement.classList.remove('hidden-by-filter');
        }
        
        // 2. DESTAQUE: Destacar tarefas urgentes
        const isUrgent = isTaskUrgent(taskElement);
        
        if (highlightUrgent && isUrgent && !isCompleted) {
            applyUrgentHighlight(taskElement);
        } else {
            removeUrgentHighlight(taskElement);
        }
    });
    
    // Verificar se todas as tarefas estão ocultas
    const visibleTasks = taskElements.filter(task => task.style.display !== 'none');
    
    if (visibleTasks.length === 0) {
        showEmptyTaskMessage();
    } else {
        hideEmptyTaskMessage();
    }
}

// ===== VERIFICAR SE TAREFA ESTÁ CONCLUÍDA =====
function isTaskCompleted(taskElement) {
    // Verificar por classes
    if (taskElement.classList.contains('completed-task') || 
        taskElement.classList.contains('completed') ||
        taskElement.classList.contains('concluida')) {
        return true;
    }
    
    // Verificar por texto no status
    const statusText = taskElement.textContent.toLowerCase();
    if (statusText.includes('concluí') || 
        statusText.includes('✅') ||
        statusText.includes('completed')) {
        return true;
    }
    
    // Verificar por atributos
    const status = taskElement.dataset.status;
    if (status === 'completed' || status === 'concluida' || status === 'concluído') {
        return true;
    }
    
    return false;
}

// ===== VERIFICAR SE TAREFA É URGENTE =====
function isTaskUrgent(taskElement) {
    // Verificar por prioridade alta
    const priority = taskElement.dataset.priority;
    if (priority === 'high' || priority === 'alta') {
        return true;
    }
    
    // Verificar por palavras-chave urgentes
    const text = taskElement.textContent.toLowerCase();
    const urgentKeywords = ['urgente', 'importante', 'prioridade', 'emergência', '🔴', '⚠️'];
    
    return urgentKeywords.some(keyword => text.includes(keyword));
}

// ===== APLICAR DESTAQUE DE URGÊNCIA =====
function applyUrgentHighlight(taskElement) {
    if (taskElement.classList.contains('urgent-highlighted')) return;
    
    taskElement.classList.add('urgent-highlighted');
    taskElement.style.cssText += `
        border-left: 4px solid #e74c3c !important;
        background: linear-gradient(90deg, rgba(231, 76, 60, 0.1) 0%, transparent 100%) !important;
        box-shadow: 0 2px 4px rgba(231, 76, 60, 0.1) !important;
    `;
    
    // Adicionar badge de urgência se não existir
    if (!taskElement.querySelector('.urgent-badge')) {
        const badge = document.createElement('span');
        badge.className = 'urgent-badge';
        badge.style.cssText = `
            background: #e74c3c;
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 0.7rem;
            font-weight: bold;
            margin-left: 8px;
        `;
        badge.textContent = '🔴 URGENTE';
        
        const titleElement = taskElement.querySelector('h5, .task-title, .setting-label');
        if (titleElement) {
            titleElement.appendChild(badge);
        }
    }
}

// ===== REMOVER DESTAQUE DE URGÊNCIA =====
function removeUrgentHighlight(taskElement) {
    taskElement.classList.remove('urgent-highlighted');
    taskElement.style.borderLeft = '';
    taskElement.style.background = '';
    taskElement.style.boxShadow = '';
    
    // Remover badge se existir
    const badge = taskElement.querySelector('.urgent-badge');
    if (badge) {
        badge.remove();
    }
}

// ===== MOSTRAR MENSAGEM DE LISTA VAZIA =====
function showEmptyTaskMessage() {
    const container = document.getElementById('listaTarefas') || 
                     document.getElementById('task-list');
    
    if (!container) return;
    
    // Remover mensagem existente
    const existing = container.querySelector('.filtered-empty-message');
    if (existing) return;
    
    const message = document.createElement('div');
    message.className = 'filtered-empty-message';
    message.style.cssText = `
        text-align: center;
        padding: 40px 20px;
        color: #666;
        font-style: italic;
    `;
    message.innerHTML = `
        <p>🎯 Todas as tarefas foram filtradas</p>
        <small>Ajuste suas configurações para ver mais tarefas</small>
    `;
    
    container.appendChild(message);
}

// ===== OCULTAR MENSAGEM DE LISTA VAZIA =====
function hideEmptyTaskMessage() {
    const message = document.querySelector('.filtered-empty-message');
    if (message) {
        message.remove();
    }
}

// ===== APLICAR CONFIGURAÇÕES EM TEMPO REAL =====
function applySettingUpdate(settingKey, value) {
    appliedSettings[settingKey] = value;
    
    switch (settingKey) {
        case 'darkMode':
            applyDarkMode();
            break;
        case 'primaryColor':
            applyPrimaryColor();
            break;
        case 'hideCompleted':
        case 'highlightUrgent':
            filterTasksBySettings();
            break;
    }
    
    // Salvar no localStorage para persistência
    localStorage.setItem('nura_settings', JSON.stringify(appliedSettings));
}

// ===== OBTER USUÁRIO ATUAL =====
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// ===== EXPORTAR FUNÇÕES =====
window.applySettingUpdate = applySettingUpdate;
window.loadAndApplyGlobalSettings = loadAndApplyGlobalSettings;

console.log('✅ settings-applier.js carregado!');