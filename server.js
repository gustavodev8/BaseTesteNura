const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // ✅ CORRIGIDO
const db = require('./database'); // usar o database.js

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); // ✅ CORRIGIDO

// ===== INICIALIZAR BANCO =====
db.initializeDatabase();

// ===== SERVIR ARQUIVOS ESTÁTICOS =====
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/scripts', express.static(path.join(__dirname, 'public/scripts')));
app.use('/imgs', express.static(path.join(__dirname, 'public/imgs')));

// ===== ROTAS PRINCIPAIS =====

app.get("/", (req, res) => {
    res.redirect('/login');
});

app.get("/api/status", async (req, res) => {
    try {
        const row = await db.get("SELECT COUNT(*) as count FROM tasks");
        
        res.json({ 
            status: "✅ Servidor Nura ONLINE!", 
            message: "Sistema funcionando perfeitamente!",
            gemini: GEMINI_API_KEY ? "✅ Configurada" : "❌ Faltando API Key",
            tarefas: row ? row.count : 0,
            database: db.isPostgres ? "🐘 PostgreSQL" : "💾 SQLite",
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.json({ 
            status: "✅ Servidor Nura ONLINE!", 
            message: "Sistema funcionando (erro no BD)",
            gemini: GEMINI_API_KEY ? "✅ Configurada" : "❌ Faltando API Key",
            timestamp: new Date().toISOString()
        });
    }
});

// ===== ROTAS PARA PÁGINAS HTML =====

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/Tela_Login.html'));
});

app.get('/Tela_Login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/Tela_Login.html'));
});

app.get('/inicial', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/Tela_Inicial.html'));
});

app.get('/Tela_Inicial.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/Tela_Inicial.html'));
});

app.get('/gerenciamento', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/Tela_Gerenciamento.html'));
});

app.get('/Tela_Gerenciamento.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/Tela_Gerenciamento.html'));
});

app.get('/criar-conta', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/Tela_CriaConta.html'));
});

app.get('/Tela_CriaConta.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/Tela_CriaConta.html'));
});

// ===== ROTAS DA API - TAREFAS =====

// GET - Buscar tarefas do usuário
app.get('/api/tasks', async (req, res) => {
    try {
        const userId = req.query.user_id || req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                error: 'Usuário não identificado' 
            });
        }
        
        const rows = await db.query(
            "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        
        console.log(`📥 ${rows.length} tarefas carregadas para usuário ${userId}`);
        
        res.json({ 
            success: true, 
            tasks: rows,
            total: rows.length 
        });
    } catch (err) {
        console.error('❌ Erro ao buscar tarefas:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// GET - Buscar tarefa específica
app.get('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.query.user_id || req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                error: 'Usuário não identificado' 
            });
        }
        
        const task = await db.get(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            [id, userId]
        );
        
        if (task) {
            res.json({ 
                success: true, 
                task: task 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Tarefa não encontrada' 
            });
        }
    } catch (err) {
        console.error('❌ Erro ao buscar tarefa:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// POST - Criar nova tarefa
app.post('/api/tasks', async (req, res) => {
    console.log('📥 Dados recebidos:', req.body);
    
    const title = req.body.title || req.body.name;
    const description = req.body.description || '';
    const status = req.body.status || 'pending';
    const priority = req.body.priority || 'medium';
    const user_id = req.body.user_id;

    if (!user_id) {
        return res.status(401).json({ 
            success: false, 
            error: 'Usuário não identificado' 
        });
    }

    if (!title) {
        return res.status(400).json({ 
            success: false, 
            error: 'Título da tarefa é obrigatório'
        });
    }

    try {
        let info;
        
        if (db.isPostgres) {
            // PostgreSQL retorna o ID
            const result = await db.query(
                `INSERT INTO tasks (user_id, title, description, status, priority) 
                 VALUES (?, ?, ?, ?, ?) RETURNING id`,
                [user_id, title, description, status, priority]
            );
            info = { lastInsertRowid: result[0].id };
        } else {
            info = await db.run(
                `INSERT INTO tasks (user_id, title, description, status, priority) 
                 VALUES (?, ?, ?, ?, ?)`,
                [user_id, title, description, status, priority]
            );
        }
        
        console.log(`✅ Tarefa criada para usuário ${user_id}:`, title);
        
        res.json({ 
            success: true, 
            message: 'Tarefa criada com sucesso!',
            taskId: info.lastInsertRowid
        });
    } catch (err) {
        console.error('❌ Erro ao criar tarefa:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao salvar tarefa no banco' 
        });
    }
});

// PUT - Atualizar tarefa
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, user_id } = req.body;
        
        if (!user_id) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não identificado'
            });
        }
        
        console.log(`🔄 Atualizando tarefa ${id} do usuário ${user_id}`);
        
        const taskExists = await db.get(
            "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
            [id, user_id]
        );
        
        if (!taskExists) {
            return res.status(404).json({
                success: false,
                error: 'Tarefa não encontrada'
            });
        }
        
        const updates = [];
        const values = [];
        
        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        if (priority !== undefined) {
            updates.push('priority = ?');
            values.push(priority);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum campo para atualizar'
            });
        }
        
        values.push(id);
        values.push(user_id);
        
        const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
        const result = await db.run(sql, values);
        
        console.log('✅ Tarefa atualizada!');
        
        res.json({
            success: true,
            message: 'Tarefa atualizada com sucesso!',
            changes: result.changes
        });
        
    } catch (err) {
        console.error('❌ Erro ao atualizar tarefa:', err);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar tarefa no banco'
        });
    }
});

// DELETE - Excluir tarefa
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.query.user_id || req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não identificado'
            });
        }
        
        console.log(`🗑️ Excluindo tarefa ${id} do usuário ${userId}...`);
        
        const task = await db.get(
            "SELECT title FROM tasks WHERE id = ? AND user_id = ?",
            [id, userId]
        );
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Tarefa não encontrada'
            });
        }
        
        const result = await db.run(
            "DELETE FROM tasks WHERE id = ? AND user_id = ?",
            [id, userId]
        );
        
        console.log(`✅ Tarefa "${task.title}" excluída!`);
        
        res.json({
            success: true,
            message: 'Tarefa excluída com sucesso!',
            changes: result.changes
        });
        
    } catch (err) {
        console.error('❌ Erro ao excluir tarefa:', err);
        res.status(500).json({
            success: false,
            error: 'Erro ao excluir tarefa do banco'
        });
    }
});

// ===== ROTA DE LOGIN =====

app.post("/api/login", async (req, res) => {
    console.log("🔐 Tentativa de login:", req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: "Usuário e senha são obrigatórios"
        });
    }
    
    try {
        // ✅ Buscar por name OU email (igual ao teste que funcionou!)
        const user = await db.get(
            `SELECT id, name, email FROM users 
             WHERE (name = ? OR email = ?) AND password = ?`,
            [username, username, password]
        );
        
        if (user) {
            console.log('✅ Login bem-sucedido:', user.name);
            res.json({
                success: true,
                message: "Login realizado com sucesso!",
                user: {
                    id: user.id,
                    username: user.name,
                    email: user.email
                }
            });
        } else {
            console.log('❌ Credenciais inválidas');
            res.status(401).json({
                success: false,
                error: "Usuário ou senha incorretos"
            });
        }
        
    } catch (err) {
        console.error('❌ Erro no login:', err);
        res.status(500).json({
            success: false,
            error: "Erro no servidor"
        });
    }
});

// ===== ROTA DE IA - GERAR ROTINA =====

app.post("/api/gerar-rotina", async (req, res) => {
    console.log("📥 Recebendo requisição para gerar rotina");
    
    try {
        const { descricao, horaInicio = "08:00", horaFim = "18:00" } = req.body;

        if (!descricao) {
            return res.status(400).json({ 
                success: false,
                error: "❌ Descrição do dia é obrigatória" 
            });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ 
                success: false,
                error: "❌ Chave da API Gemini não configurada" 
            });
        }

        console.log("🧠 Gerando rotina para:", descricao);

        const prompt = `
        Com base nesta descrição: "${descricao}"

        Horário: ${horaInicio} às ${horaFim}

        Crie uma rotina organizada em português com horários específicos, emojis e intervalos.
        Formato:
        🕗 08:00-09:00 → Atividade
        🕘 09:00-09:15 → Intervalo

        Apenas a rotina formatada, sem explicações.
        `;

        // ✅ CORRIGIDO - usar o método correto do Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rotina = response.text();

        console.log("✅ Rotina gerada com sucesso!");

        res.json({ 
            success: true, 
            rotina,
            modeloUsado: "gemini-pro",
            descricaoOriginal: descricao,
            periodo: `${horaInicio} - ${horaFim}`,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("💥 Erro ao gerar rotina:", err);
        res.status(500).json({ 
            success: false,
            error: "Erro ao gerar rotina",
            message: err.message
        });
    }
});

// ===== ENCERRAMENTO GRACIOSO =====
process.on('SIGINT', () => {
    db.close();
    console.log('✅ Conexão com BD fechada.');
    process.exit(0);
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
    console.log(`\n🎉 SERVIDOR NURA FUNCIONANDO!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔐 Login: http://localhost:${PORT}/login`);
    console.log(`🏠 Inicial: http://localhost:${PORT}/inicial`);
    console.log(`📊 Gerenciamento: http://localhost:${PORT}/gerenciamento`);
    console.log(`🤖 Gemini: ${GEMINI_API_KEY ? "✅ Configurada" : "❌ Faltando"}`);
    console.log(`💾 Banco: ${db.isPostgres ? "🐘 PostgreSQL (Produção)" : "💾 SQLite (Local)"}`);
    console.log(`\n🔑 Login padrão: admin / admin123`);
    console.log(`\n✅ Rotas de API disponíveis:`);
    console.log(`   GET    /api/tasks       - Listar tarefas (por usuário)`);
    console.log(`   GET    /api/tasks/:id   - Buscar tarefa (por usuário)`);
    console.log(`   POST   /api/tasks       - Criar tarefa (por usuário)`);
    console.log(`   PUT    /api/tasks/:id   - Atualizar tarefa (por usuário)`);
    console.log(`   DELETE /api/tasks/:id   - Excluir tarefa (por usuário)`);
    console.log(`\n👥 Sistema de tarefas separado por usuário ATIVO!`);
    console.log(`\n`);
});