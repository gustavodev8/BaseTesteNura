# 📊 Relatório Semanal com IA - Documentação

## 🎯 O que é?

Sistema de análise semanal de produtividade que usa **Gemini AI** para gerar insights personalizados sobre o desempenho do usuário, sugerindo melhorias e definindo metas.

## ✨ Funcionalidades

### 📈 Análise Automática
- ✅ Tarefas concluídas vs pendentes
- ⏳ Taxa de conclusão
- ⚠️ Tarefas atrasadas
- 🎯 Distribuição de prioridades

### 🤖 Insights com IA (Gemini)
- 📊 Resumo da semana
- ✅ Pontos positivos (conquistas)
- ⚠️ Pontos de atenção (áreas a melhorar)
- 💡 Sugestões práticas e acionáveis
- 🎯 Meta específica para próxima semana

### 📧 Envio Automático
- 🕐 Toda segunda-feira às 08:00 (Horário de Brasília)
- 📨 Por email (SendGrid)
- 📱 Por Telegram (se configurado)
- 👥 Para todos os usuários com opção ativada

## 🔧 Arquitetura

### Arquivos Criados/Modificados

**Backend:**
- `weeklyReportService.js` - Serviço completo de análise e envio
- `server.js` - Endpoints API e cron job

**Frontend:**
- `public/html/Tela_Ajustes.html` - Toggle de ativação
- `public/scripts/settings.js` - Integração com banco

**Banco de Dados:**
- Campo `weekly_report` na tabela `user_settings`

## 📡 API Endpoints

### GET /api/weekly-report/:userId
Gera relatório semanal para um usuário específico.

```javascript
// Request
GET /api/weekly-report/1
Headers: { 'x-user-id': '1' }

// Response
{
  "success": true,
  "stats": {
    "total": 15,
    "completed": 10,
    "inProgress": 3,
    "pending": 2,
    "completionRate": "66.7",
    "overdue": 1
  },
  "analysis": "📊 RESUMO DA SEMANA\n\nVocê teve uma semana produtiva...",
  "tasksCount": 15,
  "generatedAt": "2025-01-08T10:00:00Z"
}
```

### POST /api/weekly-report/send-all
Envia relatórios para todos os usuários com a opção ativada.

```javascript
// Request
POST /api/weekly-report/send-all

// Response
{
  "success": true,
  "sent": 5,
  "errors": 0,
  "total": 5
}
```

## 🗓️ Cron Job

```javascript
// Executa toda segunda-feira às 08:00
cron.schedule('0 8 * * 1', async () => {
    await weeklyReportService.sendWeeklyReportsToAll();
}, {
    timezone: "America/Sao_Paulo"
});
```

## 📊 Exemplo de Relatório Gerado

```
🗓️ RELATÓRIO SEMANAL - 08/01/2025

Olá João! 👋

📊 RESUMO DA SEMANA

Você teve uma semana produtiva com 66.7% de conclusão de tarefas.
Manteve bom ritmo com 10 tarefas finalizadas de 15 criadas.

✅ PONTOS POSITIVOS

• Excelente taxa de conclusão acima de 60%
• Nenhuma tarefa de alta prioridade ficou pendente
• Boa distribuição de prioridades nas tarefas

⚠️ PONTOS DE ATENÇÃO

• 1 tarefa atrasada precisa de atenção
• 3 tarefas em progresso há mais de 3 dias
• Tendência de criar mais tarefas do que consegue concluir

💡 SUGESTÕES PRÁTICAS

1. Reserve 30min na segunda para revisar tarefas atrasadas
2. Limite criação de novas tarefas até zerar as em progresso
3. Use técnica Pomodoro para tarefas em progresso
4. Defina prazos realistas considerando seu histórico

🎯 META PARA PRÓXIMA SEMANA

Concluir pelo menos 80% das tarefas criadas e zerar
as 3 tarefas que estão em progresso há mais tempo.

Continue assim! 💪

━━━━━━━━━━━━━━━━━━━━━
📊 ESTATÍSTICAS DA SEMANA:
━━━━━━━━━━━━━━━━━━━━━

✅ Concluídas: 10/15
📈 Taxa de conclusão: 66.7%
🚧 Em progresso: 3
⏳ Pendentes: 2
⚠️ Atrasadas: 1

---
NURA - Seu assistente de produtividade
```

## 🧪 Como Testar

### 1. Testar Manualmente (Gerar Relatório)

```bash
# 1. Certifique-se que o servidor está rodando
node server.js

# 2. Via navegador ou Postman:
GET http://localhost:3000/api/weekly-report/1
Headers: { 'x-user-id': '1' }

# 3. Ou use cURL:
curl -H "x-user-id: 1" http://localhost:3000/api/weekly-report/1
```

### 2. Testar Envio Automático

```bash
# Via Postman ou cURL:
POST http://localhost:3000/api/weekly-report/send-all

# Verificar logs do servidor para ver quantos foram enviados
```

### 3. Testar Toggle na Interface

```
1. Acesse: http://localhost:3000/public/html/Tela_Ajustes.html
2. Vá para aba "Notificações"
3. Localize "Relatório semanal"
4. Clique no toggle para ativar/desativar
5. Deve aparecer notificação de confirmação
6. Recarregue a página e veja se persistiu
```

### 4. Testar Cron Job (Forçar Execução)

Edite temporariamente o cron para executar em 1 minuto:

```javascript
// Em server.js, mude de:
cron.schedule('0 8 * * 1', ...  // Segunda às 08:00

// Para (executa todo minuto):
cron.schedule('* * * * *', ...  // A cada minuto (APENAS PARA TESTE!)
```

## 🔐 Configurações Necessárias

### Variáveis de Ambiente (.env)

```env
# IA - Gemini
GEMINI_API_KEY=sua_chave_gemini_aqui

# Email - SendGrid (opcional)
SENDGRID_API_KEY=sua_chave_sendgrid
SENDGRID_FROM_EMAIL=noreply@nura.com

# Telegram (opcional)
TELEGRAM_BOT_TOKEN=seu_token_telegram
```

## 🎨 Prompt da IA

O sistema usa um prompt estruturado que pede à IA:

1. **Resumo**: Visão geral do desempenho (2-3 linhas)
2. **Pontos Positivos**: 2-3 conquistas identificadas
3. **Pontos de Atenção**: 2-3 áreas para melhorar
4. **Sugestões Práticas**: 3-4 ações concretas
5. **Meta Semanal**: 1 meta específica e mensurável

> 💡 O prompt é otimizado para gerar análises **objetivas**, **motivadoras** e **acionáveis**.

## 📝 Lógica de Cálculo

```javascript
// Estatísticas calculadas:
- Total de tarefas (última semana)
- Concluídas (status = 'concluido')
- Em progresso (status = 'progresso')
- Pendentes (status = 'pendente')
- Atrasadas (due_date passou E não concluída)
- Taxa de conclusão = (concluídas / total) * 100

// Prioridades:
- Alta (priority = 'high')
- Média (priority = 'medium')
- Baixa (priority = 'low')
```

## 🚀 Próximos Passos (Opcionais)

- [ ] Gráficos visuais de produtividade
- [ ] Comparação com semanas anteriores
- [ ] Análise de padrões (dias mais produtivos)
- [ ] Sugestões de reorganização de prioridades
- [ ] Integração com WhatsApp
- [ ] Relatórios mensais
- [ ] Gamificação (badges de conquistas)

## 🐛 Troubleshooting

**Problema**: Relatório não é enviado

**Soluções**:
1. Verificar se `weekly_report = TRUE` no banco
2. Verificar se cron job está ativo (logs do servidor)
3. Verificar configuração de email/Telegram
4. Testar endpoint manualmente

**Problema**: IA não gera insights

**Soluções**:
1. Verificar se `GEMINI_API_KEY` está configurada
2. Verificar se há tarefas na última semana
3. Ver logs de erro no console do servidor

**Problema**: Toggle não persiste

**Soluções**:
1. Verificar se campo `weekly_report` existe no banco
2. Abrir console do navegador (F12) e ver erros
3. Testar endpoint GET /api/settings/:userId

## 💻 Stack Tecnológica

- **Backend**: Node.js + Express
- **IA**: Google Gemini 2.0 Flash Exp
- **Banco**: PostgreSQL (prod) / SQLite (local)
- **Cron**: node-cron
- **Email**: SendGrid
- **Mensagens**: Telegram Bot API

---

✅ **Implementação 100% em JavaScript/Node.js - Sem necessidade de Python!**
