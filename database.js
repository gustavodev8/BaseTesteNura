const { Pool } = require('pg');
require('dotenv').config();

// Detectar se está usando PostgreSQL
const isPostgres = !!process.env.DATABASE_URL;

let pool = null;

// Configurar conexão PostgreSQL
if (isPostgres) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    });

    console.log('🐘 Conectado ao PostgreSQL');
} else {
    console.log('⚠️ DATABASE_URL não encontrada');
    console.log('💡 Configure a variável DATABASE_URL no arquivo .env');
}

// Função para executar queries
async function query(text, params = []) {
    if (!pool) {
        throw new Error('Database not configured');
    }

    // Converter placeholders ? para $1, $2, etc (formato PostgreSQL)
    let paramIndex = 1;
    const pgText = text.replace(/\?/g, () => `$${paramIndex++}`);
    
    try {
        const result = await pool.query(pgText, params);
        return result.rows;
    } catch (err) {
        console.error('❌ Erro na query:', err.message);
        throw err;
    }
}

// Função para pegar uma única linha
async function get(text, params = []) {
    const rows = await query(text, params);
    return rows[0] || null;
}

// Função para executar comandos (INSERT, UPDATE, DELETE)
async function run(text, params = []) {
    if (!pool) {
        throw new Error('Database not configured');
    }

    let paramIndex = 1;
    const pgText = text.replace(/\?/g, () => `$${paramIndex++}`);
    
    try {
        const result = await pool.query(pgText, params);
        return {
            changes: result.rowCount,
            lastInsertRowid: result.rows[0]?.id || null
        };
    } catch (err) {
        console.error('❌ Erro ao executar comando:', err.message);
        throw err;
    }
}

// Inicializar banco de dados
async function initializeDatabase() {
    if (!pool) {
        console.log('⚠️ Banco de dados não configurado');
        return;
    }

    try {
        console.log('🔧 Verificando/criando tabelas...');

        // Criar tabela de usuários
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Criar tabela de tarefas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                priority VARCHAR(50) DEFAULT 'medium',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Tabelas verificadas/criadas com sucesso');

        // Verificar se já existe usuário admin
        const adminExists = await get(
            "SELECT id FROM users WHERE username = $1",
            ['admin']
        );

        if (!adminExists) {
            // Criar usuário admin padrão
            await pool.query(
                "INSERT INTO users (username, password, email) VALUES ($1, $2, $3)",
                ['admin', 'admin123', 'admin@nura.com']
            );
            console.log('✅ Usuário admin criado (admin/admin123)');
        } else {
            console.log('✅ Usuário admin já existe');
        }

    } catch (err) {
        console.error('❌ Erro ao inicializar banco:', err.message);
        throw err;
    }
}

// Fechar conexão
function close() {
    if (pool) {
        pool.end();
        console.log('✅ Conexão PostgreSQL fechada');
    }
}

module.exports = {
    query,
    get,
    run,
    initializeDatabase,
    close,
    isPostgres
};