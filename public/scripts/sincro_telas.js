/* ========================================
   SISTEMA DE TAREFAS - COM SEPARAÇÃO POR USUÁRIO
   Arquivo: sincro_telas_updated.js
   VERSÃO ATUALIZADA COM CONFIGURAÇÕES
   ======================================== */

const API_URL = 'https://basetestenura-3.onrender.com';

let homeTasks = [];
let currentUser = null;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando sistema de tarefas...');
    
    // Obter usuário logado
    currentUser = getCurrentUser();
    
    if (!currentUser) {
        console.error('❌ Usuário não está logado!');
        window.location.href = '/login';
        return;
    }
    
    console.log('👤 Usuário logado:', currentUser.username);
    
    initializeTaskSystem();
    loadAndDisplayTasksFromDatabase();
    
    // ✅ CARREGAR CONFIGURAÇÕES APÓS INICIALIZAR
    setTimeout(() => {
        if (window.loadAndApplyGlobalSettings) {
            window.loadAndApplyGlobalSettings();
        }
    }, 1000);
});

// ===== INICIALIZAR SISTEMA DE TAREFAS =====
function initializeTaskSystem() {
    const btnAdicionar = document.getElementById('btnAdicionar');
    const blocoTarefas = document.getElementById('blocoTarefas');
    const textareaTarefa = document.getElementById('textareaTarefa');
    const btnSalvar = document.getElementById('btnSalvar');
    const btnCancelar = document.getElementById('btnCancelar');
    const listaTarefas = document.getElementById('listaTarefas');

    if (!btnAdicionar || !blocoTarefas || !textareaTarefa || !btnSalvar || !btnCancelar || !listaTarefas) {
        console.error('❌ Elementos do sistema de tarefas não encontrados!');
        return;
    }

    btnAdicionar.addEventListener('click', () => {
        blocoTarefas.classList.remove('escondido');
        textareaTarefa.focus();
    });

    btnCancelar.addEventListener('click', () => {
        blocoTarefas.classList.add('escondido');
        textareaTarefa.value = '';
    });

    btnSalvar.addEventListener('click', async () => {
        const texto = textareaTarefa.value.trim();
        
        if (!texto) {
            alert('Por favor, digite uma tarefa!');
            return;
        }

        if (!currentUser) {
            alert('❌ Erro: Usuário não identificado!');
            return;
        }

        try {
            const tarefaData = {
                title: texto,
                description: 'Tarefa criada na página inicial',
                status: 'pendente',
                priority: 'medium',
                user_id: currentUser.id // ✅ ENVIAR ID DO USUÁRIO
            };

            console.log('📤 Enviando tarefa:', tarefaData);

            const response = await fetch(`${API_URL}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tarefaData)
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Tarefa salva!');
                
                textareaTarefa.value = '';
                blocoTarefas.classList.add('escondido');
                
                loadAndDisplayTasksFromDatabase();
                showNotification('✅ Tarefa criada com sucesso!');
            } else {
                console.error('❌ Erro:', result.error);
                showNotification('❌ Erro ao salvar: ' + (result.error || 'Erro desconhecido'));
            }

        } catch (error) {
            console.error('💥 Erro de conexão:', error);
            showNotification('❌ Erro de conexão com o servidor');
        }
    });

    textareaTarefa.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            btnSalvar.click();
        }
    });

    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('show');
        });
    }
}

// ===== CARREGAR TAREFAS DO USUÁRIO =====
async function loadAndDisplayTasksFromDatabase() {
    if (!currentUser) {
        console.error('❌ Usuário não identificado!');
        return;
    }

    try {
        console.log(`📥 Carregando tarefas do usuário ${currentUser.username}...`);
        
        // ✅ ENVIAR user_id na query
        const response = await fetch(`${API_URL}/api/tasks?user_id=${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            homeTasks = data.tasks;
            console.log(`✅ ${homeTasks.length} tarefas carregadas`);
            
            renderAllTasks();
        } else {
            console.error('❌ Erro:', data.error);
            showEmptyState();
        }
    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        showEmptyState();
    }
}

// ===== RENDERIZAR TODAS AS TAREFAS =====
function renderAllTasks() {
    const container = document.getElementById('listaTarefas');
    if (!container) {
        console.error('❌ Container não encontrado!');
        return;
    }

    container.innerHTML = '';

    if (homeTasks.length === 0) {
        showEmptyState();
        return;
    }

    const sortedTasks = [...homeTasks].sort((a, b) => {
        const aCompleted = a.status === 'completed' || a.status === 'concluido' || a.status === 'concluída';
        const bCompleted = b.status === 'completed' || b.status === 'concluido' || b.status === 'concluída';
        
        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
    });
    
    // ✅ APLICAR CONFIGURAÇÕES APÓS RENDERIZAR
    setTimeout(() => {
        applyTaskFiltering();
        console.log('⚙️ Configurações aplicadas nas tarefas');
    }, 200);
}

// ===== CRIAR ELEMENTO DE TAREFA =====
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    const isCompleted = task.status === 'completed' || task.status === 'concluido' || task.status === 'concluída';
    
    taskDiv.className = `list-group-item d-flex justify-content-between align-items-center ${isCompleted ? 'completed-task' : ''}`;
    
    // ✅ ADICIONAR ATRIBUTOS PARA CONFIGURAÇÕES
    taskDiv.setAttribute('data-task-id', task.id);
    taskDiv.setAttribute('data-status', task.status || 'pending');
    taskDiv.setAttribute('data-priority', task.priority || 'medium');

    const taskTitle = task.title || task.name || 'Tarefa sem nome';

    const statusMap = {
        'pending': 'Pendente',
        'in_progress': 'Em Progresso', 
        'completed': 'Concluído',
        'pendente': 'Pendente',
        'progresso': 'Em Progresso',
        'concluido': 'Concluído',
        'concluída': 'Concluído'
    };
    const statusText = statusMap[task.status] || task.status;

    const priorityMap = {
        'high': 'Alta',
        'medium': 'Média',
        'low': 'Baixa'
    };
    const priorityText = priorityMap[task.priority] || task.priority || 'Média';

    const statusIcon = isCompleted ? '✅' : 
                      task.status === 'in_progress' || task.status === 'progresso' ? '🔄' : '⏳';

    taskDiv.innerHTML = `
        <div class="task-content" style="flex: 1;">
            <div class="d-flex justify-content-between align-items-center w-100">
                <div style="flex: 1;">
                    <h5 class="mb-1 ${isCompleted ? 'text-decoration-line-through text-muted' : ''}" style="font-size: 1.25rem; font-weight: 500;">
                        ${statusIcon} ${taskTitle}
                    </h5>
                    ${task.description ? `<p class="text-muted mb-0" style="font-size: 0.95rem;">${task.description}</p>` : ''}
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-outline-success" onclick="toggleTaskFromHome(${task.id})" title="${isCompleted ? 'Reabrir tarefa' : 'Concluir tarefa'}" style="font-size: 1.1rem; padding: 0.5rem 1rem;">
                        ${isCompleted ? '↶' : '✓'}
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteTaskFromHome(${task.id})" title="Excluir tarefa" style="font-size: 1.3rem; padding: 0.4rem 0.9rem;">
                        ×
                    </button>
                </div>
            </div>
        </div>
    `;

    return taskDiv;
}

// ===== APLICAR FILTROS DE TAREFA =====
function applyTaskFiltering() {
    // Obter configurações do localStorage
    const settings = JSON.parse(localStorage.getItem('nura_settings') || '{}');
    
    const hideCompleted = settings.hideCompleted !== false; // Padrão: true
    const highlightUrgent = settings.highlightUrgent !== false; // Padrão: true
    
    const taskElements = document.querySelectorAll('.list-group-item[data-task-id]');
    
    if (taskElements.length === 0) return;
    
    console.log(`🎯 Aplicando filtros em ${taskElements.length} tarefas`);
    console.log(`   - Ocultar concluídas: ${hideCompleted}`);
    console.log(`   - Destacar urgentes: ${highlightUrgent}`);
    
    let visibleCount = 0;
    
    taskElements.forEach(taskElement => {
        const isCompleted = taskElement.classList.contains('completed-task') || 
                           taskElement.dataset.status === 'completed' ||
                           taskElement.dataset.status === 'concluida' ||
                           taskElement.dataset.status === 'concluída';
        
        const isUrgent = taskElement.dataset.priority === 'high' || 
                        taskElement.dataset.priority === 'alta';
        
        // 1. FILTRO: Ocultar tarefas concluídas
        if (hideCompleted && isCompleted) {
            taskElement.style.display = 'none';
            taskElement.classList.add('hidden-by-filter');
        } else {
            taskElement.style.display = '';
            taskElement.classList.remove('hidden-by-filter');
            visibleCount++;
        }
        
        // 2. DESTAQUE: Destacar tarefas urgentes
        if (highlightUrgent && isUrgent && !isCompleted && taskElement.style.display !== 'none') {
            applyUrgentHighlight(taskElement);
        } else {
            removeUrgentHighlight(taskElement);
        }
    });
    
    // Verificar se todas as tarefas estão ocultas
    if (visibleCount === 0 && taskElements.length > 0) {
        showFilteredEmptyMessage();
    } else {
        hideFilteredEmptyMessage();
    }
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
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: bold;
            margin-left: 8px;
            display: inline-block;
        `;
        badge.textContent = 'URGENTE';
        
        const titleElement = taskElement.querySelector('h5');
        if (titleElement) {
            titleElement.appendChild(badge);
        }
    }
}

// ===== REMOVER DESTAQUE DE URGÊNCIA =====
function removeUrgentHighlight(taskElement) {
    taskElement.classList.remove('urgent-highlighted');
    
    // Remover estilos inline
    taskElement.style.borderLeft = '';
    taskElement.style.background = '';
    taskElement.style.boxShadow = '';
    
    // Remover badge se existir
    const badge = taskElement.querySelector('.urgent-badge');
    if (badge) {
        badge.remove();
    }
}

// ===== MOSTRAR MENSAGEM DE FILTRO VAZIO =====
function showFilteredEmptyMessage() {
    const container = document.getElementById('listaTarefas');
    if (!container) return;
    
    // Remover mensagem existente
    hideFilteredEmptyMessage();
    
    const message = document.createElement('div');
    message.className = 'filtered-empty-message';
    message.style.cssText = `
        text-align: center;
        padding: 40px 20px;
        color: #666;
        font-style: italic;
        background: #f8f9fa;
        border-radius: 8px;
        margin: 20px 0;
    `;
    message.innerHTML = `
        <p>🎯 Todas as tarefas foram filtradas pelas suas configurações</p>
        <small>Vá para <a href="Tela_Ajustes.html" style="color: #49a09d;">Configurações</a> para ajustar os filtros</small>
    `;
    
    container.appendChild(message);
}

// ===== OCULTAR MENSAGEM DE FILTRO VAZIO =====
function hideFilteredEmptyMessage() {
    const message = document.querySelector('.filtered-empty-message');
    if (message) {
        message.remove();
    }
}

// ===== ALTERAR STATUS =====
async function toggleTaskFromHome(id) {
    if (!currentUser) {
        alert('❌ Erro: Usuário não identificado!');
        return;
    }

    const task = homeTasks.find(t => t.id === id);
    if (!task) {
        console.error('❌ Tarefa não encontrada:', id);
        return;
    }

    const isCompleted = task.status === 'completed' || task.status === 'concluido' || task.status === 'concluída';
    const newStatus = isCompleted ? 'pendente' : 'concluída';
    
    console.log(`🔄 Alternando status da tarefa ${id}: ${task.status} → ${newStatus}`);
    
    try {
        const response = await fetch(`${API_URL}/api/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                status: newStatus,
                user_id: currentUser.id // ✅ ENVIAR user_id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Status atualizado!');
            task.status = newStatus;
            renderAllTasks();
            showNotification(newStatus === 'concluída' ? '✅ Tarefa concluída!' : '⏳ Tarefa reaberta!');
        } else {
            console.error('❌ Erro:', result);
            showNotification('❌ Erro ao atualizar tarefa');
        }
    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        showNotification('❌ Erro de conexão com o servidor');
    }
}

// ===== EXCLUIR TAREFA =====
async function deleteTaskFromHome(id) {
    if (!currentUser) {
        alert('❌ Erro: Usuário não identificado!');
        return;
    }

    const task = homeTasks.find(t => t.id === id);
    const taskName = task ? (task.title || task.name || 'esta tarefa') : 'esta tarefa';
    
    if (!confirm(`⚠️ Tem certeza que deseja excluir "${taskName}"?\n\nEsta ação não pode ser desfeita!`)) {
        return;
    }
    
    console.log(`🗑️ Excluindo tarefa ${id}...`);
    
    try {
        // ✅ ENVIAR user_id na URL
        const response = await fetch(`${API_URL}/api/tasks/${id}?user_id=${currentUser.id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Tarefa excluída!');
            homeTasks = homeTasks.filter(t => t.id !== id);
            renderAllTasks();
            showNotification('🗑️ Tarefa excluída com sucesso!');
        } else {
            console.error('❌ Erro:', result);
            showNotification('❌ Erro ao excluir tarefa');
        }
    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        showNotification('❌ Erro de conexão com o servidor');
    }
}

// ===== ESTADO VAZIO =====
function showEmptyState() {
    const container = document.getElementById('listaTarefas');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-4">
            <p class="text-muted mb-1">🎯 Nenhuma tarefa cadastrada ainda!</p>
            <small class="text-muted">Clique em "Adicionar Tarefa" para começar</small>
        </div>
    `;
}

// ===== ASSISTENTE IA =====
async function gerarRotinaInteligente() {
    const descricao = document.getElementById('descricaoRotina').value.trim();
    const horaInicio = document.getElementById('horaInicioRotina').value;
    const horaFim = document.getElementById('horaFimRotina').value;
    const resultadoDiv = document.getElementById('resultadoRotina');

    if (!descricao) {
        alert('Por favor, descreva seu dia!');
        return;
    }

    try {
        resultadoDiv.innerHTML = '<div class="ai-loading">🤖 Gerando sua rotina inteligente...</div>';
        resultadoDiv.style.display = 'block';

        const response = await fetch(`${API_URL}/api/gerar-rotina`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                descricao: descricao,
                horaInicio: horaInicio,
                horaFim: horaFim
            })
        });

        const result = await response.json();

        if (result.success) {
            resultadoDiv.innerHTML = `
                <div class="ai-success">
                    <h4>📅 Sua Rotina Inteligente</h4>
                    <div class="rotina-content">${formatarRotina(result.rotina)}</div>
                    <button class="btn btn-primary mt-3" onclick="salvarTarefasDaRotina(\`${result.rotina.replace(/`/g, '\\`')}\`)">
                        💾 Salvar Tarefas da Rotina
                    </button>
                </div>
            `;
        } else {
            resultadoDiv.innerHTML = `<div class="ai-error">❌ Erro: ${result.error}</div>`;
        }

    } catch (error) {
        console.error('Erro:', error);
        resultadoDiv.innerHTML = '<div class="ai-error">❌ Erro de conexão</div>';
    }
}

// ===== SALVAR TAREFAS DA ROTINA =====
async function salvarTarefasDaRotina(rotinaTexto) {
    if (!currentUser) {
        alert('❌ Erro: Usuário não identificado!');
        return;
    }

    const linhas = rotinaTexto.split('\n').filter(linha => linha.trim());
    let salvas = 0;
    
    for (const linha of linhas) {
        if (linha.includes('→') || linha.match(/\d{1,2}:\d{2}/)) {
            let texto = linha.split('→')[1] || linha;
            texto = texto.replace(/[🔴🟡🟢🕗🕙🕛🕑🕓🕕📚💪☕🍽️📊🚀🎯]/g, '').trim();
            
            if (texto && texto.length > 2) {
                const tarefa = {
                    title: texto.substring(0, 100),
                    description: 'Importado da rotina IA',
                    priority: 'medium',
                    status: 'pendente',
                    user_id: currentUser.id // ✅ ENVIAR user_id
                };

                try {
                    const response = await fetch(`${API_URL}/api/tasks`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(tarefa)
                    });

                    const result = await response.json();
                    if (result.success) {
                        salvas++;
                    }
                } catch (error) {
                    console.error('Erro:', error);
                }
            }
        }
    }

    showNotification(`✅ ${salvas} tarefas salvas!`);
    loadAndDisplayTasksFromDatabase();
}

// ===== FUNÇÕES AUXILIARES =====
function formatarRotina(texto) {
    return texto.split('\n').map(linha => {
        if (linha.trim()) {
            return `<div class="rotina-item">${linha}</div>`;
        }
        return '';
    }).join('');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #49a09d;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===== OBTER USUÁRIO ATUAL =====
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// ===== TORNA FUNÇÕES GLOBAIS =====
window.toggleTaskFromHome = toggleTaskFromHome;
window.deleteTaskFromHome = deleteTaskFromHome;
window.gerarRotinaInteligente = gerarRotinaInteligente;
window.salvarTarefasDaRotina = salvarTarefasDaRotina;
window.applyTaskFiltering = applyTaskFiltering;

console.log('✅ sincro_telas_updated.js carregado!');