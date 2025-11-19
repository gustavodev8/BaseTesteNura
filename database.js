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

    pool.on('error', (err) => {
        console.error('❌ Erro inesperado no PostgreSQL:', err);
    });

    console.log('🐘 Conectado ao PostgreSQL');
} else {
    console.log('⚠️ DATABASE_URL não encontrada');
    console.log('💡 Configure a variável DATABASE_URL no arquivo .env');
}

// Converter placeholders ? para $1, $2, etc (PostgreSQL)
function convertPlaceholders(text) {
    let paramIndex = 1;
    const converted = text.replace(/\?/g, () => `${paramIndex++}`);
    console.log('🔄 SQL Original:', text);
    console.log('🔄 SQL Convertido:', converted);
    return converted;
}

// Função para executar queries SELECT
async function query(text, params = []) {
    if (!pool) {
        throw new Error('Database not configured. Please set DATABASE_URL');
    }

    const pgText = convertPlaceholders(text);
    
    try {
        console.log('🔍 Query:', pgText, 'Params:', params);
        const result = await pool.query(pgText, params);
        return result.rows;
    } catch (err) {
        console.error('❌ Erro na query:', err.message);
        console.error('Query:', pgText);
        console.error('Params:', params);
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
        throw new Error('Database not configured. Please set DATABASE_URL');
    }

    const pgText = convertPlaceholders(text);
    
    try {
        console.log('⚙️ Run:', pgText, 'Params:', params);
        const result = await pool.query(pgText, params);
        return {
            changes: result.rowCount,
            lastInsertRowid: result.rows[0]?.id || null
        };
    } catch (err) {
        console.error('❌ Erro ao executar comando:', err.message);
        console.error('SQL:', pgText);
        console.error('Params:', params);
        throw err;
    }
}

// Inicializar banco de dados
async function initializeDatabase() {
    if (!pool) {
        console.log('⚠️ Banco de dados não configurado - pulando inicialização');
        return;
    }

    try {
        console.log('🔧 Testando conexão com PostgreSQL...');
        
        // Testar conexão primeiro com timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout de conexão (5s)')), 5000)
        );
        
        await Promise.race([
            pool.query('SELECT NOW()'),
            timeoutPromise
        ]);
        
        console.log('✅ Conexão com PostgreSQL estabelecida!');
        
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
        console.log('✅ Tabela users ok');

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
        console.log('✅ Tabela tasks ok');

        // Verificar se já existe usuário admin
        const adminExists = await get(
            "SELECT id FROM users WHERE username = ?",
            ['admin']
        );

        if (!adminExists) {
            // Criar usuário admin padrão
            const result = await pool.query(
                "INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id",
                ['admin', 'admin123', 'admin@nura.com']
            );
            console.log('✅ Usuário admin criado (admin/admin123) - ID:', result.rows[0].id);
        } else {
            console.log('✅ Usuário admin já existe - ID:', adminExists.id);
        }

        console.log('✅ Banco de dados inicializado com sucesso!');

    } catch (err) {
        console.error('❌ Erro ao inicializar banco:', err.message);
        console.error('Stack:', err.stack);
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