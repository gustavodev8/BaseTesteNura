// ==========================================
// SISTEMA DE ESTATÍSTICAS - NURA
// Versão: 1.0
// ==========================================

/**
 * Busca todas as tarefas do localStorage
 * @returns {Array} Array de tarefas
 */
function getTasks() {
    try {
        const tasks = localStorage.getItem('nura_tasks');
        return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
        console.error('❌ Erro ao buscar tarefas:', error);
        return [];
    }
}

/**
 * Calcula todas as estatísticas das tarefas
 * @returns {Object} Objeto com todas as estatísticas
 */
function calcularEstatisticas() {
    const tasks = getTasks();
    
    // Total de tarefas
    const totalTarefas = tasks.length;
    
    // Tarefas Ativas (não concluídas)
    const tarefasAtivas = tasks.filter(task => 
        task.status !== 'concluido'
    ).length;
    
    // Tarefas Em Andamento (status "progresso")
    const tarefasEmAndamento = tasks.filter(task => 
        task.status === 'progresso'
    ).length;
    
    // Tarefas Concluídas Hoje
    const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const concluidasHoje = tasks.filter(task => {
        // Verifica se está concluída E se a data é hoje
        return task.status === 'concluido' && task.dueDate === hoje;
    }).length;
    
    // Percentual de conclusão hoje
    const percentualConcluidas = totalTarefas > 0 
        ? Math.round((concluidasHoje / totalTarefas) * 100) 
        : 0;
    
    // Tarefas Pendentes
    const tarefasPendentes = tasks.filter(task => 
        task.status === 'pendente'
    ).length;
    
    return {
        totalTarefas,
        tarefasAtivas,
        tarefasEmAndamento,
        tarefasPendentes,
        concluidasHoje,
        percentualConcluidas
    };
}

/**
 * Atualiza os cards de estatísticas no DOM
 */
function atualizarEstatisticas() {
    const stats = calcularEstatisticas();
    
    // Atualizar Tarefas Ativas
    const ativasElement = document.getElementById('tarefas-ativas');
    if (ativasElement) {
        ativasElement.textContent = stats.tarefasAtivas;
    }
    
    // Atualizar Percentual Concluídas
    const percentualElement = document.getElementById('percentual-concluidas');
    if (percentualElement) {
        percentualElement.textContent = `${stats.percentualConcluidas}%`;
    }
    
    // Atualizar Em Andamento
    const andamentoElement = document.getElementById('tarefas-andamento');
    if (andamentoElement) {
        andamentoElement.textContent = stats.tarefasEmAndamento;
    }
    
    // Log para debug (pode remover em produção)
    console.log('📊 Estatísticas atualizadas:', stats);
}

/**
 * Inicializa o sistema de estatísticas
 */
function inicializarEstatisticas() {
    console.log('🚀 Inicializando sistema de estatísticas...');
    
    // Atualizar na carga da página
    atualizarEstatisticas();
    
    // Atualizar a cada 3 segundos (detectar mudanças)
    setInterval(atualizarEstatisticas, 3000);
    
    // Atualizar quando houver mudanças no localStorage (outras abas)
    window.addEventListener('storage', function(e) {
        if (e.key === 'nura_tasks') {
            console.log('🔄 Tarefas alteradas em outra aba. Atualizando estatísticas...');
            atualizarEstatisticas();
        }
    });
    
    console.log('✅ Sistema de estatísticas inicializado com sucesso!');
}

/**
 * Função auxiliar para forçar atualização manual
 * Útil para chamar após adicionar/remover/atualizar tarefas
 */
function forcarAtualizacaoEstatisticas() {
    atualizarEstatisticas();
}

/**
 * Função para exibir informações detalhadas no console (debug)
 */
function mostrarInfoEstatisticas() {
    const stats = calcularEstatisticas();
    const tasks = getTasks();
    
    console.log('\n📊 === INFORMAÇÕES DETALHADAS DAS ESTATÍSTICAS ===');
    console.log('📝 Total de tarefas:', stats.totalTarefas);
    console.log('✅ Tarefas ativas:', stats.tarefasAtivas);
    console.log('⏳ Em andamento:', stats.tarefasEmAndamento);
    console.log('⏸️  Pendentes:', stats.tarefasPendentes);
    console.log('🎉 Concluídas hoje:', stats.concluidasHoje);
    console.log('📈 Percentual concluído:', stats.percentualConcluidas + '%');
    console.log('================================================\n');
    
    if (tasks.length > 0) {
        console.log('📋 Lista de tarefas:');
        tasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.name} - Status: ${task.status} - Data: ${task.dueDate}`);
        });
    } else {
        console.log('ℹ️ Nenhuma tarefa cadastrada ainda.');
    }
}

// ==========================================
// AUTO-INICIALIZAÇÃO
// ==========================================

// Auto-inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarEstatisticas);
} else {
    // DOM já carregado
    inicializarEstatisticas();
}

// ==========================================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ==========================================

// Disponibilizar funções globalmente
window.calcularEstatisticas = calcularEstatisticas;
window.atualizarEstatisticas = atualizarEstatisticas;
window.forcarAtualizacaoEstatisticas = forcarAtualizacaoEstatisticas;
window.mostrarInfoEstatisticas = mostrarInfoEstatisticas;

// ==========================================
// INTEGRAÇÃO COM OUTRAS FUNÇÕES DO NURA
// ==========================================

/**
 * Hook para ser chamado após salvar tarefa
 * Adicione esta linha no seu código de salvar tarefa:
 * forcarAtualizacaoEstatisticas();
 */

/**
 * Hook para ser chamado após excluir tarefa
 * Adicione esta linha no seu código de excluir tarefa:
 * forcarAtualizacaoEstatisticas();
 */

/**
 * Hook para ser chamado após atualizar status
 * Adicione esta linha no seu código de atualizar status:
 * forcarAtualizacaoEstatisticas();
 */

console.log('📊 Sistema de Estatísticas NURA carregado!');
console.log('💡 Digite mostrarInfoEstatisticas() no console para ver detalhes');