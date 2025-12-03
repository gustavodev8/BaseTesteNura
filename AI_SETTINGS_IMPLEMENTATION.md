# 🤖 Implementação das Configurações de IA com Banco de Dados

## 📋 Resumo da Implementação

As configurações de IA (Descrições automáticas, Nível de detalhamento, Sugestões de otimização) agora estão **vinculadas ao banco de dados** e são **salvas por usuário**, assim como as demais configurações do sistema.

## 🔧 Arquivos Modificados

### 1. **database/init.js**
- Adicionada tabela `user_settings` com os campos de IA:
  - `ai_descriptions_enabled` (BOOLEAN, padrão: 1)
  - `ai_detail_level` (TEXT, padrão: 'medio')
  - `ai_optimization_enabled` (BOOLEAN, padrão: 1)

### 2. **database/migration/add_ai_settings.js** (NOVO)
- Script de migração para adicionar os campos de IA
- Verifica se a tabela existe e cria se necessário
- Adiciona campos novos sem perder dados existentes
- Pode ser executado com: `node database/migration/add_ai_settings.js`

### 3. **server.js**
- **GET /api/settings/:userId** (linhas 894-944)
  - Adicionado mapeamento dos campos de IA:
    ```javascript
    aiDescriptionsEnabled: settings.ai_descriptions_enabled !== false,
    aiDetailLevel: settings.ai_detail_level || 'medio',
    aiOptimizationEnabled: settings.ai_optimization_enabled !== false
    ```

- **POST /api/settings/:userId** (linhas 947-1041)
  - UPDATE: Incluído os 3 campos de IA na query
  - INSERT: Incluído os 3 campos de IA na criação de novos registros

### 4. **public/scripts/aiSettings.js**
Refatorado completamente para trabalhar com o banco de dados:

- **Novas funções:**
  - `getCurrentUserId()`: Obtém o ID do usuário logado
  - `loadAISettings()`: Carrega configurações do banco (com fallback para localStorage)
  - `loadAISettingsFromLocalStorage()`: Fallback quando não há conexão
  - `saveAISettings()`: Salva no banco preservando outros campos

- **Comportamento:**
  - Prioriza banco de dados
  - Fallback automático para localStorage se houver erro
  - Backup local após salvar no banco
  - Sincronização assíncrona

### 5. **Páginas HTML atualizadas:**
- `public/html/Tela_Inicial.html` (linha 511)
- `public/html/Tela_Gerenciamento.html` (linha 313)
- Ambas incluem: `<script src="../scripts/aiSettings.js"></script>`

## 🗄️ Estrutura da Tabela user_settings

```sql
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    -- Campos existentes
    hide_completed BOOLEAN DEFAULT 0,
    highlight_urgent BOOLEAN DEFAULT 1,
    auto_suggestions BOOLEAN DEFAULT 1,
    detail_level TEXT DEFAULT 'Médio',
    dark_mode BOOLEAN DEFAULT 0,
    primary_color TEXT DEFAULT '#49a09d',
    current_plan TEXT DEFAULT 'pro',
    plan_renewal_date TEXT DEFAULT '30 de dezembro de 2025',
    view_mode TEXT DEFAULT 'lista',
    email_notifications BOOLEAN DEFAULT 1,
    -- ✅ CAMPOS NOVOS DE IA
    ai_descriptions_enabled BOOLEAN DEFAULT 1,
    ai_detail_level TEXT DEFAULT 'medio',
    ai_optimization_enabled BOOLEAN DEFAULT 1,
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
```

## 🔄 Fluxo de Funcionamento

### 1. Carregar Configurações (ao abrir página)
```
Usuário acessa Tela_Ajustes.html
↓
aiSettings.js carrega automaticamente
↓
loadAISettings() é chamado
↓
Busca configurações do banco via API
↓
Se encontrar → aplica na interface
Se não encontrar → cria registro padrão
Se houver erro → usa localStorage como fallback
```

### 2. Salvar Configurações (ao alterar toggle/select)
```
Usuário clica em toggle ou select
↓
Event listener captura mudança
↓
aiSettings.descriptionsEnabled é atualizado
↓
saveAISettings() é chamado (async)
↓
Carrega todas as configurações atuais do banco
↓
Mescla com as novas configurações de IA
↓
Salva tudo de volta no banco
↓
Também salva no localStorage como backup
↓
Mostra notificação de sucesso
```

## 🧪 Como Testar

### 1. **Testar na Tela de Ajustes**
```
1. Abrir: http://localhost:3000/public/html/Tela_Ajustes.html
2. Ir para aba "Assistente IA"
3. Alterar toggle "Descrições por IA"
4. Verificar notificação: "🤖 Descrições automáticas ativadas"
5. Alterar "Nível de detalhamento" para "Alto"
6. Verificar notificação: "📊 Nível de detalhamento: Alto"
7. Recarregar a página
8. Verificar se as configurações persistiram
```

### 2. **Verificar no Console do Navegador**
```javascript
// Verificar configurações carregadas
✅ Configurações de IA carregadas do banco: {
    descriptionsEnabled: true,
    detailLevel: "medio",
    optimizationEnabled: true
}

// Ao salvar
✅ Configurações de IA salvas no banco
```

### 3. **Verificar no Banco de Dados**
```bash
# Ver configurações de IA do usuário 1
sqlite3 database/nura.db "SELECT user_id, ai_descriptions_enabled, ai_detail_level, ai_optimization_enabled FROM user_settings WHERE user_id = 1"
```

### 4. **Testar Descrições Automáticas**
```
1. Ir para Tela_Inicial.html ou Tela_Gerenciamento.html
2. Criar uma nova tarefa com título: "Estudar React"
3. Deixar descrição vazia
4. Salvar tarefa
5. Verificar no console: "🤖 Gerando descrição com IA..."
6. Aguardar: "✅ Descrição gerada pela IA!"
7. Abrir a tarefa e verificar descrição automática
```

### 5. **Testar Multi-usuário**
```
1. Logar com usuário A
2. Desativar "Descrições por IA"
3. Fazer logout
4. Logar com usuário B
5. Verificar que "Descrições por IA" está ativado (configuração independente)
6. Fazer logout
7. Logar novamente com usuário A
8. Verificar que "Descrições por IA" continua desativado (persistência)
```

## 📊 API Endpoints Utilizados

### GET /api/settings/:userId
```javascript
// Request
GET https://basetestenura-3.onrender.com/api/settings/1
Headers: { 'x-user-id': '1' }

// Response
{
  "success": true,
  "settings": {
    "hideCompleted": false,
    "highlightUrgent": true,
    "darkMode": false,
    // ... outros campos
    "aiDescriptionsEnabled": true,
    "aiDetailLevel": "medio",
    "aiOptimizationEnabled": true
  }
}
```

### POST /api/settings/:userId
```javascript
// Request
POST https://basetestenura-3.onrender.com/api/settings/1
Headers: { 'x-user-id': '1', 'Content-Type': 'application/json' }
Body: {
  "user_id": 1,
  "settings": {
    "hideCompleted": false,
    "highlightUrgent": true,
    // ... outros campos
    "aiDescriptionsEnabled": true,
    "aiDetailLevel": "alto",
    "aiOptimizationEnabled": true
  }
}

// Response
{
  "success": true,
  "message": "Configurações salvas com sucesso"
}
```

## ✅ Vantagens da Implementação

1. **Persistência por usuário**: Cada usuário tem suas próprias configurações
2. **Sincronização**: Configurações acessíveis de qualquer dispositivo
3. **Fallback robusto**: Se o banco falhar, usa localStorage
4. **Consistência**: Segue o mesmo padrão das outras configurações
5. **Escalabilidade**: Fácil adicionar novos campos de IA no futuro

## 🚀 Próximos Passos (Opcionais)

- [ ] Adicionar mais níveis de detalhamento personalizados
- [ ] Implementar cache de descrições geradas
- [ ] Adicionar histórico de descrições geradas por IA
- [ ] Permitir edição manual de descrições geradas
- [ ] Estatísticas de uso da IA por usuário

## 🐛 Troubleshooting

### Problema: Configurações não salvam
**Solução**: Verificar se o usuário está logado (`localStorage.getItem('nura_user')`)

### Problema: Erro ao carregar configurações
**Solução**: Executar migração: `node database/migration/add_ai_settings.js`

### Problema: API retorna 404
**Solução**: Certificar que a tabela `user_settings` existe no banco

### Problema: Configurações resetam ao recarregar
**Solução**: Verificar console do navegador para erros de conexão com API
