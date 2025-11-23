const sgMail = require('@sendgrid/mail');
const db = require('./database');


// ===== CONFIGURAR SENDGRID =====
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

console.log('✅ SendGrid configurado!');

// ===== FUNÇÃO PARA GERAR RESUMO DIÁRIO =====
async function gerarResumoDiario(userId) {
    try {
        // Buscar tarefas pendentes do usuário
        const tasks = await db.query(
            `SELECT * FROM tasks 
             WHERE user_id = ? 
             AND status != 'completed' 
             ORDER BY 
                CASE priority 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                    ELSE 4 
                END,
                created_at DESC`,
            [userId]
        );

        if (tasks.length === 0) {
            return null; // Sem tarefas pendentes
        }

        // Separar por prioridade
        const highPriority = tasks.filter(t => t.priority === 'high');
        const mediumPriority = tasks.filter(t => t.priority === 'medium');
        const lowPriority = tasks.filter(t => t.priority === 'low');

        // Gerar HTML do email
        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #49a09d 0%, #5f9ea0 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .summary {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .task-section {
            margin-bottom: 25px;
        }
        .task-section h3 {
            font-size: 16px;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid;
        }
        .task-section.high h3 {
            color: #e74c3c;
            border-color: #e74c3c;
        }
        .task-section.medium h3 {
            color: #f39c12;
            border-color: #f39c12;
        }
        .task-section.low h3 {
            color: #2ecc71;
            border-color: #2ecc71;
        }
        .task-item {
            padding: 12px;
            margin: 8px 0;
            background: white;
            border-radius: 6px;
            border-left: 4px solid;
        }
        .task-item.high {
            border-left-color: #e74c3c;
            background: #fff5f5;
        }
        .task-item.medium {
            border-left-color: #f39c12;
            background: #fffaf0;
        }
        .task-item.low {
            border-left-color: #2ecc71;
            background: #f0fff4;
        }
        .task-title {
            font-weight: 600;
            font-size: 15px;
            color: #333;
            margin-bottom: 4px;
        }
        .task-description {
            font-size: 13px;
            color: #666;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 12px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #49a09d;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
            font-weight: 600;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }
        .stat-item {
            text-align: center;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #49a09d;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌅 Bom dia!</h1>
            <p>Seu resumo diário está pronto</p>
        </div>
        
        <div class="content">
            <p class="greeting">Olá! Aqui está o resumo das suas tarefas pendentes para hoje:</p>
            
            <div class="summary">
                <div class="stats">
                    <div class="stat-item">
                        <div class="stat-number">${tasks.length}</div>
                        <div class="stat-label">Total</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" style="color: #e74c3c">${highPriority.length}</div>
                        <div class="stat-label">Urgentes</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" style="color: #f39c12">${mediumPriority.length}</div>
                        <div class="stat-label">Médias</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" style="color: #2ecc71">${lowPriority.length}</div>
                        <div class="stat-label">Baixas</div>
                    </div>
                </div>
            </div>

            ${highPriority.length > 0 ? `
            <div class="task-section high">
                <h3>🔴 Tarefas Urgentes (${highPriority.length})</h3>
                ${highPriority.map(task => `
                    <div class="task-item high">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${mediumPriority.length > 0 ? `
            <div class="task-section medium">
                <h3>🟡 Tarefas Médias (${mediumPriority.length})</h3>
                ${mediumPriority.map(task => `
                    <div class="task-item medium">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${lowPriority.length > 0 ? `
            <div class="task-section low">
                <h3>🟢 Tarefas Baixa Prioridade (${lowPriority.length})</h3>
                ${lowPriority.map(task => `
                    <div class="task-item low">
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <center>
                <a href="https://basetestenura-3.onrender.com/inicial" class="button">
                    Acessar Nura App
                </a>
            </center>
        </div>
        
        <div class="footer">
            <p>Este é um email automático do Nura App</p>
            <p>Para parar de receber esses emails, desative nas configurações</p>
        </div>
    </div>
</body>
</html>
        `;

        return {
            html: emailHTML,
            taskCount: tasks.length
        };

    } catch (error) {
        console.error('❌ Erro ao gerar resumo:', error);
        throw error;
    }
}

// ===== FUNÇÃO PARA ENVIAR EMAIL =====
async function enviarResumoDiario(userId, userEmail, userName) {
    try {
        console.log(`📧 Gerando resumo para ${userName} (${userEmail})...`);

        const resumo = await gerarResumoDiario(userId);

        if (!resumo) {
            console.log(`✅ ${userName} não tem tarefas pendentes`);
            return { success: true, message: 'Sem tarefas pendentes' };
        }

        const msg = {
            to: userEmail,
            from: process.env.EMAIL_FROM, // Seu email verificado no SendGrid
            subject: `🌅 Bom dia! Você tem ${resumo.taskCount} tarefa(s) pendente(s)`,
            html: resumo.html
        };

        const response = await sgMail.send(msg);

        console.log(`✅ Email enviado para ${userName}!`);

        return {
            success: true,
            messageId: response[0].headers['x-message-id'],
            taskCount: resumo.taskCount
        };

    } catch (error) {
        console.error(`❌ Erro ao enviar email para ${userEmail}:`, error);
        
        if (error.response) {
            console.error('Detalhes do erro:', error.response.body);
        }
        
        throw error;
    }
}

// ===== ENVIAR PARA TODOS OS USUÁRIOS =====
async function enviarResumoParaTodos() {
    try {
        console.log('📬 Iniciando envio de resumos diários...');

        // Buscar todos os usuários
        const users = await db.query('SELECT id, name, email FROM users');

        console.log(`👥 ${users.length} usuários encontrados`);

        let enviados = 0;
        let erros = 0;
        let semTarefas = 0;

        for (const user of users) {
            try {
                const result = await enviarResumoDiario(user.id, user.email, user.name);
                
                if (result.message === 'Sem tarefas pendentes') {
                    semTarefas++;
                } else {
                    enviados++;
                }
                
                // Aguardar 1 segundo entre emails (evitar spam)
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Falha para ${user.name}:`, error.message);
                erros++;
            }
        }

        console.log(`\n📊 Resumo:`);
        console.log(`✅ Enviados: ${enviados}`);
        console.log(`➖ Sem tarefas: ${semTarefas}`);
        console.log(`❌ Erros: ${erros}`);

        return { enviados, semTarefas, erros, total: users.length };

    } catch (error) {
        console.error('❌ Erro geral:', error);
        throw error;
    }
}

module.exports = {
    enviarResumoDiario,
    enviarResumoParaTodos
};