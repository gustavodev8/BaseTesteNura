# Guia de Configuração do Bot do Telegram - Nura

## Passo 1: Criar o Bot no Telegram

1. Abra o Telegram e procure por **@BotFather**
2. Inicie a conversa e digite `/newbot`
3. Escolha um **nome** para o bot (ex: `Nura Task Bot`)
4. Escolha um **username** (deve terminar com "bot", ex: `NuraTaskBot` ou `SeuNomeNuraBot`)
5. O BotFather vai retornar um **TOKEN** similar a:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
   ```
6. **COPIE ESTE TOKEN** - você vai precisar dele!

## Passo 2: Configurar no Render (Produção)

### 2.1 Adicionar Variáveis de Ambiente

1. Acesse seu dashboard do Render
2. Vá no seu serviço Web (projeto Nura)
3. Clique em **"Environment"** no menu lateral
4. Clique em **"Add Environment Variable"**
5. Adicione as seguintes variáveis:

   **TELEGRAM_BOT_TOKEN:**
   - **Key:** `TELEGRAM_BOT_TOKEN`
   - **Value:** Cole o token que você recebeu do BotFather

   **NODE_ENV:**
   - **Key:** `NODE_ENV`
   - **Value:** `production`

   **WEBHOOK_URL (IMPORTANTE!):**
   - **Key:** `WEBHOOK_URL`
   - **Value:** Seu domínio do Render (ex: `seuapp.onrender.com`)
   - ⚠️ **SEM** https:// na frente, apenas o domínio!

6. Clique em **"Save Changes"**

### 2.2 Rodar a Migration do Banco de Dados

A migration para adicionar o campo `telegram_chat_id` já está criada. Ela será executada automaticamente na próxima vez que o servidor iniciar, ou você pode executar manualmente:

```bash
node database/migration/add_telegram_field.js
```

### 2.3 Reiniciar o Servidor

1. No Render, vá em **"Manual Deploy"**
2. Clique em **"Deploy latest commit"**
3. Aguarde o deploy concluir
4. Verifique os logs - você deve ver:
   ```
   ✅ Bot do Telegram inicializado com sucesso!
   🔔 Sistema de notificações aleatórias ativado
   ```

## Passo 3: Vincular sua Conta ao Telegram

### 3.1 No Telegram:

1. Procure pelo username do seu bot (ex: `@NuraTaskBot`)
2. Clique em **"START"** ou digite `/start`
3. Digite `/vincular`
4. O bot vai te mostrar um código (seu chat_id), algo como:
   ```
   Seu código: 123456789
   ```
5. **COPIE ESTE CÓDIGO**

### 3.2 No Sistema Nura:

1. Faça login no sistema Nura
2. Vá em **"Ajustes"** ou **"Configurações"**
3. Role até a seção **"Notificações"**
4. Encontre a seção **"Telegram"**
5. Cole o código no campo indicado
6. Clique em **"Vincular"**
7. Você verá a mensagem: ✅ **Telegram vinculado com sucesso!**

## Passo 4: Testar as Funcionalidades

### Comandos Disponíveis no Bot:

- `/start` - Mensagem de boas-vindas
- `/vincular` - Mostra seu código de vinculação
- `/minhastarefas` - Lista todas suas tarefas pendentes
- `/urgentes` - Mostra apenas tarefas urgentes
- `/resumo` - Estatísticas das suas tarefas
- `/ajuda` - Lista todos os comandos

### Notificações Automáticas:

✅ **Notificações Aleatórias:**
- Funcionam entre 8h e 20h (horário de Brasília)
- São enviadas em horários variados
- Chance de 40% a cada hora
- Lembram você das tarefas pendentes

✅ **Alertas de Tarefas Urgentes:**
- Quando você cria uma tarefa com prioridade "ALTA"
- Recebe uma notificação imediata no Telegram

## Funcionalidades do Sistema

### O que o Bot Faz:

1. **Notificações Aleatórias:**
   - Envia lembretes em horários variados durante o dia
   - Mensagens motivacionais personalizadas
   - Mostra quantas tarefas você tem pendentes
   - Destaca tarefas urgentes

2. **Comandos Interativos:**
   - Consultar tarefas pelo Telegram
   - Ver apenas urgentes
   - Obter estatísticas

3. **Alertas Inteligentes:**
   - Notificação instantânea para tarefas urgentes
   - Resumos personalizados

### Como Funciona o Sistema de Notificações Aleatórias:

```javascript
// Executa a cada hora (8h-20h)
// 40% de chance de enviar
// Aguarda tempo aleatório (0-50min) antes de enviar
// Mensagens variadas para não ficar repetitivo
```

## Solução de Problemas

### Bot não responde:

1. Verifique se o TOKEN está correto no Render
2. Confira os logs do servidor
3. Reinicie o servidor no Render

### Não recebo notificações:

1. Verifique se o Telegram está vinculado (página de Ajustes)
2. Certifique-se que tem tarefas pendentes
3. As notificações aleatórias funcionam apenas entre 8h-20h

### Erro ao vincular:

1. Certifique-se de copiar o código completo
2. Não adicione espaços antes/depois do código
3. Use /vincular no bot para obter um novo código

### Desvincular Telegram:

1. Vá em Ajustes > Notificações > Telegram
2. Clique em **"Desvincular"**
3. Confirme a ação

## Arquitetura Técnica

### Arquivos Criados/Modificados:

- `telegramService.js` - Lógica do bot e notificações
- `database/migration/add_telegram_field.js` - Migration para banco
- `server.js` - Integração com o servidor
- `public/html/Tela_Ajustes.html` - Interface de vinculação
- `public/scripts/settings.js` - Lógica frontend
- `public/css/Ajustes.css` - Estilos

### Fluxo de Vinculação:

```
1. Usuário inicia bot no Telegram (/start)
2. Bot retorna chat_id único
3. Usuário cola código no sistema Nura
4. Sistema armazena telegram_chat_id no banco
5. Bot passa a enviar notificações
```

### Segurança:

- Chat IDs são únicos por usuário
- Um Telegram só pode ser vinculado a uma conta
- Validação de propriedade (x-user-id header)

## Variáveis de Ambiente Necessárias

```env
TELEGRAM_BOT_TOKEN=seu_token_aqui
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
SENDGRID_API_KEY=...
```

## Próximos Passos (Opcional)

### Melhorias Futuras:

- [ ] Criar tarefas pelo Telegram
- [ ] Marcar tarefas como concluídas
- [ ] Editar tarefas existentes
- [ ] Personalizar horários de notificação
- [ ] Grupos do Telegram para equipes
- [ ] Estatísticas semanais/mensais

## Suporte

Se tiver problemas:

1. Verifique os logs do Render
2. Teste os comandos do bot
3. Confirme que todas as variáveis de ambiente estão configuradas
4. Verifique se a migration foi executada

---

**Pronto!** 🎉 Seu bot do Telegram está configurado e funcionando!
