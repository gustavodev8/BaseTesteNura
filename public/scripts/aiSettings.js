// ===== CONFIGURAÇÕES DE IA =====
// Gerencia as preferências de IA do usuário

// Configurações padrão
let aiSettings = {
    descriptionsEnabled: true,
    detailLevel: 'medio',
    optimizationEnabled: true
};

// Carregar configurações do localStorage
function loadAISettings() {
    const saved = localStorage.getItem('aiSettings');
    if (saved) {
        try {
            aiSettings = JSON.parse(saved);
        } catch (e) {
            console.error('Erro ao carregar configurações de IA:', e);
        }
    }
    return aiSettings;
}

// Salvar configurações no localStorage
function saveAISettings() {
    localStorage.setItem('aiSettings', JSON.stringify(aiSettings));
}

// Gerar descrição automática para uma tarefa
async function generateTaskDescription(taskTitle) {
    // Verifica se as descrições automáticas estão habilitadas
    if (!aiSettings.descriptionsEnabled) {
        return null;
    }

    try {
        console.log(`🤖 Solicitando descrição IA para: "${taskTitle}"`);

        const response = await fetch('https://basetestenura-3.onrender.com/api/ai/generate-description', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                taskTitle: taskTitle,
                detailLevel: aiSettings.detailLevel
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Descrição gerada:', data.description);
            return data.description;
        } else {
            console.error('❌ Erro ao gerar descrição:', data.error);
            return null;
        }

    } catch (error) {
        console.error('💥 Erro na requisição de descrição:', error);
        return null;
    }
}

// Inicializar configurações na tela de ajustes
function initAISettingsPage() {
    const descriptionsToggle = document.getElementById('aiDescriptionsToggle');
    const detailLevelSelect = document.getElementById('aiDetailLevel');
    const optimizationToggle = document.getElementById('aiOptimizationToggle');

    if (!descriptionsToggle || !detailLevelSelect || !optimizationToggle) {
        return; // Não está na página de ajustes
    }

    // Carregar configurações salvas
    loadAISettings();

    // Aplicar estado inicial
    if (aiSettings.descriptionsEnabled) {
        descriptionsToggle.classList.add('active');
    } else {
        descriptionsToggle.classList.remove('active');
    }

    detailLevelSelect.value = aiSettings.detailLevel;

    if (aiSettings.optimizationEnabled) {
        optimizationToggle.classList.add('active');
    } else {
        optimizationToggle.classList.remove('active');
    }

    // Event listeners
    descriptionsToggle.addEventListener('click', () => {
        descriptionsToggle.classList.toggle('active');
        aiSettings.descriptionsEnabled = descriptionsToggle.classList.contains('active');
        saveAISettings();
        showNotification(
            aiSettings.descriptionsEnabled
                ? 'Descrições automáticas ativadas'
                : 'Descrições automáticas desativadas'
        );
    });

    detailLevelSelect.addEventListener('change', () => {
        aiSettings.detailLevel = detailLevelSelect.value;
        saveAISettings();

        const levelNames = {
            'baixo': 'Baixo',
            'medio': 'Médio',
            'alto': 'Alto'
        };

        showNotification(`Nível de detalhamento: ${levelNames[aiSettings.detailLevel]}`);
    });

    optimizationToggle.addEventListener('click', () => {
        optimizationToggle.classList.toggle('active');
        aiSettings.optimizationEnabled = optimizationToggle.classList.contains('active');
        saveAISettings();
        showNotification(
            aiSettings.optimizationEnabled
                ? 'Sugestões de otimização ativadas'
                : 'Sugestões de otimização desativadas'
        );
    });
}

// Função auxiliar para mostrar notificações
function showNotification(message) {
    // Cria elemento de notificação se não existir
    let notification = document.querySelector('.ai-notification');

    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'ai-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #146551;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-size: 0.9rem;
            font-weight: 500;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(notification);
    }

    notification.textContent = message;

    // Anima entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);

    // Remove após 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
    }, 3000);
}

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAISettingsPage);
} else {
    initAISettingsPage();
}

// Exportar funções para uso global
window.aiSettings = {
    load: loadAISettings,
    save: saveAISettings,
    generateDescription: generateTaskDescription,
    get: () => aiSettings
};
